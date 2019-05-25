const {
    getlobbies,
    getOneLobby,
    createLobby,
    addPlayer,
    deleteLobbyAll,
    getLobbyIdByName
} = require('./lobby/lobby-router');

const {
    createPlayer,
    checkIn,
    checkOut,
    withdraw,
    deposit,
    getOnePlayer,
    getAllPlayerInLobby,
    deletePlayerAll,
} = require('./player/player-router');

const {
    startTournament
} = require('./poker-game/start-tournament')

const {
    showdown_mockup,
    start_game,
    pingPlayer
} = require('./message-blocks/poker-messages');

/*      Dummy Data      */
const dummyData = require('./player/dummy-players.json');


const handleSlash = async (bot, message) => {
    switch (message.command) {
        /*
            Testing purpose. 
        */
        case '/talk':

            bot.reply(message, 'Sup. Slash commands are now working.');
            console.log('\n-------------------------------------------------------\n');
            console.log(message);
            console.log('\n-------------------------------------------------------\n');
            break;

        /*
            Create Dummy players on DB
        */
        case '/populate':
            bot.reply(message, 'Making a new lobby to put all the bots in...');
            const dummyLobby = await createLobby({
                name: dummyData.lobbyName,
                team_id: message.team_id
            });

            bot.reply(message, `New lobby [${dummyLobby.name}] created! Currently has [${dummyData.playerList.length}] players...`);
            const playerList = dummyData.playerList;

            /*      For each dummy player     */
            // playerList.forEach(player => {
            //     /*           Prepare a payload           */
            //     let dummy_data = {};
            //     console.log(player);
            //     dummy_data.slack_id = player.id;
            //     dummy_data.name = player.name;
            //     dummy_data.team_id = message.team.id;
            //     dummy_data.team_name = message.team.domain;
            //     /*           Create a player             */
            //     dummy = createNewUser(dummy_data);
            // });
            let N = playerList.length;
            for (let i = 0; i < N; i++) {
                let player = playerList[i];
                console.log(player);
                let dummy_data = {};
                dummy_data.slack_id = player.id;
                dummy_data.name = player.name;
                dummy_data.team_id = message.team_id;
                dummy_data.team_name = message.team_domain;
                dummy_data.bank = 1000000;
                dummy_data.lastLobby = dummyLobby._id;
                dummy_data.wallet = 0;
                dummy_data.isInLobby = true;
                dummy = createPlayer(dummy_data);
            }

            break;
        /*
            Prints the showdown message block.
        */
        case '/results':

            bot.sendWebhook({
                blocks: showdown_mockup(),
                channel: message.channel_id,
            }, function (err, res) {
                if (err) {
                    console.log(err);
                }
            });
            break;

        /*
            Get all lobbies.
        */
        case '/get-lobby':

            const all_lobbies = await getlobbies();
            if (all_lobbies.length === 0) {
                // There is no lobby
                bot.reply(message, 'There are no available lobbies recorded in database.');
            }
            else {
                // There are some lobbies
                bot.reply(message, `There are currently ${all_lobbies.length} lobbies available...which one do you want to join?`);
                // ...............................
                // todo : 						..
                // start a conversation			..
                // make decisions				..
                // ...............................
            }
            break;

        /*
            makes new lobby.
        */
        case '/make-lobby':
            const newlobby = await createLobby({
                name: message.text,
                // -------- Optional data to init ------------ 
                // maxPlayers : ,
                currentPlayers: 1,
                playerList: [message.user_id],
                // buyin :
                // -------------------------------------------
            });
            bot.reply(message, `New lobby [${newlobby.name}] created! Currently has [${newlobby.currentPlayers}] players...`);
            break;

        /*
            joins a specified lobby by name.
        */
        case '/join-lobby':
            const lobby_name = message.text;
            const user_id = message.user_id;
            const thisLobby = addPlayer(user_id, lobby_name);
            // #debug -------------------------------------
            // console.log(message);
            //---------------------------------------------
            break;

        /*
            Check the detail of one lobby.
                Displays lobby name, [cur # players / max ], player1 player2 player3.
        */
        case '/check-lobby':
            const thisLobbyID = await getLobbyIdByName(message.text);
            const gotThisLobby = await getOneLobby(thisLobbyID);
            if (gotThisLobby._id) {
                const lobby_name = gotThisLobby.name;
                const max_p = gotThisLobby.maxPlayers;
                const buyin = gotThisLobby.buyin;
                const channel = gotThisLobby.channel;
                // #debug --------------------------------
                // console.log(gotThisLobby);
                //----------------------------------------
                const players = await getAllPlayerInLobby(gotThisLobby._id);
                const cur_p = players.length;

                var str = `Info for the requested lobby:\n`;
                str = str.concat(lobby_name, ` [`, cur_p, `/`, max_p, `] | Buy-in $`, buyin, ` | Channel <#`, channel, '> | ');
                players.forEach((player) => { str = str.concat(`<@${player.slack_id}>, `) });
                str = str.substr(0, str.length - 2);
                bot.reply(message, str);
            }
            else {
                // Could not find lobby
                bot.reply(message, `No lobby matches the lobby name you provided.`);
            }
            break;

        /*
            deletes all lobbies from DB.
        */
        case '/clear_lob':
            // #debug ------------------------------------------------
            console.log('\n... slash-commands/js : Cleared all lobbies from DB---------------\n');
            //--------------------------------------------------------
            const deletedLobbies = await deleteLobbyAll();
            bot.reply(message, `Debug: All lobbies have been deleted from the database.`);
            break;

        /*
            deletes all players from DB.
        */
        case '/clear_ply':
            // #debug ------------------------------------------------
            console.log('\n... slash-commands/js : Cleared all players from DB---------------\n');
            //--------------------------------------------------------        
            const deletedPlayers = await deletePlayerAll();
            bot.reply(message, `Debug: All players have been deleted from the database.`);
            break;

        /*
            starts a demo tournament
        */
        case "/demo":
            // #debug ------------------------------------------------
            console.log("\n... slash-commands/js : Start demo tournament---------------\n");
            //--------------------------------------------------------

            bot.reply(message, ":black_joker: I'm starting a *Texas Poker Holdem Game!* :black_joker:",
                function (err, response) {
                    // #debug-----
                    // console.log("\n---------- /start -------\n");
                    // console.log(message);
                    //--------------
                    response.message.channel = message.channel_id;
                    startTournament(bot, response.message);
                }
            );

            break;
        /*
                Pings all users in lobby
        */
        case "/start":
            // #debug ------------------------------------------------
            console.log("\n... slash-commands/js : Start ---------------\n");
            //--------------------------------------------------------
            bot.reply(message, "Ping All players in lobby.",
                async function (err, response) {
                    // #debug-------------------------
                    // console.log("\n------- message");
                    // console.log(message);
                    // console.log("\n---------------response");
                    // console.log(response);
                    //--------------------------------

                    /*      gather data         */
                    let data = {
                        team_id: message.team_id,
                        user_slack_id: message.user_id,
                        lobby_channel: message.channel_name,
                        thread_ts: response.ts
                    }

                    /*      Thread start messgae        */
                    bot.sendWebhook({
                        "text": "start here.",
                        "channel": data.lobby_channel,
                        "thread_ts": data.thread_ts                   // Block this out to display message block in channel (instead of thread)

                    }, function (err, res) {
                        if (err) {
                            console.log(err);
                        }
                    });

                    /*      get player for lobby id        */
                    let thisPlayer = await getOnePlayer({ slack_id: data.user_slack_id, team_id: data.team_id });
                    data.lobby_id = thisPlayer.lastLobby;
                    /*      get array of users in lobby     */
                    data.players = await getAllPlayerInLobby(data.lobby_id);

                    /*      message block       */
                    let message_block = pingPlayer(data);
                    // console.log("\n------ data -----");
                    // console.log(data);
                    // console.log("\n----- message_block------");
                    // console.log(message_block);
                    /*      ping each user      */
                    for (let i = 0; i < data.players.length; i++) {
                        bot.api.chat.postEphemeral(
                            {
                                "channel": data.lobby_channel,
                                "thread_ts": data.thread_ts,
                                "token": process.env.BOT_TOKEN,
                                "user": data.players[i].slack_id,
                                //"text": "does this work?"
                                "attachments": [
                                    {
                                        "blocks": message_block
                                    }
                                ]

                            });

                    }

                }
            );
            break;
        default:
            bot.reply(message, 'What command is that');
    }
}

module.exports = {
    handleSlash
};

