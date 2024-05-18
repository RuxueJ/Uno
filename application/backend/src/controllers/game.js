import db from '@/database';


export function createUnoDeck()  {
    const colors = ['red', 'blue', 'green', 'yellow'];
    const specialCards = ['skip', 'reverse', 'draw_two'];
    const wildCards = ['wild', 'wild_draw_four'];
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

        const userIds = players.map(player => player.userId);
        if(!userIds) {
            console.log('problem extracting userIds from players inside game.js');
            return null;
        }

        // to fill playerHands array we call draw(deck)
        //all players need to be initalized then move on so the deck contents are consistent
        const playerCreationPromises = userIds.map(async (userId) => {
            const newPlayerHand = [];

            const playerState = await db.models.playerState.create({
                userId: userId,
                roomId: roomId,
                playerHandCount: 7,
                playerHand: newPlayerHand,
            }, { transaction });
            return playerState;
        })

        try {
            const newDeck = createUnoDeck();
            console.log("-----------Deck-----------")
            const deck = shuffle(newDeck);
            console.log(deck);
            console.log("---------TopCard-------------")
            let topCard = drawCard(deck)
            console.log(topCard);
            //if wild player picks color --> in the inital game_state if the top card is wild
            //then its color will be null --> when the first turn begins
            //that player will decide which color to set it to
            //when wild cards are shuffled back into a deck reset their color to null
            //if wild4 shuffle back in deck and redraw
            while(topCard.value === 'wild_draw_four') {
                const putCardInEmptyArray = []
                putCardInEmptyArray.push(topCard);
                reshuffle(putCardInEmptyArray, deck)
                topCard = drawCard(deck);
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

            const gameState = await db.models.gameState.create({
                roomId: roomId,
                currentPlayerTurn: 0,
                direction: 1,
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

            return gameState;
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

export async function getPlayerList(req, res) {
    // get method roomId from req
    const { roomId } = req.params;
    console.log('getting player list for room: ' + roomId);
    try {
        const players = await db.models.roomUser.findAll({
            where: { roomId },
            attributes: ['userId', 'isHost', 'score', 'connected'],
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
        res.json({ player_list: players });
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}
