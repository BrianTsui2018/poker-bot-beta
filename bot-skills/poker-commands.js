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
    withdrawChip
} = require('./manager.js');

const {
    startTournament
} = require('../poker-game/start-tournament')



//const Botkit = require('botkit');


/*------------------------------------------------------------------------------------
|   Create New User
|
|   Description:
|   Takes in a conversation object and the user data
|   Creates a new user according to input data and returns the player object
|                                                                                   */
const createNewUser = async (user_data) => {
    try {
        const new_player_chips = 1000000;
        /*           Create a user                  */
        let user = await registerPlayer(user_data);
        /*           Assign chip to user            */
        user = await assignChip(user_data, new_player_chips);
        return user;
    } catch (error) {
        console.log(`\n----------------------\nERROR! poker-commands.js failed to create user / assign chip.\n----------------------\n`);
    }
}

/*------------------------------------------------------------------------------------
|   Setup Lobby
|
|   Description:
|   This is a callback function.
|   Assumes the necessary inputs have been recieved in convo.vars
|                                                                                   */
const setupLobby = async (convo, user) => {

    convo.say('');
    convo.next();

    /*      Only execute the the default values are properly overwritten        */
    if (convo.vars.lobby_name && convo.vars.lobby_buyin && convo.vars.lobby_name != convo.vars.lobby_buyin) {

        /*      Create Lobby with the given info        */
        const created_lobby = await registerLobby({ name: convo.vars.lobby_name, buyin: convo.vars.lobby_buyin, team_id: user.team_id, channel: convo.source_message.channel });
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

/*------------------------------------------------------------------------------------
|   Get Lobby Name from User
|
|   Description:
|   This is a callback function.
|   Gets a lobby name from user
|                                                                                   */
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
    let res = create_lobby_callback(convo, reply.raw_message); // the actual callback function
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
    lobbyRemovePlayer(user);
}


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


module.exports = {
    createPoker,
    lobbyMenu,
    testShowCards,
    playerJoin,
    playerLeave,
    refreshLobbyList,
    refreshLobbySection
}