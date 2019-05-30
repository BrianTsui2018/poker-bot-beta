//----------------------------------------
/*              Import                  */
const Botkit = require('botkit');
const {
    handleSlash
} = require('./slash-commands');

const {
    createPoker,
    testShowCards,
    lobbyMenu,
    playerJoin,
    playerLeave,
    refreshLobbyList,
    refreshLobbySection,
    placeBet
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


controller.hears('hi', 'direct_message, direct_mention, mention', (bot, message) => {
    bot.replyAcknowledge();
    bot.startConversation(message, function (err, convo) {
        convo.say('');
        convo.next();
        convo.say("Hello!");
        convo.next();
        //convo.say("What can I do for you today?");
    });
});

controller.hears('I am hungry', 'direct_message, direct_mention, mention', (bot, message) => {
    bot.replyAcknowledge();
    bot.startConversation(message, function (err, convo) {
        convo.say('');
        convo.next();
        convo.say("Me too.");
        convo.next();
        // convo.say("Wonder what's for dinner?");
    });
})
//------------------------------------------------------------------------------------//

//----------------------------------------
/*   Bot listens to keyword in Slack    */
controller.hears(['poker', 'join', 'create', 'game', 'play', 'start', 'lobby'], 'direct_message, direct_mention, mention', (bot, message) => {

    bot.startConversation(message, async function (err, convo) {
        if (err) { console.log(err); }

        convo.say("Hello! Let's play *Texas Holdem' Poker*.");
        await convo.ask({
            attachments: create_or_join
        }, [
                {
                    pattern: "create",
                    callback: function (reply, convo) {
                        convo.next();
                        createPoker(convo, reply);

                    }
                }, {
                    pattern: "join",
                    callback: function (reply, convo) {
                        convo.next();
                        lobbyMenu(bot, reply.channel);

                    }
                },
                {
                    pattern: "balance",
                    callback: function (reply, convo) {
                        convo.say("Here's your balance:");
                        convo.next();
                    }
                },
                {
                    pattern: "daily",
                    callback: function (reply, convo) {
                        convo.say("Your daily chips:");
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function (reply, convo) {
                        convo.say('Beep-boop! Something went wrong :robot_face:');
                        convo.next();
                    }
                }
            ]);
    });

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

controller.hears('test cards', 'direct_message,direct_mention, mention', function (bot, message) {
    bot.replyAcknowledge();
    bot.startConversation(message, function (err, convo) {
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        bot.reply(message, 'Here are the cards.', () => {

            testShowCards(message, bot);

        });
    });
});

controller.hears(['quit', 'leave', 'done', 'check-out', 'check out', 'cash out', 'exit'], 'direct_message,direct_mention, mention', function (bot, message) {
    bot.replyAcknowledge();
    bot.startConversation(message, function (err, convo) {
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        //#debug-------------
        // console.log("\nPlayer leaving game---------------- print message:");
        // console.log(message);
        //---------------------------
        bot.reply(message, `<@${message.user}> has left the game.\nYour balance will be updated shortly.`, () => {
            let user = { slack_id: message.user, team_id: message.team };
            playerLeave(user);
        });
    });
});


controller.hears(['demo', 'demonstrate'], 'direct_message,direct_mention, mention', function (bot, message) {

    bot.replyAcknowledge();
    bot.startConversation(message, function (err, convo) {
        convo.say('Hello!');
        convo.next();
        convo.ask({
            attachments: [
                {
                    title: 'Would you like to see a demo',
                    callback_id: '123',
                    attachment_type: 'default',
                    actions: [
                        {
                            "name": "yes",
                            "text": "Yes, please",
                            "value": "yes",
                            "type": "button",
                        },
                        {
                            "name": "no",
                            "text": "No, thanks",
                            "value": "no",
                            "type": "button",
                        }
                    ]
                }
            ]
        }, [
                {
                    pattern: "yes",
                    callback: function (reply, convo) {
                        bot.reply(convo.source_message, ":black_joker: I'm starting a *Texas Poker Holdem Game!* :black_joker:\n(Click on this thread to enter game :diamonds:)", function (err, response) {
                            startTournament(bot, { "channel": response.channel, "ts": response.message.ts });
                        });
                        // bot.reply(convo, ":black_joker: I'm starting a *Texas Poker Holdem Game!* :black_joker:", function (err, response) {
                        //     response.message.channel = convo.context.channel;
                        //     startTournament(bot, response.message);
                        //     convo.say('Click into game message to see progress in Thread.');
                        // });
                        convo.stop();
                    }
                },
                {
                    pattern: "no",
                    callback: function (reply, convo) {
                        convo.say('Anytime!');
                        convo.next();
                    }
                },
                {
                    default: true,
                    callback: function (reply, convo) {
                        convo.say('Beep-boop... Error!:robot_face:');
                        convo.next();
                    }
                }
            ]);
    });
});

controller.on('block_actions', async function (bot, message) {
    // #debug
    console.log('\nindex.js : Event -> Block action caught!==========================\n');

    let response = JSON.parse(message.text);

    if (response.topic === "BET") {
        let data = {
            "team_id": message.team.id,
            "team_domain": message.team.domain,
            "user_slack_id": message.user,
            "lobby_id": response.lobby_id,
            "user_name": message.raw_message.user.username,
            "channel_id": message.channel,
            "choice": response.choice,
            "val": response.val

        }
        //#debug ---------------
        console.log("\n--------------- incoming data from player betting")
        console.log(data);
        //----------------------


        let body = await placeBet(data) //, (body) => {
        //#debug ---------------
        console.log(" Controller : Bot has placed a request to util ")
        console.log(body);
        console.log(" --------------------------------------------- ")
        //});

    }
    else if (response.topic === "JOIN_LOBBY" || response.topic === "JOIN_LOBBY_DIRECT") {
        console.log("\nCONFIRM PLAYER JOIN LOBBY!");

        let data = {
            "team_id": message.team.id,
            "team_domain": message.team.domain,
            "user_slack_id": message.user,
            "lobby_id": response.lobby_id,
            "user_name": message.raw_message.user.username,
            "channel_id": message.channel
        }

        /*          Put player in lobby           */
        let result = await playerJoin(bot, data);
        /*          Refresh the list menu          */
        if (response.topic === "JOIN_LOBBY_DIRECT") {
            await refreshLobbySection(bot, message, data.lobby_id);
        }
        else {
            await refreshLobbyList(bot, message);
        }

        if (result === "ALREADY") {
            console.log("\nindex.js : case ALREADY\n");
            bot.reply(message, `<@${message.user}>, you are currently playing in that game already.`);
        } else {
            console.log("\nindex.js : case JOINED\n");
            bot.reply(message, `<@${message.user}>, you have joined the lobby *${result.name}*.\nPlease await in the lobby's thread.:clubs:`);

            /*      Start Tournament automatically      */
            bot.reply(message, ":black_joker: I'm starting a *Texas Poker Holdem Game!* :black_joker:", function (err, response) {
                startTournament(bot, { "channel": response.channel, "ts": response.message.ts, "lobby_id": data.lobby_id, "use_demo": false });
            });





        }
    }
    else if (response.topic === "CREATE_LOBBY") {
        console.log("\nPLAYER CREATE LOBBY!");
        bot.startConversation(message, function (err, convo) {
            createPoker(convo, message);
        });
    }
    else if (response.topic === "REFERESH_ALL") {
        console.log("\nPLAYER REFRESH ALL LOBBIES!");
        await refreshLobbyList(bot, message);
        console.log("\nPLAYER CANCEL JOIN LOBBY!");
        bot.reply(message, `<@${message.user}> :ok_hand: `);

    } else if (message.actions[0].block_id === 'turnbuttons') {
        switch (message.actions[0].value) {
            case 'fold':
                bot.reply(message, `${message.raw_message.user.name} folds`);
                break;
            case 'call':
                bot.reply(message, `${message.raw_message.user.name} calls/checks`);
                break;
            case 'raise':
                //TODO add function to get raise amount
                bot.reply(message, `${message.raw_message.user.name} raises`);
                break;
            case 'all-in':
                bot.reply(message, `${message.raw_message.user.name} is all-in!!!`);
                break;
        }
        // bot.reply(message, `<@${message.user}> :ok_hand: `);
    }


});



//----------------------------------------
/*        Slash Command handling        */
controller.on('slash_command', async (bot, message) => {
    bot.replyAcknowledge();
    handleSlash(bot, message);
})

//----------------------------------------