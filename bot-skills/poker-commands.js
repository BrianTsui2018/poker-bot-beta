/*          Chalk           */
const chalk = require('chalk');
const error = chalk.bold.red;
const warning = chalk.keyword('orange');
const preflop = chalk.black.bgWhite;

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
    axiosPUT,
    restartLobbies
} = require('./manager.js');


const {
    updateLobby
} = require('../lobby/lobby-router');

// const {
//     startTournament
// } = require('../poker-game/tournament-parent');

const {
    startTournament,
    crow
} = require('../poker-game/start-tournament');

crow.on("Forked Tournament2.js", (args) => {

})

crow.on("IDLE_KICK", (data) => {
    let user = { "slack_id": data.slack_id, "team_id": data.team_id };
    playerLeave(user);
})

crow.on("End of Tournament", (local_data) => {
    // console.log("\n<<<<<<< Crow >>>>>>>>>>>\nEnd of Tournament--------");
    // console.log(local_data);
    joinedAndStartGame(local_data.thisLobby._id, local_data.players_in_lobby, local_data.ts);
})


/**
 * Creates a new user according to input data and returns the player object
 * @param {Object}  user_data 
 * @returns         updated user data
 */
const createNewUser = async (user_data, bot_token) => {
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

        user = await patchPlayerDP(user, bot_token);
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
        const updated_lobby = await playerJoinLobby({ slack_id: user.slack_id, team_id: user.team_id }, created_lobby._id, bot.config.token);
        convo.say('<@' + user.slack_id + '> is waiting in the lobby.\nGame starts as soon as another player joins.:spades:');
        let curr_bank = user.bank - convo.vars.lobby_buyin;

        // let team = await convo.task.bot.botkit.storage.teams.get(user.team_id);
        bot.api.chat.postMessage({ "token": bot.config.token, "channel": user.slack_id, "as_user": true, "text": `You withdrew \$${convo.vars.lobby_buyin} from your bank\nYour bank balance: \$${curr_bank}` });
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
            user = await createNewUser(user_data, convo.task.bot.config.token);
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
    lobbyList = await getCurrLobbyData({ "team_id": bot.team_info.id }, bot.config.token);
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
    let thisLobbyPlayerList = await getOneLobbyData(thisLobby, bot.config.token);
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

    /*      Grant this Player chips if new      */
    await newPlayerChips(bot, data);

    /*       Add this player to the new lobby        */
    let updatedLobby = await playerJoinLobby({ slack_id: data.user_slack_id, team_id: data.team_id }, data.lobby_id, bot.config.token);


    let player = await getPlayerByID({ "slack_id": data.user_slack_id, "team_id": data.team_id });

    // let team = await convo.task.bot.botkit.storage.teams.get(data.team_id);

    /*      DM user about balance       */
    bot.api.chat.postMessage({ "token": bot.config.token, "channel": player.slack_id, "as_user": true, "text": `You withdrew \$${player.wallet} from your bank\nYour bank balance: \$${player.bank}` });


    return player;
}

/*      Refresh Lobby List      */
const refreshLobbyList = async (bot, message) => {
    let data = {
        slack_id: message.user,
        team_id: message.team.id
    }

    /*      Get the list of lobby in this team       */
    let lobbyList = await getCurrLobbyData(data, bot.config.token);
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
    let thisLobbyPlayerList = await getOneLobbyData(thisLobby, bot.config.token);
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

const playerLeave = async (user) => {
    let data = await lobbyRemovePlayer(user);
    // let team = await convo.task.bot.botkit.storage.teams.get(user.team_id);

    bot.api.chat.postMessage({ "token": bot.config.token, "channel": user.slack_id, "as_user": true, "text": `You have deposited \$${data.deposit_amount} into your bank\nYour bank balance: \$${data.player.bank}` })
    return data.player;
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
            team_name: data.team_domain,
        };

        /*           Create a user                */
        thisPlayer = await createNewUser(new_user, bot.config.token);

        bot.api.chat.postMessage(
            {
                "channel": data.channel_id,
                "token": bot.config.token,
                "text": `I have created a new account for you, <@${thisPlayer.slack_id}>. You now have \$${thisPlayer.bank}.\nI'll now register you to the lobby...`
            }
        );
    }

    return thisPlayer;
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
            data.spent = betData.action;
            await updatePlayerWallet(data);
            return body.data;
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


const joinedAndStartGame = async (lobby_id, prevPlayers, prevTS) => {

    /*      Get the lobby           */
    let thisLobby = await getLobbyByID(lobby_id);

    /*      Only if Lobby still exist (deleted if all prev players left)        */
    if (thisLobby) {
        let RESTART = false;
        if (prevPlayers) { RESTART = true; }

        /*      Block duplicate procedure       */
        if (thisLobby.is_playing === false) {
            /*      Set this lobby's play mode to true     */
            thisLobby.is_playing = true;
            updateLobby(thisLobby);

            /*      Get all players who are in lobby according to DB        */
            let L = await getLobbyPlayers(lobby_id);
            let players = L.playerList;

            /*      RESTART mode        */
            if (RESTART) { players = restartHandler(prevPlayers, players); }

            /*          Exclude extra players if there is       */
            players = players.slice(0, thisLobby.maxPlayers);

            /*      Get the channel         */
            let thisChannel = thisLobby.channel;
            if (players.length >= 2) {    // This is 2nd time validating player number. It was first checked when player joins lobby.

                if (RESTART) {
                    /*      Redirect to Game Thread             */
                    restartPrevGame(thisChannel, prevTS, thisLobby, players);
                } else {
                    /*      Post message and Start Game        */
                    startNewGame(thisChannel, thisLobby, players);
                }

            } else {
                /*      Set this to false so that next player join would be allowed to start game again         */
                thisLobby.is_playing = false;
                updateLobby(thisLobby);

                // let team = await convo.task.bot.botkit.storage.teams.get(thisLobby.team_id);

                /*      Case: lobby is empty        */
                let payload = {
                    "token": bot.config.token,
                    "channel": thisChannel,
                    "thread_ts": prevTS,
                    "text": "*\*Shuffles\**There aren't enough players. Game resumes when another player joins.\n(Perhaps join another lobby?)"
                };
                bot.api.chat.postMessage(payload, function (err, response) { });

            }
        } else {
            /*      Case: lobby is already playing      */

        }


    }
    else {
        /*      Case: lobby is empty        */
        // let payload = {
        //     "token": process.env.BOT_TOKEN,
        //     "channel": thisChannel,              // if lobby doesn't exist, this channel cannot be found
        //     "thread_ts": prevTS,
        //     "text": "*\*Shuffles\**This lobby is closed. For a new game, please *Create* or *Join* another lobby.\nIf you're leaving for now, direct message me to say \"*Leave*\" or \"*Checkout*\":door:"
        // };
        // bot.api.chat.postMessage(payload, function (err, response) { });
    }


}

const serverReset = () => {
    restartLobbies();
}


async function restartPrevGame(thisChannel, prevTS, thisLobby, players) {

    /*      DM all players      */
    notifyPlayer(thisChannel, prevTS, players);

    /*      Construct names string        */
    let names_str = '<@' + players[0].slack_id + '>';
    for (let i = 1; i < players.length; i++) {
        names_str = names_str.concat(', <@', players[i].slack_id, '>');
    }

    // let team = await convo.task.bot.botkit.storage.teams.get(thisLobby.team_id);

    let head_payload = {
        "token": bot.config.token,
        "channel": thisChannel,
        "ts": prevTS,
        "text": ":spades: :hearts: *Starting Texas Holdem' Poker!*:clubs::diamonds:\nPlayers in *" + thisLobby.name + "* :\n:small_orange_diamond:" + names_str + ", please enter this game thread:small_orange_diamond:\n:small_red_triangle_down:Click below:small_red_triangle_down:"
    };
    bot.api.chat.update(head_payload, function (err, response) {
        if (response.ok) {
            let thisTS = prevTS;
            /*      Post message to ts          */
            let thread_payload = {
                "token": bot.config.token,
                "channel": thisChannel,
                "thread_ts": thisTS,
                "text": "*Shuffling*...:hourglass_flowing_sand:"
            };
            bot.api.chat.postMessage(thread_payload, function (err, response) {
                /*      Start Tournmanet at ts      */
                startTournament(bot, { "channel": thisChannel, "ts": thisTS, "lobby_id": thisLobby._id, "use_demo": false, "players_in_lobby": players, "lobby": thisLobby });
            });
        } else {
            console.log(error);
        }
    });
}

async function startNewGame(thisChannel, thisLobby, players) {

    /*      Construct names string        */
    let names_str = '<@' + players[0].slack_id + '>';
    for (let i = 1; i < players.length; i++) {
        names_str = names_str.concat(', <@', players[i].slack_id, '>');
    }

    // let team = await convo.task.bot.botkit.storage.teams.get(thisLobby.team_id);

    let head_payload = {
        "token": bot.config.token,
        "channel": thisChannel,
        "text": ":spades: :hearts: *Starting Texas Holdem' Poker!*:clubs::diamonds:\nPlayers in *" + thisLobby.name + "* :\n:small_orange_diamond:" + names_str + ", please enter this game thread:small_orange_diamond:\n:small_red_triangle_down:Click below:small_red_triangle_down:"
    };
    bot.api.chat.postMessage(head_payload, function (err, response) {

        let thisTS = response.message.ts;

        notifyPlayer(thisChannel, thisTS, players);
        /*      Post message to ts          */
        let thread_payload = {
            "token": bot.config.token,
            "channel": thisChannel,
            "thread_ts": thisTS,
            "text": "Welcome! The game will be starting soon, please stand by...:hourglass_flowing_sand:"
        };
        bot.api.chat.postMessage(thread_payload, function (err, response) {
            /*      Start Tournmanet at ts      */
            startTournament(bot, { "channel": thisChannel, "ts": thisTS, "lobby_id": thisLobby._id, "use_demo": false, "players_in_lobby": players, "lobby": thisLobby });
        });
    });
}

const notifyPlayer = async (thisChannel, thisTs, p_list) => {
    // console.log(chalk.bgRed("\n---------------- ./bot-skills/poker-commands.js > notifyPlayer() ---------"))
    /*          Get Permalink           */
    let permalink;
    let team_id = p_list[0].team_id;
    // let team = await convo.task.bot.botkit.storage.teams.get(team_id);

    let payload = {
        "token": bot.config.token,
        "channel": thisChannel,
        "message_ts": thisTs,
    }
    bot.api.chat.getPermalink(payload, function (err, response) {
        if (err) { console.log(err); }
        console.log(response);
        permalink = response.permalink;
        let n = p_list.length;

        for (let i = 0; i < n; i++) {
            let P = p_list[i];
            payload = {
                "token": bot.config.token,
                "channel": P.slack_id,
                "text": `*The lobby you have joined is starting the game soon!*\n:small_orange_diamond:<${permalink}|Click Here> to game thread.:small_orange_diamond:\n*Remember to leave game* when you're done, just message me here, say "*checkout*" or "*leave*":door:.`,
                "as_user": true
            }
            bot.api.chat.postMessage(payload, function (err, response) {
                if (err) { console.log(err); }
            });
        }
    });
}

function restartHandler(prevPlayers, players) {
    let newList = [];
    let quitList = [];
    console.log(chalk.bgRed("\n----------------- restartHandler ---------------- Check player that remains"))
    /*      Remove left players and broke players    */
    for (let i = 0; i < prevPlayers.length; i++) {
        let thisP = players.find(P => P.slack_id === prevPlayers[i].slack_id);
        if (!thisP) {
            console.log(chalk.green("\n--------------- remove gone player -----------"));
            quitList.push(prevPlayers[i]);
            console.log(prevPlayers[i]);
        }
        else if (prevPlayers[i].remaining_chips < 2000) {
            console.log(chalk.green("\n--------------- kick broke player, force checkout -----------"));
            prevPlayers[i].isInLobby = false;
            crow.emit("IDLE_KICK", { "slack_id": prevPlayers[i].slack_id, "team_id": prevPlayers[i].team_id });
            quitList.push(prevPlayers[i]);
            console.log(prevPlayers[i]);
        }
        else if (thisP && prevPlayers[i].remaining_chips > 0) {
            newList.push(prevPlayers[i]);
            // console.log(chalk.green("\n--------------- keep player -----------"));
            console.log(prevPlayers[i]);
        }
        else {
            quitList.push(prevPlayers[i]);

        }
    }

    for (let j = 0; j < players.length; j++) {
        let found = quitList.find(P => P.slack_id = players[j].slack_id);
        if (found) {
            players[j].isInLobby = false;
        }
    }

    /*      Push new players        */
    for (let i = 0; i < players.length; i++) {
        let thisP = newList.find(P => P.slack_id === players[i].slack_id);
        if (!thisP && players[i].isInLobby) {
            console.log(chalk.green("\n--------------- now push new players -----------"));
            console.log(players[i]);
            newList.push(players[i]);
        }
    }

    /*      Shift left          */
    let firstP = newList.shift();
    newList.push(firstP);

    return newList;
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
    joinedAndStartGame,
    serverReset
}