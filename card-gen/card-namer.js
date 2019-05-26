const cardTranslator = (card) => {
    // const translatedCards = [];
    let translatedCard = {};

    switch (card.type) {
        case "C": translatedCard.type = '0';
            break;
        case "H": translatedCard.type = '1';
            break;
        case "S": translatedCard.type = '2';
            break;
        case "D": translatedCard.type = '3';
            break;
        default: throw new Error("That aint a type yo.");
    }

    switch (card.rank) {
        case "A": translatedCard.rank = '0';
            break;
        case "J": translatedCard.rank = '10';
            break;
        case "Q": translatedCard.rank = '11';
            break;
        case "K": translatedCard.rank = '12';
            break;
        default: translatedCard.rank = card.rank;
    }

    return translatedCard;
}

const generateCardPayload = (cardArray) => {

    let cardObj = {
        cardName: "",
        cards: []
    }
    cardArray.forEach(card => {
        thisCard = cardTranslator(card)
        cardObj.cards.push(thisCard);
        cardObj.cardName += `${thisCard.rank}-${thisCard.type}_`;
    });

    cardObj.cardName = cardObj.cardName.slice(0, -1);
    return cardObj;
}


// console.log(generateCardPayload([{ "rank": "Q", "type": "C" }, { "rank": "A", "type": "S" }]))
module.exports = generateCardPayload;