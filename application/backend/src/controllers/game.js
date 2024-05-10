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
    //fromDeck is array of cards
    //toDeck is array of cards
    //put all cards fromDeck into toDeck then shuffle toDeck
    Array.prototype.push.apply(toDeck, fromDeck);
    console.log(toDeck);
    console.log('-----apply--------');
    console.log(fromDeck);
    shuffle(toDeck)
    console.log('-------shuffled------');
    console.log(toDeck);
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

        //initalize game state entry for this room +
        //initialize each player's player state entry
        //change room status to playing +
        try {
            const newDeck = createUnoDeck();
            console.log("----------newDeck------------")
            console.log(newDeck);
            console.log("-----------Deck-----------")
            const deck = shuffle(newDeck);
            console.log(deck);
            console.log("---------TopCard-------------")
            const topCard = drawCard(deck)
            console.log(topCard);
            //if wild player picks color
            //if wild4 shuffle back in deck and redraw
            //how to implement player picks color?
            //You have to match either by the number, color, or the symbol/Action.
            //gameplay usually follows a clockwise direction
            //if the Draw Pile becomes depleted and no one has yet won the round, take the Discard Pile, 
            //shuffle it, and turn it over to regenerate a new Draw Pile.
            while(topCard.value === 'wild_draw_four') {
                //put it back into deck and reshuffle then draw again
                const putCardInEmptyArray = []
                putCardInEmptyArray.push(topCard);
                reshuffle(putCardInEmptyArray, deck)

                //try again
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
            const gameState = await db.models.gameState.create({
                roomId: roomId,
                currentPlayerTurn: 0,
                direction: 1,
                playerOrder: newplayerOrder,
                drawAmount: 1,
                drawDeck: deck,
                discardDeck: newDiscardDeck,
                discardDeckTopCard: topCard,
            }, {transaction });


            //initalize each player
            //use transaction
            userIds.forEach(userId => {


            });


            await transaction.commit();
            console.log("starting new game: " + roomId)

            startAttempt.status = "playing";
            await startAttempt.save();

            const initPlayersAttempt = await initalizePlayers(userIds);
            if(!initPlayersAttempt) {
                console.log(err);
                return null;
            }

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
    try {
        const room = await db.models.room.findOne({ where: { roomId }} );
        if(!room) {
            console.log('room does not exist: ' + roomId);
            return null;
        }

        const gameState = await db.models.gameState.findOne( { where: { roomId }});
        if(!gameState) {
            console.log('gameState does not exist for: ' + roomId);
            return null;
        }

        try {
            room.status = 'waiting';
            await room.save();

            await gameState.destroy();
            console.log('cleaned up game: ' + roomId);
        } catch (innerErr) {
            console.log(innerErr);
            throw innerErr;
        }
    } catch (err) {
        console.log(err);
        return null;
    }
}


