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
    placeBet,
    getPlayerBankBalance,
    giveDailyBonus,
    joinedAndStartGame,
    serverReset,
} = require('./bot-skills/poker-commands');

const {
    botEvent,
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

//------------------------------------------------------------------------------------//

//----------------------------------------
/*   Bot listens to keyword in Slack    */
controller.hears(['poker', 'join', 'create', 'game', 'play', 'start', 'lobby'], 'direct_message, direct_mention, mention', (bot, message) => {
    bot.replyAcknowledge();
    bot.startConversation(message, async function (err, convo) {
        if (err) { console.log(err); }
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        convo.say('');
        convo.next();
        convo.say(`Hello <@${message.user}>! Let's play *Texas Holdem' Poker* :spades:.`);
        await convo.ask({
            attachments: create_or_join
        }, [
                {
                    pattern: "create",
                    callback: function (reply, convo) {
                        convo.next();
                        console.log(message);
                        if (message.type === "direct_message") {
                            convo.say("To create a lobby, you must create it in a public channel (this is direct message).\nThe game will be hosted in the channel that it's lobby was created in.:clubs:");
                            convo.next();
                        }
                        else {
                            createPoker(convo, reply);
                        }
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
                        convo.say('Maybe next time! :clubs:');
                        convo.next();
                    }
                }
            ]);
    });

});

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

        bot.reply(message, `<@${message.user}> has left the game.\nYour balance will be updated shortly.`, () => {
            let user = { slack_id: message.user, team_id: message.team };
            playerLeave(user);
        });
    });
});


controller.hears(['bank', 'balance', 'money', 'How much money is in my bank'], 'direct_message,direct_mention, mention', async function (bot, message) {
    bot.replyAcknowledge();
    try {

        bot.startConversation(message, async function (err, convo) {
            convo.say('');
            convo.next();
            convo.say('');
            convo.next();
            console.log("\nDEBUG=============== test postMessage ============= [message]");
            console.log(message);
            let bankMsg = await getPlayerBankBalance({ slack_id: message.user, team_id: message.team });
            console.log("\nDEBUG=============== test postMessage ============= [bankMsg]");
            console.log(bankMsg);
            if (!bankMsg) { throw new Error("index.js | controller.hears poker-balance | Could not get user balance") }
            else {
                let payload = {
                    "token": process.env.BOT_TOKEN,
                    "channel": message.channel,
                    "blocks": bankMsg,
                    "as_user": true
                }
                bot.api.chat.postMessage(payload);

                console.log("\nDEBUG=============== test postMessage ============= [payload]");
                console.log(payload);
            }

        });
    } catch (error) {
        console.log("\nDEBUG=============== test postMessage ============= [caught error]");
        console.log(error);
    }
});

controller.hears(['I am broke', 'recharge', 'bonus', 'charge up'], 'direct_message,direct_mention, mention', async function (bot, message) {
    bot.replyAcknowledge();
    try {
        bot.startConversation(message, async function (err, convo) {
            convo.say('');
            convo.next();
            convo.say('');
            convo.next();
            let bonusMessage = await giveDailyBonus({ slack_id: message.user, team_id: message.team });
            if (!bonusMessage) throw new Error("index.js | controller.hears give bonus | Could not finish bonus function")
            convo.say('');
            convo.next();
            convo.say('');
            convo.next();
            bot.sendWebhook({
                blocks: bonusMessage,
                channel: message.channel_id,
            }, function (err, res) {
                if (err) {
                    console.log(err);
                }
            });
        });
    } catch (error) {
        console.log(error)
    }

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

                            let payload = {
                                "token": process.env.BOT_TOKEN,
                                "channel": response.channel,
                                "ts": response.message.ts,
                                "text": ":spades: :hearts: *Starting Poker Holdem Engine!*:clubs::diamonds:"
                            }
                            bot.api.chat.postMessage(payload, function (err, response) {

                                startTournament(bot, { "channel": response.channel, "ts": response.message.ts, "use_demo": true });
                            });


                        });

                        convo.next();
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
    console.log('--------------- message ------------------');
    console.log(message);

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
            "val": response.val,
        }
        //#debug ---------------
        // console.log("\n--------------- incoming data from player betting")
        // console.log(data);
        //----------------------

        placeBet(data).then((body) => {
            console.log(" Controller : Bot has placed a request to util ")
            console.log(body);
            console.log(" --------------------------------------------- ")

            botEvent.emit("SlackBot: Got User Action", [data]);

        })

    }
    else if (response.topic === "JOIN_LOBBY" || response.topic === "JOIN_LOBBY_DIRECT") {
        console.log("\nCONFIRM PLAYER JOIN LOBBY!");

        let data = {
            "team_id": message.team.id,
            "team_domain": message.team.domain,
            "user_slack_id": message.user,
            "lobby_id": response.lobby_id,
            "user_name": message.raw_message.user.username,
            "channel_id": message.channel,
            "lobby_channel": response.lobby_channel,
            "lobby_name": response.lobbyName
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
            bot.reply(message, `<@${message.user}>, you are currently playing in that game already.:clubs:`);
        } else if (result === "BROKE") {
            console.log("\nindex.js : case BROKE\n");
            bot.reply(message, `<@${message.user}>, it appears that you don't have enough chips in your account to match the lobby's Buy-In.:clubs:`);
        } else if (result === "NO-LOBBY") {
            console.log("\nindex.js : case NO-LOBBY\n");
            bot.reply(message, `<@${message.user}>, that lobby no longer exist. Please try another one.:clubs:`);
        } else if (result === "FULL") {
            console.log("\nindex.js : case FULL\n");
            bot.reply(message, `<@${message.user}>, the lobby is already full, please try again.:clubs:`);
        } else {
            console.log("\nindex.js : case JOINED\n");
            console.log("\n--------------- data");
            console.log(data);
            console.log("\n----------------result");
            console.log(result);
            bot.reply(message, `<@${message.user}>, you have joined the lobby *${data.lobby_name}*.\nPlease go to <#${data.lobby_channel}> to meet other players in the game thread.:clubs:`), function (err, response) { };
            // bot.reply(message, `<@${message.user}>, you have joined the lobby *${result.name}*.\n<${data.lobby_thread}|Click *Here*> to meet other players in the game thread.:clubs:`), function (err, response) { };
            joinedAndStartGame(response.lobby_id);
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

serverReset();