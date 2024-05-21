export const checkCards = (deckTopCard, cardsInHand) => {
    let cardsToplay = []
    if (deckTopCard === null || cardsInHand === undefined || cardsInHand.length === 0) {
        return cardsToplay
    }

    cardsInHand.forEach(card => {
        if (card.color === deckTopCard.color 
            || card.value === deckTopCard.value
            || card.type === 'wild'
            ) {
            cardsToplay.push(card)
        }
    })

    return cardsToplay;
}