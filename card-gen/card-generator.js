const request = require('request');
const generateCardPayload = require('./card-namer');
const chalk = require('chalk');
const async = require("async");

/**
 *      TODO TWO PLACES NEEDS THE AUTH REMOVED!
 */


let allCommonCards = [];
let setup_array = [];

process.on("message", (msg) => {

    for (let idx = 0; idx < msg.data.length; idx++) {
       allCommonCards.push(msg.data[idx])
    }

    let commoncards_array = [allCommonCards];
    async.eachOf(commoncards_array, (p, idx, callback1) => {
        let cards = generateCardPayload(p);
        let options = {
            method: 'POST',
            url: 'https://imai-poker-utils.herokuapp.com/',
            headers:
                {
                    'cache-control': 'no-cache',
                    Authorization: process.env.CARD_GEN_TOKEN,
                    'Content-Type': 'application/json'
                },
            body: cards,
            json: true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            //console.log(response);
            setup_array.push({ index: idx, url: body.url });
            callback1();
        });

    }, (err) => {
        console.log(chalk.magenta('card-gen | Sending common cards back'))
        console.log(commoncards_array);

        process.send({ topic: "images", data: setup_array });
        if (err) console.log(err);
    });


})
