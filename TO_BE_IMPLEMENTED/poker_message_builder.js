const base_template = [
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "" //Insert section here
        }
    },
    {
        "type": "image",
        "title": {
            "type": "plain_text",
            "text": "", //Insert Text here.
            "emoji": true
        },
        "image_url": "", //Insert image URL here
        "alt_text": "" //Alt msg here
    },
    {
        "type": "divider"
    },
    {
        "type": "section",
        "text": {
            "type": "plain_text",
            "text": "Collecting user bets soon....",
            "emoji": true
        }
    }
]
const card_name_translator = (cards) => {

    translatedCards = []
    for (let idx = 0; idx < cards.length; idx++) {
        let thisCard = "";
        switch (cards[idx].rank) {
            case 'K': thisCard = "King of ";
                break;
            case 'Q': thisCard = "Queen of ";
                break;
            case 'J': thisCard = "Jack of ";
                break;
            case 'A': thisCard = "Ace of ";
                break;
            default: thisCard = cards[idx].rank + " of ";
        }

        switch (cards[idx].type) {
            case 'D': thisCard += 'Diamonds';
                break;
            case 'C': thisCard = "Clubs";
                break;
            case 'S': thisCard = "Spades";
                break;
            case 'H': thisCard = "Hearts";
                break;
            default: throw new Error("Unexpect card type came in ... ");
        }

        translatedCards.push(thisCard);
        thisCard = "";

    }
    return translatedCards.join(', ');

}

const FLOP = (data) => {
    flop_block = [...base_template];
    flop_block[0].text = ":diamonds: Session : *FLOP*";
    flop_block[1].text = `First three cards : ${card_name_translator(data.cards)} ... what now?`;
    flop_block[1].image_url = data.cardImages[0].url;
    flop_block[1].alt_text = "Three cards shown!";

    return flop_block;
}

const RIVER = (data) => {
    flop_block = [...base_template];
    flop_block[0].text = ":clubs: Session : *RIVER*";
    flop_block[1].text = `New card : ${card_name_translator(data.cards)} ... what now?`;
    flop_block[1].image_url = data.cardImages[0].url;
    flop_block[1].alt_text = "Four cards shown!";

    return flop_block;
}

const TURN = (data) => {
    flop_block = [...base_template];
    flop_block[0].text = ":HEART: Session : *TURN*";
    flop_block[1].text = `New card : ${card_name_translator(data.cards)} ... what now?`;
    flop_block[1].image_url = data.cardImages[0].url;
    flop_block[1].alt_text = "Five cards shown!";

    return flop_block;
}

module.exports = {
    FLOP,
    RIVER,
    TURN
}
// data = {
//     type: 'cards',
//     cards:
//         // [{ rank: 'Q', type: 'D' },
//         // { rank: '9', type: 'C' },
//         [{ rank: 'K', type: 'D' }],
//     handId: '[1824] tester: 1/1',
//     session: 'FLOP',
//     cardImages: [{ index: 0, url: 'https://i.imgur.com/8RXhBew.png' }]
// };
// console.log(RIVER(data, base_template));