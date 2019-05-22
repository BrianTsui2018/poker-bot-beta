//----------------------------------------
/*              Import                  */
const Botkit = require('botkit');
const {
    handleSlash
} = require('./slash-commands');

const {
    createPoker,
    testShowCards,
    joinPoker
} = require('./bot-skills/poker-commands');

const {
    startTournament
} = require('./poker-game/start-tournament');

const {
    create_or_join
} = require('./message-blocks/poker-messages');

//----------------------------------------
/*      Authentication checkpoint       */
if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.VERIFICATION_TOKEN || !process.env.PORT) {                   // online deployment doesn't need to check for PORT env var
    console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN in environment');
    process.exit(1);
} else {
    console.log('Good job, you have the variables!')
}
//----------------------------------------
/*          MongoDB storage             */
const mongodbStorage = require('./phe-storage-mongoose/index.js')({
    mongoUri: process.env.MONGODB,
});
//----------------------------------------
/*      Controller, the Slackbot        */
const controller = Botkit.slackbot({
    storage: mongodbStorage,
    debug: false,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
    require_delivery: true,
});
//----------------------------------------
/*        Configure Controller          */
controller.configureSlackApp({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['commands', 'bot', 'incoming-webhook'],
});

//----------------------------------------
/*          Bot Server setup               */
controller.setupWebserver(process.env.PORT, function (err, webserver) {
    controller.createHomepageEndpoint(controller.webserver);
    controller.createWebhookEndpoints(controller.webserver);
    controller.createOauthEndpoints(controller.webserver,
        function (err, req, res) {
            if (err) {
                res.status(500).send('ERROR: ' + err);
            } else {
                res.send('Success!');
            }
        });
});

//----------------------------------------
/*      Spawns "bot" from Controller    */
let bot = controller.spawn({
    token: process.env.BOT_TOKEN,
    incoming_webhook: {
        url: process.env.SLACK_WEBHOOK
    }
})
bot.startRTM(function (err) {
    if (err) {
        throw new Error(err)
    }

});

/* #Brian's notes -------
 
    * "incoming webhook" is a url to post JSON from app to Slack. 
    "Outgoing webhook" is obsolete (legacy).
    
    * Use bot.sendWebhook(message, callback())
    Pass sendWebhook an object that contains at least a text field. 
    This object may also contain other fields defined by Slack which can alter the appearance of your message.
 
------------------------*/


//---- Test zone ---------------------------------------------------------------------//


controller.hears('hi', 'direct_message', (bot, message) => {
    bot.reply(message, 'Hello.');
});

controller.hears('I am hungry', 'direct_message', (bot, message) => {
    bot.reply(message, 'Haha no food for you!');
})
//------------------------------------------------------------------------------------//

//----------------------------------------
/*   Bot listens to keyword in Slack    */
controller.hears('poker', 'direct_message, direct_mention', (bot, message) => {



    //     // bot.startConversation(message, function (err, convo) {
    //     //     if (err) {
    //     //         console.log(err);
    //     //     }
    //     //     // #debug ---------------
    //     //     console.log('\n\n---------------- poker-commands.js -> "poker" event ----------------\n');
    //     //     // -----------------------            
    //     //     launchPoker(convo);
    //     // });


    // bot.startRTM(function (err, bot, payload) {
    //     if (err) {
    //         throw new Error('Could not connect to Slack');
    //     }
    //     bot.reply(message, 'hihi');
    //     console.log(payload);
    bot.startConversation(message, function (err, convo) {
        if (err) { console.log(err); }
        convo.say('hi');
        convo.ask({
            attachments: create_or_join
        }, [
                {
                    pattern: "create",
                    callback: function (reply, convo) {
                        createPoker(convo, reply);
                        // bot.closeRTM();
                    }
                }, {
                    pattern: "join",
                    callback: function (reply, convo) {
                        convo.say('JOIN!');
                        convo.next();
                        joinPoker(convo, reply);
                        // bot.closeRTM();
                    }
                },
                {
                    pattern: "no",
                    callback: function (reply, convo) {
                        convo.say('Too bad');
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function (reply, convo) {
                        convo.say('Excuse me?');
                        convo.next();
                    }
                }
            ]);
    });
    // });
});
controller.on('block_actions', function (bot, message) {
    console.log('\nBlock action caught!');
    console.log(message);
    if (message.text === "player_join_lobby") {
        console.log("\nCONFIRM PLAYER JOIN LOBBY!");
    }


});

// controller.on('direct_mention', function (bot, message) {
//     console.log('\nDirect mention caught!');
//     //console.log(message);
//     if (message.text === "ping") {
//         console.log('\npong!');
//     }
//     // else if (message.text === "poker", function (bot, message) {
//     //     // #debug -------------- Test zone --------------------------
//     //     bot.reply(message, {
//     //         attachments: [
//     //             {
//     //                 title: 'Do you want to Create or Join a game?',
//     //                 callback_id: '123',
//     //                 attachment_type: 'default',
//     //                 actions:
//     //                     [
//     //                         {
//     //                             "name": "create",
//     //                             "text": "Create",
//     //                             "value": "create",
//     //                             "type": "button",
//     //                         },
//     //                         {
//     //                             "name": "no",
//     //                             "text": "No",
//     //                             "value": "no",
//     //                             "type": "button",
//     //                         }

//     //                     ]
//     //             }
//     //         ]
//     //     },
//     //         () => {
//     //             console.log("\nthis is callback.");

//     //             // -----------------------------------------------------------
//     //         }
//     //     );
//     // });
// });

controller.hears('test cards', 'direct_message,direct_mention', function (bot, message) {

    bot.reply(message, 'Here are the cards.');
    /*      Send card message block    */
    testShowCards(message, bot);

});
controller.hears(['demo', 'demonstrate'], 'direct_message,direct_mention', function (bot, message) {
    bot.startConversation(message, function (err, convo) {
        if (err) { console.log(err); }
        convo.say('hi');

        console.log(convo)
        // convo.task.bot.reply(message, "Here is a demonstration of the Texas Holdem\' Poker game\n:black_joker: I'm starting a *Texas Poker Holdem Game!* :black_joker:", function (err, response) {
        //     if (err) {
        //         console.log(err);
        //     }
        //     // #debug-----
        //     console.log("\n---------- /start -------\n");
        //     console.log(message);
        //--------------
        // response.message.channel = message.channel;
        startTournament(bot, { channel: convo.source_message.channel, ts: convo.source_message.ts });
    });
    // });

});




//----------------------------------------
/*        Slash Command handling        */
controller.on('slash_command', async (bot, message) => {
    bot.replyAcknowledge();
    //TO DO: Put json objects to separate file for tidiness
    handleSlash(bot, message);
})

//----------------------------------------