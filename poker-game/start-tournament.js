const {
    showdown_mockup,
    update_state_msg_data_debug,
    update_setup_msg_data_debug,
    update_setup_msg_data_players_debug,
    update_state,
    update_setup,
    update_win,
    update_cards,
    update_showdown,
    makeBet
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
    updatePlayer
} = require('../player/player-router');

const { retryGetCommonCards, retryGetPairCards } = require('../utils/cards');

const startTournament = async (bot, data) => {

    /*          Chalk           */
    const chalk = require('chalk');
    const error = chalk.bold.red;
    const warning = chalk.keyword('orange');
    const preflop = chalk.black.bgWhite;

    /*        Requirement         */
    const childProcess = require("child_process");


    let players_in_lobby = [];
    let READY_TO_START = false;
    let thisLobby;
    let tournament_configuration;
    if (data.use_demo === true) {
        /*       DUMMY PLAYERS          */
        const dummyData = require('../player/dummy-players.json');
        const dummyLobbyID = await getLobbyIdByName(dummyData.lobbyName);
        players_in_lobby = await getAllPlayerInLobby(dummyLobbyID);
        tournament_configuration = dummyData;
        READY_TO_START = true;
    } else {
        //                                                              //  Note:   Possible error is when two users got here at the same time, and thought themselves to be 2nd player joinng the lobby
        /*       REAL PLAYERS               */                          //          Suppose if and only if the player joining is the 2nd one, then a new tournament would start (a new thread would be created).
        /*      Retrieve Lobby data         */                          //          For now, the expected recovery is the users to either ignore the 2nd thread(game) or start a new one if glitched terribly.
        thisLobby = await getOneLobby(data.lobby_id);                   //--------------------------------------- Between these two lines is where possible duplication game error may occur
        if (!thisLobby) {
            console.log("\nERROR! start-tournament.js -> Real Players mode -> could not get the lobby");
        }
        /*      Game Start Validation      */
        if (thisLobby.is_playing === false) {
            console.log("\n./poker-game/start-tournament.js -> This lobby is not playing at the moment-------");
            /*      Check for lobby status first to block off risk of duplicate-game error         */
            thisLobby.is_playing = true;

            /*      Update ASAP incase another player is joining simutaneously      */
            updateLobby(thisLobby);                                     //--------------------------------------- Between these two lines is where possible duplication game error may occur
            READY_TO_START = true;

            /*      Retrieve players data       */
            players_in_lobby = await getAllPlayerInLobby(data.lobby_id);
            if (players_in_lobby.length < 2) {
                console.log("\n./poker-game/start-tournament.js -> This lobby will not start because there is only 1 player in lobby-------");
                /*      Reset to false      */
                thisLobby.is_playing = false;
                updateLobby(thisLobby);
                READY_TO_START = false;
            } else {
                console.log("\n./poker-game/start-tournament.js -> This lobby is not playing and is ready to start!-------");
            }

        }

        let t_pList = [];
        /*      Build player List       */
        for (let i = 0; i < players_in_lobby.length; i++) {
            let thisPlayer = players_in_lobby[i];
            let sID = thisPlayer.slack_id;
            let url = "https://imai-poker-utils.herokuapp.com/ua/" + sID + "/";
            let P = {
                "id": sID,
                "name": thisPlayer.name,
                "serviceUrl": url
            }
            t_pList.push(P);
        }

        /*          Config              */
        tournament_configuration = {
            "tournamentID": thisLobby._id,
            "playerList": t_pList,
            "lobbyName": thisLobby.name,
            "tournamentSettings": {
                "BUYIN": thisLobby.buyin,
                "WARMUP": false,
                "WARMUP_GAME": 10,
                "WARMUP_TIME": 10,
                "HAND_THROTTLE_TIME": 1,
                "SMALL_BLINDS": [thisLobby.minBet / 2],
                "SMALL_BLINDS_PERIOD": 1,
                "PAY_ANTE_AT_HAND": 1,
                "MAX_GAMES": 1,
                "POINTS": [
                    [10, 2, 0, 0]
                ]
            }
        }

    }
    // #debug------------------
    console.log("\n./poker-game/start-tournament.js > READY TO START | players_in_lobby = ");
    console.log(players_in_lobby);

    /*         Variables          */
    let num_players = players_in_lobby.length;
    let count_idx = 0;
    let this_team_id = players_in_lobby[0].team_id;
    let next_player_idx = -1;

    /*     Start Tounarment      */
    const startT = () => {

        /*      Ready message to establish the thread       */
        // allow player to enter the game thread early      //

        /*      Thread      */
        let configs = [JSON.stringify(tournament_configuration)];
        const thread = childProcess.fork("tournament2.js", configs);         //Immediately fork a child process to start to run tournament

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
                    /*          Report the last player's bet        */
                    let last_player = players_in_lobby.find(P => P.slack_id === msg.data.playerId);

                    // #debug ---------------
                    console.log('\n------------- "state" This Player : -----------------\n');
                    // console.log('Searching for this player = \{ slack_id: ', msg.data.playerId, ', team_id: ', this_team_id, '...\n');
                    // console.log(last_player);
                    // console.log(chalk.bgMagenta('------------------------------------------'));
                    // ----------------------

                    msg.data.player = last_player;
                    this_block_message = update_state(msg);
                    // console.log(this_block_message);

                    /*      Get the next player by PHE index        */
                    next_player_idx = last_player.idx + 1;

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
                    // console.log('\n./poker-game/start-tournament.js ---> update:setup: msg.data = ');
                    // console.log(msg.data);

                    /*          Update player images to database            */
                    let imgArr = msg.data.cardImages;
                    /*  {
                            index:
                            id: 
                            url: 
                        }               */
                    // for (let i = 0; i < imgArr.length; i++) {
                    //     let thisPlayer = await getOnePlayer({ slack_id: imgArr[i].id, team_id: this_team_id });
                    //     thisPlayer.cards = imgArr[i].url;
                    //     let updatedPlayer = await updatePlayer(thisPlayer);
                    //     updatedPlayer.idx = imgArr[i].index;
                    //     console.log('\n./poker-game/start-tournament.js ---> updated player! = ');
                    //     console.log(updatedPlayer);
                    //     players.push(updatedPlayer);
                    // }
                    for (let i = 0; i < imgArr.length; i++) {
                        let x = players_in_lobby.findIndex(P => P.slack_id === imgArr[i].id);
                        players_in_lobby[x].cards = imgArr[i].url;
                        players_in_lobby[x] = await updatePlayer(players_in_lobby[x]);
                        players_in_lobby[x].idx = imgArr[i].index;
                        // console.log('\n./poker-game/start-tournament.js ---> updated player! = ');
                        // console.log(players_in_lobby[x]);
                    }
                    //console.log(this_block_message);

                    /*      Get the next player by PHE index        */
                    next_player_idx = msg.data.nextBetPosition;


                    if (!msg.data.cardImages[0].url) {
                        console.log("!! -- IMAGE NOT FOUND @ PAIR CARDS-- !! Starting backup measures")
                        this_block_message = await retryGetPairCards(data, this_block_message)
                    }
                }
                else if (msg.data.type === "cards") {
                    // #debug ---------------
                    console.log('\n------------- CARDS: -----------------\n');
                    console.log(msg.data.cards);
                    this_block_message = update_cards(msg);

                    //If this_block_message does not contain the image URL :
                    if (!this_block_message[1].image_url) {
                        console.log("!! -- IMAGE NOT FOUND -- !! Starting backup measures")
                        this_block_message = await retryGetCommonCards(data, this_block_message)
                    }

                    console.log('\n');
                    console.log(this_block_message);

                    /*      Get the next player by PHE index        */
                    next_player_idx = msg.data.nextBetPosition;

                } else if (msg.data.type === "win") {
                    this_block_message = update_win(msg);
                } else if (msg.data.type === "showdown") {
                    // #debug ---------------
                    console.log('\n------------- SHOWDOWN: -----------------\n');
                    console.log(msg);
                    console.log("\n------------ msg.data.ranks");
                    console.log(JSON.stringify(msg.data.ranks));

                    for (let i = 0; i < msg.data.ranks.length; i++) {
                        let thisPlayer = await getOnePlayer(msg.data.ranks[i].playerId)
                        msg.data.ranks[i].bestCardsInfo.url = thisPlayer.cards;
                    }
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
                    else {
                        /*          Gather data and send message to the first player            */

                        if (msg.data.type === "setup" || (msg.data.type === "bet") || msg.data.type === "cards") {

                            /*      The player      */
                            let betting_data = {};
                            if (next_player_idx > num_players) { next_player_idx = 0; }
                            let next_player = players_in_lobby.find(P => P.idx === next_player_idx);

                            /*      The lobby       */
                            console.log(next_player);
                            betting_data.lobby_id = next_player.lastLobby;

                            /*      Message block       */
                            let private_message_block = makeBet(betting_data);

                            console.log("\n------ msg.data.type === " + msg.data.type + " ----------\n    ----- betting_data -----");
                            console.log(betting_data);
                            console.log("\n------ msg.data.type === " + msg.data.type + " ----------\n    ----- message_block------");
                            console.log(private_message_block);

                            /*      Send to one player       */
                            bot.api.chat.postEphemeral(
                                {
                                    "channel": data.channel,
                                    "thread_ts": data.ts,
                                    "token": process.env.BOT_TOKEN,
                                    "user": next_player.slack_id,
                                    //"text": "does this work?"
                                    "attachments": [
                                        {
                                            "blocks": private_message_block
                                        }
                                    ]
                                }
                            );
                        }
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
                    }, 8000);
                    //----------------end replacement.
                }
            }
            else {
                console.log(chalk.red("DEBUG: Uncaught message from child! ", msg.topic));
            }
        })

        /*        Start the game           */
        // thread.send({ topic: "start-game", configs: tournament_configuration });
        thread.send({ topic: "start-game" });
    }


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