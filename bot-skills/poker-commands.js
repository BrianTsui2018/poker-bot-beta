const {
    showdown_mockup,
    askForBuyin,
    genLobbyNames,
    create_or_join,
    newGame_or_stay,
    current_lobbies_info,
    one_lobby_info
} = require('../message-blocks/poker-messages');

const {
    registerPlayer,
    registerLobby,
    playerJoinLobby,
    lobbyIsFull,
    getLobbyByID,
    getLobbyPlayers,
    getCurrLobbyData,
    getOneLobbyData,
    lobbyRemovePlayer,
    getPlayerByID,
    getPlayerBank,
    assignChip,
    withdrawChip,
    patchPlayerDP,
    updatePlayerWallet,
    axiosPUT
} = require('./manager.js');

const {
    startTournament
} = require('../poker-game/start-tournament')




/**
 * Creates a new user according to input data and returns the player object
 * @param {Object}  user_data 
 * @returns         updated user data
 */
const createNewUser = async (user_data) => {
    try {
        if (!user_data) {
            console.log("---- ERROR! -----\n./bot-skills/poker-commands.js > createNewUser > failed to register player!");
        }
        const new_player_chips = 1000000;
        /*           Create a user                  */
        let user = await registerPlayer(user_data);
        if (!user) {
            console.log("---- ERROR! -----\n./bot-skills/poker-commands.js > createNewUser > failed to register player!");
        } else {
            console.log("\n----- ./bot-skills/poker-commands.js > createNewUser() > created this new user : ");
            console.log(user);
        }
        /*           Assign chip to user            */
        user = await assignChip(user_data, new_player_chips);
        console.log("\nAssigned chips!");
        /*           Get display pic                */
        user = await patchPlayerDP(user);
        console.log("\nPatched DP!");

        return user;
    } catch (error) {
        console.log(`\n----------------------\nERROR! poker-commands.js failed to create user / assign chip.\n----------------------\n`);
    }
}


/**
 * Setup Lobby
 * @param {Botkit Object}   convo                       Botkit object
 * @param {Number}          convo.vars.lobby_buyin
 * @param {String}          convo.vars.lobby_name
 * @param {Object}          user                        Contains slack ID and user ID
 * @returns {Object|null}
 */
const setupLobby = async (convo, user) => {

    convo.say('');
    convo.next();

    /*      Only execute the the default values are properly overwritten        */
    if (convo.vars.lobby_name && convo.vars.lobby_buyin && convo.vars.lobby_name != convo.vars.lobby_buyin) {

        /*      Create Lobby with the given info        */
        const created_lobby = await registerLobby({ name: convo.vars.lobby_name, buyin: convo.vars.lobby_buyin, minBet: (parseInt(convo.vars.lobby_buyin) / 25), team_id: user.team_id, channel: convo.source_message.channel });
        convo.say('... Created lobby *' + created_lobby.name + '*. :diamonds:');
        convo.next();

        /*      Add this player to the new lobby        */
        const updated_lobby = await playerJoinLobby({ slack_id: user.slack_id, team_id: user.team_id }, created_lobby._id);
        convo.say('<@' + user.slack_id + '> is waiting in the lobby.\nGame starts as soon as another player joins.:spades:');
        convo.next();

        /*      Check if the last procedure was successful      */
        if (updated_lobby) {
            convo.say('');
            let data = {
                "user_slack_id": user.slack_id,
                "team_id": user.team_id,
                "lobby_id": updated_lobby._id,
                "channel_id": convo.context.channel
            }
            /*
                ------------------ Lobby -------------------
            */
            oneLobbyMenu(bot, data.channel_id, data.lobby_id);

            return updated_lobby;
        } else {
            console.log(`Debug: poker-commands.js : seems like there was problem creating and joining lobby.\n`);
            convo.say(`Oops! poker-copmmands.js has an error. :O`);
            return null;
        }
    }
    else {
        convo.say(`Oops! poker-copmmands.js has an error. :O`);
        convo.next();
        return null;
    }
}


/**
 * Gets buy in from user.
 * @param {Botkit Object}   convo       Botkit object
 * @param {Object}          user 
 * @param {Number}          user.bank   
 * @returns {true|false}
 */
const getLobbyBuyinFromUser = async (convo, user) => {
    /*      Get the lobby buy-in from user      */
    let actionsList = await askForBuyin();
    convo.ask({
        attachments: [
            {
                title: 'Choose a Buy-in amount for the lobby:',
                callback_id: '123',
                attachment_type: 'default',
                actions: actionsList

            }
        ]
    }, [
            {
                default: true,
                callback: function (reply, convo) {
                    convo.setVar('lobby_buyin', reply.text);
                    convo.say(`\$${reply.text} is the Buy-in.`);
                    convo.next();
                    if (user.bank < convo.vars.lobby_buyin) {
                        console.log("\npoker-commands.js->getLobbyBuyinFromUser(): Player overdraft.\n");
                        convo.say('It appears that your bank account do not have enough chips. You have $' + user.bank + ' but this lobby has a $' + convo.vars.lobby_buyin + '.');
                        return false;
                    } else {
                        setupLobby(convo, user);
                        return true;
                    }
                }
            }
        ]
    );
}


/**
 * Get Lobby Name from User
 * @param {Botkit object}   convo 
 * @param {Object}          user    Contains slack id and team id
 */
const getLobbyNameFromUser = async (convo, user) => {

    let actionsList = await genLobbyNames(5);
    convo.ask(
        {
            attachments: [
                {
                    title: 'Select a lobby name.',
                    callback_id: '123',
                    attachment_type: 'default',
                    actions: actionsList
                }
            ]
        }, [
            {
                default: true,
                callback: function (reply, convo) {
                    convo.setVar('lobby_name', reply.text);
                    convo.say(`The name of the lobby is ${reply.text} `);
                    convo.next();
                    /*      Get the lobby buy-in from user      */
                    getLobbyBuyinFromUser(convo, user);
                }
            }
        ]
    );
}

/*------------------------------------------------------------------------------------
|   User to create Lobby callback function
|
|   Description:
|   This is a protocol for handling  lobby creation initiated by user.
|   Do not directly use functions from lobby-router (do not directly contact DB).
|   All handler functions should be handled by manager.js
|
|                                                                                   */
const create_lobby_callback = async (convo, message) => {
    try {
        convo.say("");
        convo.next();
        /*      Load user data from DB by slack user ID         */
        let user_data = {};
        user_data.slack_id = message.user.id;
        user_data.name = message.user.name;
        user_data.team_id = message.team.id;
        user_data.team_name = message.team.domain;

        /*        Check if player is new or returning           */
        let user = await getPlayerByID(user_data);

        /*           Greet returning users                   */
        if (!user) {
            /*           Create a user                */
            user = await createNewUser(user_data);
            convo.say("");
            convo.next();
            convo.next();
            convo.say(`I have created a new account for you, <@${user.slack_id}>. You now have \$${user.bank}.`);
            getLobbyNameFromUser(convo, user);
        }
        else {
            convo.say(`Welcome back, <@${user.slack_id}>`);
            convo.next();
            if (user.isInLobby) {
                convo.ask({
                    attachments: newGame_or_stay
                }, [
                        {
                            pattern: "new",
                            callback: async function (reply, convo) {
                                convo.say("Sure, I'll register you in a new lobby.\nYou are removed from your current game, your chips will be updated shortly.");
                                convo.next()
                                // Update player in DB
                                lobbyRemovePlayer(user);
                                user.isInLobby = false;
                                convo.say("Let's create a new lobby now.");
                                convo.next();
                                // Move on to the next procedure   
                                getLobbyNameFromUser(convo, user);
                            }
                        },
                        {
                            pattern: "stay",
                            callback: function (reply, convo) {
                                convo.say('Shall do.\n(Cancle registration)');
                                convo.next();
                            }
                        },
                        {
                            default: true,
                            callback: function (reply, convo) {
                                convo.say("Beep-boop! Oops! I'm confused, please try again :robot_face:");
                                convo.next();
                            }
                        }
                    ]);
            } else {
                getLobbyNameFromUser(convo, user);
            }
        }
    } catch (e) {
        /*  Error  */
        console.log(e);

        return e;
    }
}


const testShowCards = (message, bot) => {
    bot.sendWebhook({
        blocks: showdown_mockup(),
        channel: message.channel_id,
    }, function (err, res) {
        if (err) {
            console.log(err);
        }
    });
}


const createPoker = (convo, reply) => {
    convo.say("");
    convo.next();
    create_lobby_callback(convo, reply.raw_message); // the actual callback function
}


const lobbyMenu = async (bot, channel_id) => {
    // console.log('\n---------------- poker-commands.js -> lobbyMenu() -----------------------------');
    let lobbyList = [];
    lobbyList = await getCurrLobbyData({ "team_id": bot.team_info.id });
    let message_block = await current_lobbies_info(lobbyList);
    bot.api.chat.postMessage(
        {
            "channel": channel_id,
            "token": bot.config.token,
            "attachments": [{ "blocks": message_block }]
        }
    );
}

const oneLobbyMenu = async (bot, channel_id, lobby_id) => {
    // console.log('\n---------------- poker-commands.js -> oneLobbyMenu() -----------------------------');

    let thisLobby = await getLobbyByID(lobby_id);
    let thisData = {};
    thisData.lobby = thisLobby;
    let thisLobbyPlayerList = await getOneLobbyData(thisLobby);
    thisData.currPlayers = thisLobbyPlayerList;
    let message_block = await one_lobby_info(thisData);
    bot.api.chat.postMessage(
        {
            "channel": channel_id,
            "token": bot.config.token,
            "attachments": [{ "blocks": message_block }]
        }
    );
}

const playerJoin = async (bot, data) => {

    /*      Get this Player object       */
    await newPlayerChips(bot, data);

    /*       Add this player to the new lobby        */
    let response = await playerJoinLobby({ slack_id: data.user_slack_id, team_id: data.team_id }, data.lobby_id);

    return response;
}

/*      Refresh Lobby List      */
const refreshLobbyList = async (bot, message) => {
    let data = {
        slack_id: message.user,
        team_id: message.team.id
    }

    /*      Get the list of lobby in this team       */
    let lobbyList = await getCurrLobbyData(data);
    /*      Construct the message block         */
    let message_block = await current_lobbies_info(lobbyList);
    /*      Send out        */
    let action_data = {
        "token": bot.config.token,
        "channel": message.channel,
        "ts": message.message.ts,
        "attachments": [
            {
                "blocks": message_block
            }
        ]
    }
    bot.api.chat.update(action_data);
}

/*      Refresh Lobby Section       */
const refreshLobbySection = async (bot, message, lobby_id) => {
    let data = {
        slack_id: message.user,
        team_id: message.team.id
    }

    /*      Construct Message block     */
    let thisLobby = await getLobbyByID(lobby_id);
    let thisData = {};
    thisData.lobby = thisLobby;
    let thisLobbyPlayerList = await getOneLobbyData(thisLobby);
    thisData.currPlayers = thisLobbyPlayerList;
    let message_block = await one_lobby_info(thisData);

    /*      Send out the update     */
    let action_data = {
        "token": bot.config.token,
        "channel": message.channel,
        "ts": message.message.ts,
        "attachments": [
            {
                "blocks": message_block
            }
        ]
    }
    bot.api.chat.update(action_data);

}

const playerLeave = (user) => {
    let thisPlayer = lobbyRemovePlayer(user);
    return thisPlayer;
}

/**
 * Creates a new user, stores name, team id and stuff'em up with chips.
 * @param {Botkit object}   bot 
 * @param {Object}          data    Contains slack id, team id, user_name, team_domain
 * @param {String}          data.user_slack_id
 * @param {String}          data.team_id
 * @param {String}          data.team_domain
 * @param {String}          data.channel_id
 */
const newPlayerChips = async (bot, data) => {
    let thisPlayer = await getPlayerByID({ slack_id: data.user_slack_id, team_id: data.team_id });

    /*        Check if player is new or returning           */
    if (!thisPlayer) {

        /*      Load user data from DB by slack user ID         */
        let new_user = {
            slack_id: data.user_slack_id,
            name: data.user_name,
            team_id: data.team_id,
            team_name: data.team_domain
        };

        /*           Create a user                */
        thisPlayer = await createNewUser(new_user);

        bot.api.chat.postMessage(
            {
                "channel": data.channel_id,
                "token": bot.config.token,
                "text": `I have created a new account for you, <@${thisPlayer.slack_id}>. You now have \$${thisPlayer.bank}.\nI'll now register you to the lobby...`
            }
        );
    }
}

/**
 * Constructs an object to make a bet request.
 * @param {Object} data 
 * @param {Number} data.val             Bet amount
 * @param {String} data.user_slack_id   SlackID of the user who's betting
 * @returns {Object|0}                  Returns an object of bet info on success
 */
const placeBet = async (data) => {
    if (data.choice !== "fold") {
        let betData = {
            action: data.val,
            userID: data.user_slack_id
        }
        try {
            let body = await axiosPUT(betData);
            data.spent = body.action;
            return body.data;
            //await updatePlayerWallet(data); - temp remove, gamestate seems to track player wallet!
        } catch (error) {
            console.log("poker-command.js | Place bet error. | Returning ing 0")
            console.log(error);
            return 0;
        }
    }
    else {
        return 0;
    }
}

/**
 * Retrieves user's bank balance and combine into message block.
 * @param {Object} data             message object from Slack bot
 * @param {String} data.slack_id    Slack ID to query for user
 * @returns                         Block builder message
 */
const getPlayerBankBalance = async (data) => {

    let msg = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ""
            }
        },
        {
            "type": "divider"
        }
    ]

    try {
        let bank = await getPlayerBank(data);
        msg[0].text.text = `:currency_exchange: <@${data.slack_id}>Your current balance : $ *${bank}*.00 \n:hourglass_flowing_sand: Your next recharge comes in at *time*`
        return msg;
    } catch (error) {
        console.log("poker-command.js | getPlayerbankBalance | error ")
        console.log("error");
    }
}


/**
 *  Slack bot to give a daily bonus of 1M to the player who asked for it.
 * @param {Object} data 
 * @param {String} data.user
 * @param {String} data.team
 */
const giveDailyBonus = async (data) => {

    let bonusMsg = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ""
            }
        },
        {
            "type": "divider"
        }
    ];
    try {
        //get user by id

        let player = await getPlayerByID(data);
        let msg;
        //check time stamp if > 24 hours
        //give or reject
        const oneday = 60 * 60 * 24 * 1000;
        const now = Date.now();
        console.log('pk command .js | checking Date.now() ', now);
        //console.log('same, player.updatedAt', player.updatedAt)
        //now - player.updatedAt > oneDay
        if (true) {
            //more than a day
            msg = `Ok.\n:yen::pound: <@${data.slack_id}>'s got their daily bonus.:dollar::euro:`;
            bonusMsg[0].text.text = msg;

            player = await assignChip(data, 1000000);
            //let bankMsg = getPlayerBankBalance(data)

        } else {
            msg = `:x::timer_clock: <@${data.user}>, your next bonus is at ${player.updatedAt}* \n Go do some work for now. :wink:`
        }

        bonusMsg[0].text.text = msg;
        return bonusMsg;
    } catch (error) {
        console.log("poker-commands.js | giveDailyBonus | error")
        console.log(error)
    }
}


const joinedAndStartGame = async (lobby_id) => {
    /*      Get the lobby           */
    let thisLobby = await getLobbyByID(lobby_id);
    // console.log("\njoinedAndStartGame() ---- thisLobby");
    // console.log(thisLobby);

    /*      Get all players         */
    let L = await getLobbyPlayers(lobby_id);
    let players = L.playerList;

    /*      Construct names string        */
    let names_str = '<@' + L.playerList[0].slack_id + '>';
    for (let i = 1; i < L.num_players; i++) {
        names_str = names_str.concat(', <@', L.playerList[i].slack_id, '>');
    }

    /*      Get the channel         */
    let thisChannel = thisLobby.channel;
    let thisTS;

    /*      Post message, get ts        */
    let head_payload = {
        "token": process.env.BOT_TOKEN,
        "channel": thisChannel,
        "text": ":spades: :hearts: *Starting Texas Holdem' Poker!*:clubs::diamonds:\nPlayers in *" + thisLobby.name + "* :\n:small_orange_diamond:" + names_str + ", please enter this game thread:small_orange_diamond:\n(Click below)"
    }
    bot.api.chat.postMessage(head_payload, function (err, response) {
        // console.log(response);
        thisTS = response.message.ts;

        let thread_payload = {
            "token": process.env.BOT_TOKEN,
            "channel": thisChannel,
            "thread_ts": thisTS,
            "text": "Welcome! The game will be starting soon, please stand by...:hourglass_flowing_sand:"
        }
        // console.log("\n------ thread_payload");
        // console.log(thread_payload);
        bot.api.chat.postMessage(thread_payload, function (err, response) {
            startTournament(bot, { "channel": thisChannel, "ts": thisTS, "lobby_id": lobby_id, "use_demo": false });
        });
    });
    /*      Post message to ts          */

    /*      Start Tournmanet at ts      */




    // let payload = {
    //     "token": process.env.BOT_TOKEN,
    //     "channel": ,
    //     //"ts": response.message.ts,
    //     "text": ":spades: :hearts: *Starting Texas Holdem' Poker!*:clubs::diamonds:\n(Enter game thread)"
    // }
    // bot.api.chat.postMessage(payload, function (err, response) {
    //     console.log(response);
    //     //startTournament(bot, { "channel": response.channel, "ts": response.message.ts, "use_demo": true });
    // });

}


module.exports = {
    createPoker,
    lobbyMenu,
    testShowCards,
    playerJoin,
    playerLeave,
    refreshLobbyList,
    refreshLobbySection,
    placeBet,
    getPlayerBankBalance,
    giveDailyBonus,
    joinedAndStartGame
}