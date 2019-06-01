const request = require('request');
const generateCardPayload = require('./card-namer');
const chalk = require('chalk');
const async = require("async");


let HAVE_CARDS = true;

let allCommonCards = [];

//Communicates with parent thread (Tournament)
process.on("message", (msg) => {
    console.log("MSG HAVE CARDS-------------------------")
    console.log(msg)
    console.log(msg.HAVE_CARDS);
    //if (msg.HAVE_CARDS) {
    //    console.log("___DETECTED AND ASSIGN")
    HAVE_CARDS = msg.HAVE_CARDS;
    // }
    console.log(chalk.magenta("This round's HAVE_CARDS ::: ", HAVE_CARDS));
    switch (msg.topic) {
        case "common-cards":
            console.log(chalk.magenta("card-gen | Msg = common-cards"));
            console.log(msg.data);
            for (let idx = 0; idx < msg.data.length; idx++) {
                //This carry the all card rank&type in PREFLOP, FLOP, TURN, RIVER..
                allCommonCards.push(msg.data[idx]) //Common cards are stored in the idx-th slot
            }
            let commoncards_array = [allCommonCards]; //Wrap around with another array to make use of the repeated code.
            console.log(chalk.magenta("Post for loop"));
            console.log(commoncards_array);
            requestForCardImage(commoncards_array, "common");

            break;
        case "card-pairs":
            let cardPairs = [];
            // console.log("Card Gen | Case card-pairs")
            // console.log(JSON.stringify(msg.data));
            let playersID = [];

            for (let idx = 0; idx < msg.data.length; idx++) {
                cardPairs.push(msg.data[idx].cards); //Card pairs are stored in each idx's "cards"
                playersID.push(msg.data[idx].id);
            }
            requestForCardImage(cardPairs, "pairs", playersID);
            break;
        default:
            //Any uncaught messages are here:
            console.log(chalk.red("card-gen | Uncaught topic! ", msg.topic));
    }
})

/**
 * Takes a generated card payload and fires a request to the Utils app for PHE
 * @param {[Object]}    card_array Array of objects such as { 'rank' : 'A', 'type': 'C'} for Ace of Clubs.
 * @param {String}      message Short message for parent thread to figure out type of images
 * @param {Array}       playersID Optional. For identifying owners of images
 */
function requestForCardImage(card_array, message, playersID) {
    //console.log(chalk.magenta('CARDS ARRAY -'));
    //console.log(card_array);
    let image_url_array = [];
    async.eachOf(card_array, (p, idx, callback1) => {
        let cards = generateCardPayload(p);
        console.log(chalk.yellow('CARDS'));
        console.log(cards);

        let options = {
            method: 'POST',
            url: 'https://imai-poker-utils.herokuapp.com/iu/image',
            headers: {
                'cache-control': 'no-cache',
                Authorization: process.env.CARD_GEN_TOKEN,
                'Content-Type': 'application/json'
            },
            body: cards,
            json: true
        };
        if (HAVE_CARDS) {
            request(options, function (error, response, body) {
                if (error)
                    throw new Error(error);
                //console.log(response);
                console.log(chalk.magenta("BODY ! "));
                console.log(body);
                if (playersID) {
                    image_url_array.push({ index: idx, id: playersID[idx], url: body.url });
                } else {
                    image_url_array.push({ numberOfCards: card_array[0].length, url: body.url });
                }

                callback1();
            });
        } else {
            if (playersID) {
                image_url_array.push({ index: idx, id: playersID[idx], url: "" });
            } else {
                image_url_array.push({ numberOfCards: card_array[0].length, url: "" });
            }
            callback1();
        }

    }, (err) => {
        console.log(chalk.magenta('card-gen | Sending common cards back'));
        console.log(chalk.magenta(JSON.stringify(card_array)));

        process.send({ topic: message, data: image_url_array });
        if (err)
            console.log(err);
    });
}

