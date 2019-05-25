const {
    showdown_mockup,
    askForBuyin,
    genLobbyNames,
    create_or_join,
    newGame_or_stay,
    current_lobbies_info
} = require('../message-blocks/poker-messages');

const {
    registerPlayer,
    registerLobby,
    playerJoinLobby,
    lobbyIsFull,
    getLobby,
    getLobbyPlayers,
    getCurrLobbyData,
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

    // let text = 'Lobby name is *' + convo.vars.lobby_name + '*, and buy-in is $[' + convo.vars.lobby_buyin + '].\nJust a moment <@' + user.slack_id + '>, let me try to set things up for you...';
    // convo.say(text);
    // convo.next();
    convo.say('');
    convo.next();

    /*      Only execute the the default values are properly overwritten        */
    if (convo.vars.lobby_name && convo.vars.lobby_buyin && convo.vars.lobby_name != convo.vars.lobby_buyin) {

        /*      Create Lobby with the given info        */
        //#debug------------
        // console.log("\n----- create lobby in poker-commands.js -------\nprint convo----------");
        // console.log(convo);
        //------------------
        const created_lobby = await registerLobby({ name: convo.vars.lobby_name, buyin: convo.vars.lobby_buyin, team_id: user.team_id, channel: convo.source_message.channel });
        convo.say('... Created lobby *' + created_lobby.name + '*.');
        convo.next();

        /*      Add this player to the new lobby        */
        const updated_lobby = await playerJoinLobby({ slack_id: user.slack_id, team_id: user.team_id }, created_lobby._id);
        convo.say('<@' + user.slack_id + '> is waiting in the lobby.');
        convo.next();

        /*      Check if the last procedure was successful      */
        if (updated_lobby) {
            convo.say('Game starts as soon as another player joins.\nLet me know if anyone would like to join the game. \n(enter \"@my_name poker\" in any channel, or privately.');
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
    // ...............................
    // todo : 						..
    // give user a drop down menu   ..
    // to choose buy-in             ..
    // if player has enough in bank ..
    //              and buy-in > 0	..
    //      validBuyin = true;      ..
    // else                         ..
    //      explain to user         ..
    // ...............................     

    //#debug -----------------
    // console.log("\n------------- askForBuyin() -----------");
    //console.log(convo);
    //------------------------
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

    //#debug -----------------
    // console.log("\n------------- askForLobbyName() -----------");
    //console.log(convo);
    //------------------------
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
                    //#debug -----------------
                    // console.log("\n------------- askForLobbyName() CALLBACK -----------");
                    // console.log(reply.text);
                    //------------------------
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
        // if (user) {
        //     NEW_PLAYER = false;
        //     convo.say(`Welcome back, <@${user.slack_id}>`);
        //     if (user.isInLobby) {
        //         convo.say('It appears that you are already in a game. You cannot create new lobby until you quit the current game. Please try again later.');
        //         convo.next();
        //         return null;
        //     }
        //     convo.next();
        // }
        if (!user) {

            /*           Create a user                */
            user = await createNewUser(user_data);
            // #debug ---------------
            // console.log("-> Created new user.");
            // -----------------------
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
                                console.log("\npoker-commands.js -> create_lobby_callback() removed player from current lobby, making a new one------\n")
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
                                convo.say('What?');
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


const joinPoker = async (bot, reply) => {

    // #debug ----------------------
    // console.log('\n---------------- poker-commands.js -> joinPoker() -----------------------------');
    // console.log('\nreply...');
    // console.log(reply);

    let thisPlayer = await getPlayerByID({ slack_id: reply.user, team_id: reply.team.id });

    /*      Load user data from DB by slack user ID         */
    let user_data = {
        slack_id: reply.user,
        name: reply.raw_message.user.name,
        team_id: reply.team.id,
        team_name: reply.team.domain
    };

    /*        Check if player is new or returning           */

    if (!thisPlayer) {
        /*           Create a user                */
        thisPlayer = await createNewUser(user_data);
        // #debug ---------------
        // console.log("\n-> Created new user.");
        // -----------------------

        /* not yet working */
        bot.say(`I have created a new account for you, <@${thisPlayer.slack_id}>. You now have \$${thisPlayer.bank}.`);

        //convo.say(`I have created a new account for you, <@${thisPlayer.slack_id}>. You now have \$${thisPlayer.bank}.`);
    }

    let lobbyList = [];
    lobbyList = await getCurrLobbyData(thisPlayer);

    //console.log('\n------------- test zone 2-----------------');
    // console.log(convo.source_message);
    // console.log("\n--------------\n");
    //console.log(lobbyList);

    let message_block = await current_lobbies_info(lobbyList);

    // #debug----------------------
    // console.log("\nPOST MESSAGE!\n");
    // console.log(message_block);
    //------------------------------
    convo.task.bot.api.chat.postMessage(
        {
            "channel": convo.source_message.channel,
            "token": process.env.BOT_TOKEN,
            "attachments": [
                {
                    "blocks": message_block
                }
            ]

        });
    // #debug-----------------------
    // console.log("\n");
    // console.log(convo);
    // -----------------------------

}


const playerJoin = async (data) => {

    /*       Add this player to the new lobby        */
    let response = await playerJoinLobby({ slack_id: data.user_slack_id, team_id: data.team_id }, data.lobby_id);

    return response;

}

const playerLeave = (user) => {
    lobbyRemovePlayer(user);
}

module.exports = {
    createPoker,
    joinPoker,
    testShowCards,
    playerJoin,
    playerLeave
}




