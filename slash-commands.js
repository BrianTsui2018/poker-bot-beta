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
    showdown_mockup,
    update_state_msg_data,
    update_setup_msg_data,
    update_setup_msg_data_players
} = require('./message-blocks/poker-messages');


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
                name: 'Test_Lobby_777'
            });
            bot.reply(message, `New lobby [${dummyLobby.name}] created! Currently has [${dummyLobby.currentPlayers}] players...`);

            bot.reply(message, 'Creating dummy players on Database...');
            const playerList = [
                {
                    id: "000001",
                    name: "Stephanie",
                    serviceUrl: "https://e20c063e.ngrok.io"
                },
                {
                    id: "000002",
                    name: "Noah",
                    serviceUrl: "https://e20c063e.ngrok.io"
                },
                {
                    id: "000003",
                    name: "Brian",
                    serviceUrl: "https://e20c063e.ngrok.io"
                },
                {
                    id: "000004",
                    name: "Angry Poker Dude",
                    serviceUrl: "https://e20c063e.ngrok.io"
                },
            ];

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
            const gotThisLobby = await getOneLobby(message.text);
            if (gotThisLobby) {
                const lobby_name = gotThisLobby.name;
                const cur_p = gotThisLobby.currentPlayers;
                const max_p = gotThisLobby.maxPlayers;
                const players = gotThisLobby.playerList;
                const buyin = gotThisLobby.buyin;
                // #debug --------------------------------
                // console.log(gotThisLobby);
                //----------------------------------------

                var str = `Info for the requested lobby:\n`;
                str = str.concat(lobby_name, ` [`, cur_p, `/`, max_p, `] | Buy-in $`, buyin, ` | `);
                players.forEach((player) => { str = str.concat(`<@${player}>, `) });
                str = str.substr(0, str.length - 2);
                // #debug --------------------------------
                // console.log(str);
                //----------------------------------------
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
            starts a tournament
        */
        case '/start':
            // #debug ------------------------------------------------
            console.log('\n... slash-commands/js : Start tournament---------------\n');
            //--------------------------------------------------------        
            bot.reply(message, "This is the beginning of the tournament thread.", function (err, response) {
                // #debug-----
                // console.log("\n---------- /start -------\n");
                // console.log(message);
                //--------------
                response.message.channel = message.channel_id;
                startTournament(bot, response.message);
            });

            break;
        default:
            bot.reply(message, 'What command is that');
    }
}

module.exports = {
    handleSlash
};

async function startTournament(bot, thread_message_head) {
    /*          Chalk           */
    const chalk = require('chalk');
    const error = chalk.bold.red;
    const warning = chalk.keyword('orange');
    const preflop = chalk.black.bgWhite;

    /*        Requirement         */
    const childProcess = require("child_process");

    /*      Retrieve players data       */
    const dummyLobbyID = await getLobbyIdByName("Test_Lobby_777");
    const player_lobby_data = await getAllPlayerInLobby(dummyLobbyID);


    /*         Variables          */
    let preflop_done = false;
    let num_players = player_lobby_data.length;
    let players_contacted = 0;
    let this_team_id = player_lobby_data[0].team_id;

    // #debug ------
    // console.log(chalk.blue.bgWhite("\nBefore starting the tournament...\n"));
    // console.log("->", thread_message_head);
    // -------------   

    bot.replyInThread(thread_message_head, "This is a thread reply.");
    //bot.reply(thread_message_head, "This is a thread reply.");

    /*     Start Tounarment      */
    const startT = () => {
        /*      Thread      */
        const thread = childProcess.fork("phe-api.js");
        // #debug ------
        console.log(chalk.blue.bgWhite("Thread created!"));
        // bot.sendWebhook({
        //     text: 'This is an incoming webhook',
        //     channel: message.channel_id,
        // }, function (err, res) {
        //     if (err) {
        //         console.log(err);
        //     }
        // });

        // -------------

        thread.on("message", async (msg) => {
            if (msg.topic === "exit") {
                thread.kill();
            }
            else if (msg.topic === "updates") {
                let this_block_message = [];
                if (msg.data.type === "state") {
                    let this_player = await getOnePlayer({ slack_id: msg.data.playerId, team_id: this_team_id })
                    // #debug ---------------
                    console.log('\n------------- This Player : -----------------\n');
                    console.log('Searching for this player = \{ slack_id: ', msg.data.playerId, ', team_id: ', this_team_id, '...\n');
                    console.log(this_player);
                    console.log(chalk.bgMagenta('------------------------------------------'));
                    // ----------------------
                    msg.data.player = this_player;
                    this_block_message = update_state_msg_data(msg);

                }
                else if (msg.data.type === "setup") {
                    // #debug ---------------
                    console.log('\n------------- SETUP: -----------------\n');
                    console.log(msg);
                    console.log(msg.data.players);
                    console.log(msg.data.players[0].cards);

                    this_block_message = update_setup_msg_data(msg);
                    this_block_message = this_block_message.concat(update_setup_msg_data_players(msg));

                    console.log('\n------------- this block message: -----------------\n');
                    console.log(this_block_message);
                    console.log('\n');
                    console.log(chalk.bgMagenta('------------------------------------------'));
                    // ----------------------
                }

                /*      Not used debug function     */
                //await testConfigSetupMsg(msg, bot);

                console.log(preflop('Index.js | out of set up.| '));
                //msg.data.ante = 25;
                //t.pause();
                // #debug-----------------
                // console.log('\n---------\nmsg.data : -----------------\n');
                // console.log(msg);
                // console.log('\n', thread_message_head);
                // -------------------------

                //bot.replyInThread(thread_message_head, update_msg_data(msg));

                bot.sendWebhook({
                    blocks: this_block_message,
                    channel: thread_message_head.channel,
                    thread_ts: thread_message_head.ts                   // Block this out to display message block in channel (instead of thread)

                }, function (err, res) {
                    if (err) {
                        console.log(err);
                    }

                });

                if (!preflop_done) {
                    thread.send({ topic: "go-preflop" });
                    preflop_done = true;
                }
                else if (players_contacted < num_players) {
                    players_contacted++;
                    console.log(warning("Index.js | msg players ... Currently : " + (players_contacted) + "/3"))
                    if (players_contacted < num_players - 1) {
                        thread.send({ topic: "go-preflop" });
                    }
                    else {
                        //enter FLOP.
                        //thread.send({ topic: "go-flop" });
                        thread.send({ topic: "debug pause" });
                    }
                }
                else {
                    console.log(warning("Index.js | pausing..."));
                    thread.send({ topic: "debug pause" });
                }
            }
            else {
                setup = msg.topic;
                //console.log(setup);
                thread.send({ topic: "debug pause" });
            }
        })
        thread.send({ topic: "create" });
    }
    startT();
}

async function testConfigSetupMsg(msg, bot) {
    console.log('\n------------ Testing dummy fetch ----------------\n');
    try {
        /*      Retrieve players data       */
        const dummyLobbyID = await getLobbyIdByName("Test_Lobby_777");
        const player_lobby_data = await getAllPlayerInLobby(dummyLobbyID);

        /*      Convert DB JSON data into a suitable structure      */
        let players = [];
        let N = player_lobby_data.length;
        for (let i = 0; i < N; i++) {
            let player = player_lobby_data[i];
            let P = {
                id: player.slack_id,
                name: player.name,
                serviceUrl: "https://e20c063e.ngrok.io"
            };
            players.push(P);
        }
        console.log('\n------------ msg from tournament instance ----------------\n');
        // console.log(players);
        console.log(msg);
        console.log('-------------------------------------------\n');
        /*      Build the block message with the player data and topic      */
        const blockmsg = require('./configSetupMsg')(players, msg.topic);
        /*      Bot send block message to slack        */
        bot.sendWebhook({
            blocks: blockmsg,
            channel: message.channel_id,
        }, function (err, res) {
            if (err) {
                console.log(err);
            }
        });
    }
    catch (error) {
        console.log(error);
    }
}

