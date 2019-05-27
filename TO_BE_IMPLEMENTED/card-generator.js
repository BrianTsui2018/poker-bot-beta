const request = require('request');
const generateCardPayload = require('./card-namer');
const chalk = require('chalk');
const async = require("async");



let allCommonCards = [];

//Communicates with parent thread (Tournament)
process.on("message", (msg) => {
    switch (msg.topic) {
        case "common-cards":
            console.log(chalk.magenta("card-gen | Msg = common-cards"));
            for (let idx = 0; idx < msg.data.length; idx++) {
                //This carry the all card rank&type in PREFLOP, FLOP, TURN, RIVER..
                allCommonCards.push(msg.data[idx]) //Common cards are stored in the idx-th slot
            }
            let commoncards_array = [allCommonCards]; //Wrap around with another array to make use of the repeated code.

            requestForCardImage(commoncards_array);

            break;
        case "card-pairs":
            let cardPairs = [];
            console.log(JSON.stringify(msg.data));
            for (let idx = 0; idx < msg.data.length; idx++) {
                cardPairs.push(msg.data[idx].cards); //Card pairs are stored in each idx's "cards"
            }
            requestForCardImage(cardPairs);
            break;
        default:
            //Any uncaught messages are here:
            console.log(chalk.red("card-gen | Uncaught topic! ", msg.topic));
    }
})


/**
 * Takes a generated card payload and fires a request to the Utils app for PHE
 * @param {[Object]} card_array Array of objects such as { 'rank' : 'A', 'type': 'C'} for Ace of Clubs.
 */
function requestForCardImage(card_array) {
    console.log(chalk.magenta('CARDS ARRAY -', card_array));
    let image_url_array = [];
    async.eachOf(card_array, (p, idx, callback1) => {
        let cards = generateCardPayload(p);
        let options = {
            method: 'POST',
            url: 'http://localhost:5002/iu/image',
            headers: {
                'cache-control': 'no-cache',
                Authorization: process.env.CARD_GEN_TOKEN,
                'Content-Type': 'application/json'
            },
            body: cards,
            json: true
        };
        request(options, function (error, response, body) {
            if (error)
                throw new Error(error);
            //console.log(response);
            image_url_array.push({ index: idx, url: body.url });
            callback1();
        });
    }, (err) => {
        console.log(chalk.magenta('card-gen | Sending common cards back'));
        console.log(card_array);
        process.send({ topic: "images", data: image_url_array });
        if (err)
            console.log(err);
    });
}

