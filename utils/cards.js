
const generateCardPayload = require('../card-gen/card-namer')



/**
 * Back up method on generating cards in text base since multiple attempts of
 * getting the image version has failed.
 * @param {String} type A single character that represents type heart / spades / clubs / diamonds
 * @returns {Array}     An array that consists of the card base.
 */
const getCardType = (type) => {

    let spade_base = [
        " .  |",
        "| /.\\ |",
        "|(_._)|",
        "|  |  |",
    ];

    let diamond_base = [
        " ^  |",
        "| / \\ |",
        "| \\ / |",
        "|  v  |",
    ];

    let heart_base = [
        "_ _ |",
        "|( v )|",
        "| \\ / |",
        "|  v  |",
    ]

    let club_base = [
        " _  |",
        "| ( ) |",
        "|(_'_)|",
        "|  |  |",
    ];

    switch (type) {
        case 'D': return diamond_base;
            break;
        case 'C': return club_base;
            break;
        case 'H': return heart_base;
            break;
        case 'S': return spade_base;
            break;
    }
}

/**
 * Back up method on generating cards in text base since multiple attempts of
 * getting the image version has failed.
 * @param {Array} cardArray Array of card objects with 'type' and 'rank'
 * @returns {String}        A string that represents the text base version of the cards.
 */
const textBasedCards = (cardArray) => {
    let card_set = ["", "", "", "", "", ""];
    //length of card array determines the number of cards
    for (card of cardArray) { //type, rank in each.
        console.log('This card --->', card);
        let thisCard = getCardType(card.type);
        card_set[0] += " _____ ";
        card_set[2] += thisCard[1];
        card_set[3] += thisCard[2];
        card_set[4] += thisCard[3];

        if (card.rank === '10') {
            card_set[1] += `|${card.rank}` + thisCard[0].slice(1);
            card_set[5] += "|___" + `${card.rank}|`;
        }
        else {
            card_set[1] += `|${card.rank}` + thisCard[0];
            card_set[5] += "|____" + `${card.rank}|`;
        }
    }

    return `${card_set.join('\n')}`;

}



/**
 * 
 * @param {object} data Contains card names. Using card names to generate file name and make another attempt to grab the image url.
 * @returns {object} returns the data object with either a url or a text base card.
 */
const retryGetCommonCards = async (data) => {

    //Generate file name
    let imageURL = generateCardPayload(data.cards)
    let url = `https://imai-poker-utils.herokuapp.com/iu/${imageURL.cardName}`;
    try {
        let img = await axios.get(url);
        console.log("Got img back!");
        console.log(img);

        data.this_block_message[1].image_url = img.url;
        return data.this_block_message;
    } catch (error) {
        console.log("Error logged, could not get img..");
        console.log(error);
        let text = data.this_block_message[3].text.text.slice();
        //Generate text base card name.
        data.this_block_message[3].text.text = "```" + `${textBaseCard(data.cards)}` + "``` \n" + text;
    }
}

/**
 *  !! INCOMPLETE !! NEED PRIVATE MSG IN ORDER TO BE FURTHER CORRECTED !!
 */
const retryGetPairCards = async (data) => {
    //function requestForCardImage(card_array, message, playersID) {
    //console.log(chalk.magenta('CARDS ARRAY -'));
    //console.log(card_array);
    let image_url_array = [];
    async.eachOf(card_array, async (p, idx, callback1) => {
        let cards = generateCardPayload(p);
        let url = `https://imai-poker-utils.herokuapp.com/iu/${cards.cardName}`;

        try {
            let img = await axios.get(url);
            console.log("Got img back!");
            console.log(img);

            data.this_block_message[1].image_url = img.url;
            return data.this_block_message;
        } catch (error) {
            console.log("Error logged, could not get img..");
            console.log(error);
            let text = data.this_block_message[3].text.text.slice();
            //Generate text base card name.
            data.this_block_message[3].text.text = "```" + `${textBaseCard(data.cards)}` + "``` \n" + text;
        }

        callback1();

    }, (err) => {
        console.log(chalk.magenta('card-gen | Sending common cards back'));
        console.log(chalk.magenta(JSON.stringify(card_array)));

        return card_array
        // process.send({ topic: message, data: image_url_array });
        if (err)
            console.log(err);
    });
}


// console.log(textBasedCards([
//     { rank: 'A', type: 'D' },
//     { rank: '10', type: 'D' },
//     { rank: 'A', type: 'D' },
//     { rank: '10', type: 'D' }]
// ));
module.exports = {
    retryGetCommonCards,
    retryGetPairCards
}