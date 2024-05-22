import db from '@/database';
import { checkUtil } from '@/utils'


export function createUnoDeck()  {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const specialCards = ['skip', 'reverse', 'draw2'];
    const wildCards = ['wildchange', 'wilddraw4'];
    const numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

    let deck = [];
    for (let color of colors) {
        for (let number of numbers) {
            deck.push({ type: 'number', color: color, value: number });
            if (number !== '0') {
                deck.push({ type: 'number', color: color, value: number });
            }
        }

        for (let special of specialCards) {
            deck.push({ type: 'special', color: color, value: special });
            deck.push({ type: 'special', color: color, value: special });
        }
    }

    for (let wild of wildCards) {
        deck.push({ type: 'wild', color: null, value: wild });
        deck.push({ type: 'wild', color: null, value: wild });
    }

    return deck;
}


export function reshuffle(fromDeck, toDeck) {
    //put all cards fromDeck into toDeck then shuffle toDeck
    Array.prototype.push.apply(toDeck, fromDeck);
    shuffle(toDeck)
    //reset wild type cards to color: null
    toDeck.forEach(card => {
        if (card.type === 'wild') {
            card.color = null;
        }
    });
}

//Fisher-Yates shuffle algorithmn
export function shuffle(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }

    return deck;
}


export function drawCard(deck) {
    if(deck.length === 0) {
        return null;
    }
    return deck.shift();        //remove first card from deck array
}

function initializePlayerHand(deck, userIds) {
    const playerHands = {};
    for (let i = 0; i < userIds.length; i++) {
        playerHands[userIds[i]] = [];
        for (let j = 0; j < 7; j++) {
            playerHands[userIds[i]].push(deck.shift());
        }
    }
    return playerHands;
}

export async function startGame(roomId, userId) {
    const transaction = await db.transaction();
    try {

        const startAttempt = await db.models.room.findOne( { where: { roomId } } );
        if(!startAttempt) {
            console.log('cannot find game to start: ' + roomId);
            return null;
        }

        const roomLead = await db.models.roomUser.findOne( { where: { roomId, userId, isHost: true } } );
        if (!roomLead) {
            console.log('you are not the room leader: ' + userId);
            return null;
        }

        const players = await db.models.roomUser.findAll( { where: {roomId} } )
        if(players.length === 0) {
            console.log('problem getting roomUsers for this room: ' + roomId);
            return null;
        }
        if (players.length < startAttempt.maxplayer) {
            console.log('not enough players to start game: ' + roomId);
            return null;
        }

        const userIds = players.map(player => player.userId);
        const id_socketIdMap = {};
        for (let i = 0; i < players.length; i++) {
            id_socketIdMap[players[i].userId] = players[i].socketId;
        }
        if(!userIds) {
            console.log('problem extracting userIds from players inside game.js');
            return null;
        }

        try {
            const newDeck = createUnoDeck();
            console.log("-----------Deck-----------")
            const deck = shuffle(newDeck);
            console.log(deck);
            console.log("-----------Init Player Hands-----------")
            const initPlayerHands = initializePlayerHand(deck, userIds);
            // to fill playerHands array we call draw(deck)
            //all players need to be initalized then move on so the deck contents are consistent
            const playerCreationPromises = userIds.map(async (userId) => {
                const newPlayerHand = initPlayerHands[userId];

                const playerState = await db.models.playerState.create({
                    userId: userId,
                    roomId: roomId,
                    playerHandCount: 7,
                    playerHand: newPlayerHand,
                }, { transaction });
                return playerState;
            })
            console.log("---------TopCard-------------")
            let topCard = drawCard(deck)
            console.log(topCard);
            //if wild player picks color --> in the inital game_state if the top card is wild
            //then its color will be null --> when the first turn begins
            //that player will decide which color to set it to
            //when wild cards are shuffled back into a deck reset their color to null
            //if wild4 shuffle back in deck and redraw
            while(topCard.value === 'wilddraw4') {
                const putCardInEmptyArray = []
                putCardInEmptyArray.push(topCard);
                reshuffle(putCardInEmptyArray, deck)
                topCard = drawCard(deck);
            }

            if (topCard.value === 'wildchange') { 
                const randomNumber = Math.random();
                topCard.color = randomNumber < 0.25 ? 'red' : randomNumber < 0.5 ? 'blue' : randomNumber < 0.75 ? 'green' : 'yellow';
            }

            console.log("----------empty discard deck------------")
            const newDiscardDeck = []
            console.log(newDiscardDeck)
            console.log("---------discard deck after draw-------------")
            newDiscardDeck.unshift(topCard)    //add card to beginning of the discardDeck array
            console.log(newDiscardDeck)
            console.log("-----------players-----------")
            console.log(userIds)
            console.log("-----------new players-----------")
            const newplayerOrder = shuffle(userIds)
            console.log(newplayerOrder);
            console.log("----------------------")

            //initalize all the player states then move on to gamestate
            await Promise.all(playerCreationPromises);

            // decide current player index and direction by top card
            const direction = topCard.value === 'reverse' ? -1 : 1;
            let currentPlayerIndex;
            if (topCard.value === 'skip') {
                currentPlayerIndex = 1;
            } else if (topCard.value === 'reverse') {
                currentPlayerIndex = userIds.length - 1;
            } else {
                currentPlayerIndex = 0;
            }

            const gameState = await db.models.gameState.create({
                roomId: roomId,
                currentPlayerIndex: currentPlayerIndex,
                direction: direction,
                playerOrder: newplayerOrder,
                drawAmount: 1,
                drawDeck: deck,
                discardDeck: newDiscardDeck,
                discardDeckTopCard: topCard,
            }, { transaction });

            startAttempt.status = "playing";
            await startAttempt.save({ transaction });

            console.log("starting new game: " + roomId)
            await transaction.commit();

            return {
                "roomId": roomId,
                "playerOrder": newplayerOrder,
                "nextTurn": newplayerOrder[currentPlayerIndex],
                "direction": direction,
                "playersHand": initPlayerHands,
                "discardDeckTopCard": topCard,
                "socketIdMap": id_socketIdMap
            }
        } catch (err) {
            console.log(err);
            return null;
        }
    } catch (err) {
        console.log(err);
        return null;
    }
}


export async function cleanUpGame(roomId) {
    const transaction = await db.transaction();
    try {
        const room = await db.models.room.findOne({ where: { roomId }} );
        if(!room) {
            console.log('room does not exist: ' + roomId);
            return null;
        }
        if(room.status !== 'playing') {
            console.log('there is no game to end');
            return null;
        }

        const gameState = await db.models.gameState.findOne( { where: { roomId }});
        if(!gameState) {
            console.log('gameState does not exist for: ' + roomId);
            return null;
        }

        const playerStates = await db.models.playerState.findAll( { where: { roomId }} );
        if(playerStates.length === 0) {
            console.log('no player states for this game: ' + roomId);
            return null;
        }

        try {
            //destory all player states then move on
            if(playerStates.length > 0) {
                await Promise.all(playerStates.map(playerState => playerState.destroy({ transaction })));
                console.log('all player states destoryed successfully');
            }

            room.status = 'waiting';
            await room.save( { transaction });

            await gameState.destroy({ transaction });
            console.log('cleaned up game: ' + roomId);

            await transaction.commit();
        } catch (innerErr) {
            console.log(innerErr);
            throw innerErr;
        }
    } catch (err) {
        console.log(err);
        return null;
    }
}

export async function playerDrawCard(roomId, userId) {
    const transaction = await db.transaction();
    try {
        const gameState = await db.models.gameState.findOne( { where: { roomId }});
        if(!gameState) {
            console.log('gameState does not exist for: ' + roomId);
            return null;
        }

        const playerState = await db.models.playerState.findOne( { where: { roomId, userId }});
        if(!playerState) {
            console.log('playerState does not exist for: ' + userId);
            return null;
        }

        // update current player index
        const playerOrder = gameState.playerOrder;
        const currentPlayerIndex = Array.from(playerOrder).findIndex(playerId => playerId === Number(userId));
        gameState.currentPlayerIndex = currentPlayerIndex;

        // decide how many cards to draw
        const topCard = gameState.discardDeckTopCard;
        let countNeedToDraw;
        if (topCard.value === 'wilddraw4') {
            countNeedToDraw = 4;
        } else if (topCard.value === 'draw2') {
            countNeedToDraw = 0;
            let index = 0;
            while (index < gameState.discardDeck.length && gameState.discardDeck[index].value === 'draw2') {
                countNeedToDraw += 2;
                index++;
            }
        } else {
            countNeedToDraw = 1;
        }

        // draw cards from drawDeck
        const newCards = [];
        for (let i = 0; i < countNeedToDraw; i++) {
            newCards.push(drawCard(gameState.drawDeck));
        }
        gameState.changed('drawDeck', true);

        playerState.playerHand = playerState.playerHand.concat(newCards);
        playerState.playerHandCount = playerState.playerHandCount + countNeedToDraw;
        playerState.changed('playerHand', true);
        await playerState.save( { transaction });

        // decide next player index
        const direction = gameState.direction;
        let nextPlayerIndex;
        if (direction === 1) {
            nextPlayerIndex = (currentPlayerIndex + 1) % playerOrder.length;
        } else {
            nextPlayerIndex = currentPlayerIndex === 0 ? playerOrder.length - 1 : currentPlayerIndex - 1;
        }
        
        gameState.currentPlayerIndex = nextPlayerIndex;

        await gameState.save( { transaction });

        await transaction.commit();
        return {
            "userId": userId,
            "roomId": roomId,
            "drawnCards": newCards,
            "cardsCountDrawn": countNeedToDraw,
            "nextTurn": playerOrder[nextPlayerIndex],
            "direction": direction
        };
    } catch (err) {
        transaction.rollback();
        console.log(err);
        return null;
    }    

}

export async function playerPlayCard(roomId, userId, card) {
    const transaction = await db.transaction();
    try {
        const gameState = await db.models.gameState.findOne( { where: { roomId }});
        if(!gameState) {
            console.log('gameState does not exist for: ' + roomId);
            return null;
        }

        const playerState = await db.models.playerState.findOne( { where: { roomId, userId }});
        if(!playerState) {
            console.log('playerState does not exist for: ' + userId);
            return null;
        }
        
        // check if card can be played
        const deckTopCard = gameState.discardDeckTopCard;
        const cardsInHand = playerState.playerHand;
        const cardsToPlay = checkUtil.checkCards(deckTopCard, cardsInHand);
        if (cardsToPlay.length === 0) {
            console.log('no cards to play');
            return null;
        } else {
            const cardToPlay = cardsToPlay.find(playerCard => playerCard.type === card.type && playerCard.color === card.color && playerCard.value === card.value);
            if (!cardToPlay) {
                console.log('card cannot be played');
                return null;
            }
        }

        // get index of card to be played
        const index = playerState.playerHand.findIndex(playerCard => playerCard.type === card.type && playerCard.color === card.color && playerCard.value === card.value);
        if (index === -1) {
            console.log('card not found in player hand');
            return null;
        }

        // update current player index
        const playerOrder = gameState.playerOrder;
        const currentPlayerIndex = Array.from(playerOrder).findIndex(playerId => playerId === Number(userId));
        gameState.currentPlayerIndex = currentPlayerIndex;

        // update discard deck
        playerState.playerHand.splice(index, 1);
        playerState.playerHandCount = playerState.playerHandCount - 1;
        playerState.changed('playerHand', true);
        await playerState.save( { transaction });

        // update discard deck
        gameState.discardDeck.unshift(card);
        gameState.discardDeckTopCard = card;
        gameState.changed('discardDeck', true);
        gameState.changed('discardDeckTopCard', true);
        let nextPlayerIndex;
        
        // decide direction and next turn
        if (card.value === 'reverse') {
            gameState.direction = gameState.direction * -1;
            nextPlayerIndex = currentPlayerIndex + gameState.direction;
        } else if (card.value === 'skip') {
            nextPlayerIndex = currentPlayerIndex + gameState.direction * 2;
        }

        if (nextPlayerIndex < 0) {
            nextPlayerIndex = playerOrder.length + nextPlayerIndex;
        } else if (nextPlayerIndex >= playerOrder.length) {
            nextPlayerIndex = nextPlayerIndex % playerOrder.length;
        }
        
        await gameState.save( { transaction });

        await transaction.commit();
       
        return {
            "userId": userId,
            "roomId": roomId,
            "discardDesckTop": card,
            "playerHandCount": playerState.playerHandCount,
            "direction": gameState.direction,
            "nextTurn": playerOrder[nextPlayerIndex],
        };
    } catch (err) {
        transaction.rollback();
        console.log(err);
        return null;
    }
}

export async function getPlayerList(req, res) {
    // get method roomId from req
    const { roomId } = req.params;
    console.log('getting player list for room: ' + roomId);
    try {
        const roomCrated = await db.models.room.findOne({
            where: { roomId },
            attributes: ['maxplayer', 'status'],
        });
        const players = await db.models.roomUser.findAll({
            where: { roomId },
            attributes: ['userId', 'isHost', 'score', 'connected'],
            order: [['isHost', 'DESC']]
        });
        if (!players) {
            console.log('problem getting player list');
            return null;
        }
        const userIds = players.map(player => player.userId);
        if(!userIds) {
            console.log('problem extracting userIds from players inside game.js');
            return null;
        }
        const userNames = await db.models.user.findAll({
            where: { userId: userIds },
            attributes: ['userName'],
        });


        for (let i = 0; i < players.length; i++) {
            players[i].dataValues.userName = userNames[i].userName;
        }
        res.json({ max_player: roomCrated.maxplayer, player_list: players, gamePlaying: roomCrated.status === "playing"});
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}

//used to give a reconnected user their player state back
export async function getPlayerState(userId, roomId) {
    const playerState = await db.models.playerState.findOne( { where: { roomId, userId }});
    if(!playerState) {
        console.log('playerState does not exist for: ' + userId);
        return null;
    }
    return playerState
}

export async function getGameState(roomId, userId) {
    const gameState = await db.models.gameState.findOne( { where: {roomId} })
    if(!gameState) {
        console.log('gameState does not exist for: ' + roomId )
        return null
    }
    const playerState = await db.models.playerState.findOne( { where: { roomId, userId }});
    if(!playerState) {
        console.log('playerState does not exist for: ' + userId);
        return null;
    }
    
    return {
        "roomId": roomId,
        "playerOrder": gameState.playerOrder,
        "nextTurn": gameState.playerOrder[gameState.currentPlayerIndex],
        "direction": gameState.direction,
        "playersHand": playerState.playerHand,
        "discardDeckTopCard": gameState.discardDeckTopCard
        // "socketIdMap": id_socketIdMap
    }
}

export async function userReconnected(userId, roomId) {
    const userInfo = await db.models.roomUser.findOne( { where: {userId, roomId }})
    if (!userInfo) {
        console.log('unable to find user: ' + userId + "in room: " + roomId)
        return null
    }
    userInfo.connected = true

    await userInfo.save()
}

export async function userDisconnected(userId, roomId) {
    const userInfo = await db.models.roomUser.findOne( { where: {userId, roomId }})
    if (!userInfo) {
        console.log('unable to find user: ' + userId + "in room: " + roomId)
        return null
    }
    userInfo.connected = false

    await userInfo.save()
}

export async function getRoomIsPlaying(roomId) {
    const room = await db.models.room.findOne( { where: { roomId }})
    if (!room) {
        console.log('unable to find room: ' + roomId)
        return null
    }
    return room.status === 'playing'
}