
const generateCardPayload = require('../card-gen/card-namer');
const chalk = require("chalk");
const axios = require("axios");
/**
 * Back up method on generating cards in text base since multiple attempts of
 * getting the image version has failed.
 * @param {String} type A single character that represents type heart / spades / clubs / diamonds
 * @returns {String}     An string with the symbol.
 */
const getCardType = (type) => {

    let spade_base = "|  ♠  |";

    let diamond_base = "|  ♢  |";

    let heart_base = "|  ♡  |";

    let club_base = "|  ♣  |";

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

    let card_set = ["", "", "", ""];
    //length of card array determines the number of cards
    for (card of cardArray) { //type, rank in each.
        let thisCard = getCardType(card.type);
        card_set[0] += " _____ ";
        card_set[2] += thisCard;

        if (card.rank === '10') {
            card_set[1] += `|${card.rank}` + "   |";
            card_set[3] += "|___" + `${card.rank}|`;
        }
        else {
            card_set[1] += `|${card.rank}` + "    |";
            card_set[3] += "|____" + `${card.rank}|`;
        }
    }

    return "```" + card_set.join('\n') + "```";

}

/**
 * Fall-back attempt to get common cards again. If fail, generates text base cards
 * @param {object}  data Contains card names. Using card names to generate file name and make another attempt to grab the image url.
 * @param {Array}   data.cards Array of cards
 * @returns {object} returns the data object with either a url or a text base card.
 */
const retryGetCommonCards = async (cards) => {

    //Generate file name
    let imageURL = generateCardPayload(cards)
    let url = `https://imai-poker-utils.herokuapp.com/iu/${imageURL.cardName}`;
    try {
        let img = await axios.get(url);
        console.log("Got img back!");
        console.log(img);

        if (img.warning) {
            console.log(chalk.red("Cards.js | WARNING : Imgur says ", img.warning))
        }
        return img.url;
        // return data.this_block_message;
    } catch (error) {
        console.log("Error logged, could not get img..");
        console.log(error);
        return null;
    }
}

/**
 *  Generates a pair of cards or returns null.
 *  @param  {Array}     data        Array of 2 card objects
 *  @param  {Object}    data.cards  card objects
 *  @returns {String|null}               URL or null
 */
const retryGetPairCards = async (data) => {
    console.log("cards---------------------");
    console.log(p);
    let cards = generateCardPayload(p);
    let url = `https://imai-poker-utils.herokuapp.com/iu/${data.cards.cardName}`;

    try {
        let img = await axios.get(url);
        console.log("Got img back!");
        console.log(img);

        if (img.warning) {
            console.log(chalk.red("Cards.js | WARNING : Imgur says ", img.warning))
        }
        return img.url;
    } catch (error) {
        console.log("Error logged, could not get img..");
        console.log(error);
        return null;
    }
}

/**
 * Slices cards from the textcard array depending on current session
 * @param {Array} textCards Array of the 5 cards for this round
 * @param {String} session  FLOP/TURN/RIVER
 * @returns Array of cards 
 */
const cardCombo = (textCards, session) => {
    console.log(chalk.red("---------------textCards----------------------"))
    console.log(textCards);
    cardArr = [];
    if (session === "FLOP") {
        cardArr = textCards.slice(0, 3);
    }
    else if (session === "TURN") {
        cardArr = textCards.slice(0, 4);
    }
    else if (session === "RIVER") {
        cardArr = [...textCards];
    }
    else {
        return null;
    }

    return cardArr
}

module.exports = {
    textBasedCards,
    retryGetCommonCards,
    retryGetPairCards,
    cardCombo
}