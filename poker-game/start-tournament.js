const {
    showdown_mockup,
    update_state_msg_data_debug,
    update_setup_msg_data_debug,
    update_setup_msg_data_players_debug,
    update_state,
    update_setup,
    update_win,
    update_cards,
    update_showdown
} = require('../message-blocks/poker-messages');

const {
    getlobbies,
    getOneLobby,
    createLobby,
    addPlayer,
    deleteLobbyAll,
    updateLobby,
    getLobbyIdByName

} = require('../lobby/lobby-router');

const {
    createPlayer,
    checkIn,
    checkOut,
    withdraw,
    deposit,
    getOnePlayer,
    getAllPlayerInLobby,
    deletePlayerAll,
} = require('../player/player-router');

const startTournament = async (bot, data) => {

    /*          Chalk           */
    const chalk = require('chalk');
    const error = chalk.bold.red;
    const warning = chalk.keyword('orange');
    const preflop = chalk.black.bgWhite;

    /*        Requirement         */
    const childProcess = require("child_process");


    let player_lobby_data = [];
    let READY_TO_START = false;


    if (data.use_demo === true) {
        /*       DUMMY PLAYERS          */
        const dummyData = require('../player/dummy-players.json');
        const dummyLobbyID = await getLobbyIdByName(dummyData.lobbyName);
        player_lobby_data = await getAllPlayerInLobby(dummyLobbyID);
        READY_TO_START = true;
    } else {                                                            //  Note:   Possible error is when two users got here at the same time, and thought themselves to be 2nd player joinng the lobby
        /*       REAL PLAYERS           */                              //          Suppose if and only if the player joining is the 2nd one, then a new tournament would start (a new thread would be created).
        /*      Retrieve Lobby data         */                          //          For now, the expected recovery is the users to either ignore the 2nd thread(game) or start a new one if glitched terribly.
        let thisLobby = await getOneLobby(data.lobby_id);               //--------------------------------------- Between these two lines is where possible duplication game error may occur
        /*      Game Start Validation      */
        if (thisLobby.is_playing === false) {
            /*      Check for lobby status first to block off risk of duplicate-game error         */
            thisLobby.is_playing = true;
            /*      Update ASAP incase another player is joining simutaneously      */
            updateLobby(thisLobby);                                     //--------------------------------------- Between these two lines is where possible duplication game error may occur
            READY_TO_START = true;
            /*      Retrieve players data       */
            player_lobby_data = await getAllPlayerInLobby(data.lobby_id);
            console.log(`player lobby data= ${player_lobby_data}`);
            if (player_lobby_data.length < 2) {
                /*      Reset to false      */
                thisLobby.is_playing = false;
                updateLobby(thisLobby);
                READY_TO_START = false;
            }

        }

    }

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
                if (msg.data.type === "state" || msg.data.type === "bet") {
                    let this_player = await getOnePlayer({ slack_id: msg.data.playerId, team_id: this_team_id });
                    // #debug ---------------
                    console.log('\n------------- "state" This Player : -----------------\n');
                    // console.log('Searching for this player = \{ slack_id: ', msg.data.playerId, ', team_id: ', this_team_id, '...\n');
                    // console.log(this_player);
                    // console.log(chalk.bgMagenta('------------------------------------------'));
                    // ----------------------
                    msg.data.player = this_player;
                    this_block_message = update_state(msg);
                    console.log(this_block_message);

                }
                else if (msg.data.type === "setup") {
                    // #debug ---------------
                    console.log('\n------------- SETUP: -----------------\n');
                    // console.log(msg);
                    // console.log(msg.data.players);
                    // console.log(msg.data.players[0].cards);
                    this_block_message = update_setup(msg);
                    /*      Debug printing of player info       */
                    //this_block_message = this_block_message.concat(update_setup_msg_data_players_debug(msg));                
                    // ----------------------
                    console.log(this_block_message);
                } else if (msg.data.type === "cards") {
                    // #debug ---------------
                    console.log('\n------------- CARDS: -----------------\n');
                    console.log(msg);
                    this_block_message = update_cards(msg);
                    console.log('\n');
                    console.log(this_block_message);
                } else if (msg.data.type === "win") {
                    this_block_message = update_win(msg);
                } else if (msg.data.type === "showdown") {
                    // #debug ---------------
                    console.log('\n------------- CARDS: -----------------\n');
                    console.log(msg);
                    this_block_message = update_showdown(msg);
                    console.log('\n');
                    console.log(this_block_message);
                }

                /*      Not used debug function     */
                //await testConfigSetupMsg(msg, bot);

                bot.sendWebhook({
                    blocks: this_block_message,
                    channel: data.channel,
                    thread_ts: data.ts                   // Block this out to display message block in channel (instead of thread)

                }, function (err, res) {
                    if (err) {
                        console.log(err);
                    }
                });

                if (msg.data.type === 'win') {
                    /*      One game ended, kill thread       */
                    thread.send({ topic: "quit-game" });
                    thread.kill();
                }
                else {
                    //Replace with actions for this state!
                    setTimeout(() => {
                        console.log(chalk.bold("Attemting to end wait"));
                        thread.send({ topic: "acknowledgement" });
                    }, 6000);
                    //----------------end replacement.
                }
            }
            else {
                console.log(chalk.red("DEBUG: Uncaught message from child! ", msg.topic));
            }
        })

        /*        Start the game           */
        thread.send({ topic: "start-game" });
    }

    console.log(`READY_TO_START === ${READY_TO_START}`);
    if (READY_TO_START === true) {
        /*     Run the game script      */
        startT();
    }

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
                serviceUrl: "(missing)"
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