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
        deck.push({ type: 'wild', value: wild });
        deck.push({ type: 'wild', value: wild });
    }

    return deck;
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


export async function initalizePlayer(userId, roomId) {
    try {
        //check for room
        const roomUser = await db.models.roomUser.findOne({ where: { roomId, userId } });
        if (!roomUser) {
            console.log("user: " + userid, " in: " + roomId + " not found");
            res.status(500).json({ error: ("user: " + userid + " in: ", roomId + " not found")});
        }
 
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}


//function to setup game_state entry to beginning state for this game
export async function initalizeGameState(roomId, players) {
    try {
        //initalize drawDeck and discardDeck
        try {
            newDeck = createUnoDeck();
            newDeck = shuffle(newDeck);
            card = drawCard(newDeck)
            newDiscardDeck = []
            newDiscardDeck.unshift(card)    //add card to beginning of the discardDeck array
            newplayerOrder = shuffle(players)
        } catch (err) {
            console.log(err);
            res.status(500).json({ error: err.message });
        }
        
        const game = await db.models.gameState.create({
            roomId: roomId,
            currentPlayerTurn: 0,
            direction: 1,
            playerOrder: newplayerOrder,
            drawAmount: 1,
            drawDeck: newDeck,
            discardDeck: newDiscardDeck,
            discardDeckTopCard: card,
        });

        res.status(201).json(game);
    } catch (err) {
        console.log(err);
        res.status(500).json({ error: err.message });
    }
}




