
const startTournament = async (bot, thread_message_head) => {
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

    /*     Start Tounarment      */
    const startT = () => {
        /*      Thread      */
        const thread = childProcess.fork("tournament2.js");         //Immediately fork a child process to start to run tournament

        thread.on("message", async (msg) => {                       //Each time child process passes a msg back, this thread listener catches it.
            if (msg.topic === "exit") {
                thread.kill();
            }
            else if (msg.topic === "updates") {
                console.log(chalk.bgMagenta('------------Tournament UPDATES------------'));
                console.log(msg);
                console.log(chalk.bgMagenta('------------------------------------------'));

                let this_block_message = [];
                if (msg.data.type === "state") {
                    let this_player = await getOnePlayer({ slack_id: msg.data.playerId, team_id: this_team_id })
                    // #debug ---------------
                    // console.log('\n------------- "state" This Player : -----------------\n');
                    // console.log('Searching for this player = \{ slack_id: ', msg.data.playerId, ', team_id: ', this_team_id, '...\n');
                    // console.log(this_player);
                    // console.log(chalk.bgMagenta('------------------------------------------'));
                    // ----------------------
                    msg.data.player = this_player;
                    this_block_message = update_state(msg);

                }
                else if (msg.data.type === "setup") {
                    // #debug ---------------
                    // console.log('\n------------- SETUP: -----------------\n');
                    // console.log(msg);
                    // console.log(msg.data.players);
                    // console.log(msg.data.players[0].cards);

                    this_block_message = update_setup(msg);
                    /*      Debug printing of player info       */
                    //this_block_message = this_block_message.concat(update_setup_msg_data_players_debug(msg));                
                    // ----------------------
                }

                /*      Not used debug function     */
                //await testConfigSetupMsg(msg, bot);

                bot.sendWebhook({
                    blocks: this_block_message,
                    channel: thread_message_head.channel,
                    thread_ts: thread_message_head.ts                   // Block this out to display message block in channel (instead of thread)

                }, function (err, res) {
                    if (err) {
                        console.log(err);
                    }
                });

                //Replace with actions for this state!
                setTimeout(() => {
                    console.log(chalk.bold("Attemting to end wait"));
                    thread.send({ topic: "reply" });
                }, 5000);
                //----------------end replacement.
            }
            else {
                console.log(chalk.red("DEBUG: Uncaught message from child! ", msg.topic));
            }
        })

        /*        Start the game           */
        thread.send({ topic: "start-game" });
    }

    /*     Run the game script      */
    startT();
}


/*      Not used debug function     */
const testConfigSetupMsg = async (msg, bot) => {
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
                serviceUrl: "https://mangrove-weather.glitch.me"
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

module.exports = {
    startTournament
};