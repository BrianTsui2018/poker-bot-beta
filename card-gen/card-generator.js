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
    switch (msg.topic) {
        case "card-pairs":
            console.log(chalk.magenta("card-gen | Msg = card-pairs | Starting on making pairs with..."));
            console.log(msg.data);
            //run the async card function.
            async.eachOf(msg.data, (p, idx, callback1) => {
                //console.log(chalk.magenta(msg.data.player))
                let cards = generateCardPayload(p.cards);
                //#debug
                console.log("\n----------------------------- cards after generateCardPayload()------------");
                console.log(cards);
                //-------------------------
                let options = {
                    method: 'POST',
                    url: 'http://5a11acaa.ngrok.io/iu/image',
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
                    if (error) console.log(error);

                    console.log('CARD GEN', body);

                    setup_array.push({ index: idx, url: body.url });
                    callback1();
                });

            }, (err) => {
                console.log(chalk.magenta('Processed all images!'))
                console.log(setup_array);

                process.send({ topic: "images", data: setup_array });
                if (err) console.log(err);
            });
            console.log(chalk.magenta("card-gen----------card-pairs "));
            break;
        case "common-cards":
            console.log(chalk.magenta("card-gen | Msg = common-cards"));
            //run common-cards;

            //let thisPicture = [msg.data[0], msg.data[1], msg.data[2],]
            for (let idx = 0; idx < msg.data.length; idx++) {
                allCommonCards.push(msg.data[idx])
            }

            //commoncards_array = [thisPicture];
            // let idx = 3;
            // for (let i = 0; i < 2; i++) {
            //     thisPicture.push(msg.data[idx]);
            //     commoncards_array.push(thisPicture);
            //     idx++;
            let commoncards_array = [allCommonCards];

            // }
            let finalArray = [];
            console.log(chalk.magenta('CARDS ARRAY -', commoncards_array));
            async.eachOf(commoncards_array, (p, idx, callback1) => {
                let cards = generateCardPayload(p);
                let options = {
                    method: 'POST',
                    url: 'http://5a11acaa.ngrok.io/iu/image',
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
                    finalArray.push({ index: idx, url: body.url });
                    callback1();
                });

            }, (err) => {
                console.log(chalk.magenta('card-gen | Sending common cards back'))
                console.log(commoncards_array);

                process.send({ topic: "images", data: finalArray });
                if (err) console.log(err);
            });
            break;
        default:
            console.log(chalk.red("card-gen | Uncaught topic! ", msg.topic));
    }
})
