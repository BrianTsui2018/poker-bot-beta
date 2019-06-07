"use strict";

const events = require('events');
const crow = new events.EventEmitter();

/*          Chalk           */
const chalk = require('chalk');
const error = chalk.bold.red;
const warning = chalk.keyword('orange');
const preflop = chalk.black.bgWhite;


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
    makeBet,
    makeStatus
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
    calculateWinnings,
    updatePlayerWallet,
    updateSetupPlayerWallet,
    getAllPlayerInLobby,
    deletePlayerAll,
    updatePlayer
} = require('../player/player-router');

const {
    wakeup
} = require('../utils/wakeup');

/*        Requirement         */
const childProcess = require("child_process");

let tournament_stopwatch;
let EventEmitter = require('events').EventEmitter
let botEvent = new EventEmitter();
let thread;
let curr_player_slack_id;
let LOCK = true;

botEvent.on('SlackBot: Got User Action', (args) => {
    // console.log(chalk.magenta("START-TOUR | GOT BOT EVENT"));
    if (args) {
        let data = args[0];
        // console.log(data);
        if (data.user_slack_id === curr_player_slack_id && LOCK === false) {
            LOCK = true;
            clearTimeout(tournament_stopwatch);
            thread.send({ topic: "acknowledgement" })
        } else {
            // console.log(chalk.red("Wrong player spamming button!"));
        }
    } else {
        clearTimeout(tournament_stopwatch);
        thread.send({ topic: "acknowledgement" })
    }
})

const shortCutCountDown = () => {
    botEvent.emit("SlackBot: Got User Action");
}

const startTournament = async (bot, data) => {
    /*      Ready message to establish the thread       */
    wakeup();

    /*        Prepare start game data       */
    let local_data = await game_setup(data);

    /*          Start Tounarment            */
    if (local_data.READY_TO_START === true) {
        startT(bot, local_data);
    } else {
        console.log("\nstart-tournament.js > startTournament() : READY_TO_START is false.")
    }

}

const startT = (bot, local_data) => {
    /*       Variables         */
    let configs = [JSON.stringify(local_data.tournament_configuration)];
    local_data.next_player_idx = -1;

    /*      Start Thread       */
    thread = childProcess.fork("tournament2.js", configs);            //Immediately fork a child process to start to run tournament
    crow.emit("Forked Tournament2.js", configs);

    /*      Event Listener (to child process tournament)      */
    thread.on("message", async (msg) => {                                   //Each time child process passes a msg back, this thread listener catches it.
        if (msg.topic === "exit") {
            thread.kill();
        }
        else {
            /*        Build update message block + set next player to bet       */
            local_data = await eventHandler(local_data, msg);

            // console.log(chalk.bgRed("\n------- start-tournament.js > startT() ---------"));
            // console.log("this block message ---------");
            // console.log(local_data.this_block_message);
            // console.log("\nlocal_data.channel ---------");
            // console.log(local_data.channel);
            // console.log("\nlocal_data.ts ---------");
            // console.log(local_data.ts);

            if (msg.data.type === "setup") {
                updateSetupPlayerWallet(local_data.players_in_lobby, msg.data.allPlayersStatus);
            }

            /*      Send update message block       */
            bot.api.chat.postMessage(getUpdatePayload(local_data), async function (err, res) {
                // let done = false;
                if (err) { console.log(err); }

                if (msg.data.type !== "win" && msg.data.type !== "showdown") {
                    await updateAllPlayerChips(local_data, msg);
                    if (local_data.next_player_status.state === "active" && local_data.next_player_status.already_bet === false && local_data.next_player_status.chips > 0) {
                        /*      Build player status message block      */
                        local_data = await playerStatusHandler(local_data, msg);
                        /*      Send player status message block       */
                        bot.api.chat.postMessage(getUpdatePayload(local_data), async function (err, res) {

                            /*      Ask next player for the bet     */
                            await getNextBet(msg, local_data, bot);
                        });
                    } else {
                        /*      Ask next player for the bet     */
                        await getNextBet(msg, local_data, bot);
                    }
                } else {
                    /*      Ask next player for the bet     */
                    await getNextBet(msg, local_data, bot);
                }

                // if (done === false) {
                //     /*      Ask next player for the bet     */
                //     await getNextBet(msg, local_data, bot);
                //     /*      Process ends here, next step continues at index.js, when event hears player's button        */
                // }
            });

            /*          Wait or no wait               */
            if (msg.data.type === 'win') {
                let backupLobby = local_data.thisLobby;
                //set is_playing to false.
                local_data.thisLobby.is_playing = false;
                local_data.thisLobby = await updateLobby(local_data.thisLobby);

                /*      Case when all players have left and lobby no longer exists on DB, hence null       */
                if (!local_data.thisLobby) { local_data.thisLobby = backupLobby };

                //End game player list : group everything in one array that has { playerId , chips}
                // let playerList = calculateWinnings(msg.data.playersEndGame, msg.data.winners);
                let playerList = msg.data.playersEndGame;
                console.log(chalk.bgRed("\n~~~~~~~~~~~~~~~~~~~~~"));
                console.log("\n-------------- playerEndGame");
                console.log(msg.data.playersEndGame);
                console.log("\n-------------- winners");
                console.log(msg.data.winners);
                console.log("\n");

                //Update everyone's wallet with playerList
                await updatePlayerWallet(playerList, local_data.players_in_lobby, true);

                /*--------------- Construction site ---------------------*/
                /*      Send checkout button        */

                crow.emit("End of Tournament", local_data);

                /*--------------------------------------*/


                /*      One game ended, kill thread       */
                thread.send({ topic: "quit-game" });
                thread.kill();
                // thread.send({ topic: "continue" })

            }
            else {
                let waitTime = 45000;
                tournament_stopwatch = setTimeout(() => {
                    console.log(chalk.magenta("ENDING TIMEOUT"));
                    crow.emit("IDLE_KICK", { "slack_id": local_data.players_in_lobby[local_data.next_player_idx].slack_id, "team_id": local_data.this_team_id });
                    thread.send({ topic: "acknowledgement" });
                }, waitTime);

                // let checkTime = 30000;
                // setTimeout(() => {
                //     bot.api.chat.postMessage(timeCheck(local_data));
                // }, checkTime);


            }
        }
    })

    /*        Start the game           */
    thread.send({ topic: "start-game", players_in_lobby: local_data.players_in_lobby });
}

function updateAllPlayerChips(local_data, msg) {
    let n = local_data.num_players;
    for (let i = 0; i < n; i++) {
        local_data.players_in_lobby[i].state = msg.data.allPlayersStatus[i].state;
        local_data.players_in_lobby[i].remaining_chips = msg.data.allPlayersStatus[i].chips;
        // local_data.players_in_lobby[i].wallet = local_data.players_in_lobby[i].remaining_chips;
    }
}

async function updatePlayerCardsImages(msg, players_in_lobby) {

    let imgArr = msg.data.cardImages;
    if (imgArr) {
        for (let i = 0; i < players_in_lobby.length; i++) {
            if (imgArr[i]) {
                let x = players_in_lobby.findIndex(P => P.slack_id === imgArr[i].id);
                players_in_lobby[x].cards = imgArr[i].url;
                players_in_lobby[x] = await updatePlayer(players_in_lobby[x]);
                players_in_lobby[x].idx = imgArr[i].index;
            } else {
                console.log(chalk.red("\n\n./poker-game/start-tournament.js -> updatePlayerCardImages() : Player did not get image from Imgur!\n\n"));
            }
        }
    } else {
        console.log(chalk.red("\n\n./poker-game/start-tournament.js -> updatePlayerCardImages() : Util / Imgur was late!\n\n"));
    }
}

/*     Prepare update message payload     */
const getUpdatePayload = (local_data) => {
    return {
        "token": process.env.BOT_TOKEN,
        "blocks": local_data.this_block_message,
        "channel": local_data.channel,
        "thread_ts": local_data.ts
    }
}

const timeCheck = (local_data) => {
    return {
        "token": process.env.BOT_TOKEN,
        "text": "*15 seconds remaining*:stopwatch:",
        "channel": local_data.channel,
        "thread_ts": local_data.ts
    }
}

const game_setup = async (data) => {
    let READY_TO_START = true;
    let thisLobby = data.lobby;
    let tournament_configuration;
    let players_in_lobby = data.players_in_lobby;

    if (data.use_demo === true) {
        /*       DUMMY PLAYERS          */
        const dummyData = require('../player/dummy-players.json');
        const dummyLobbyID = await getLobbyIdByName(dummyData.lobbyName);
        thisLobby = await getOneLobby(dummyLobbyID);
        players_in_lobby = await getAllPlayerInLobby(dummyLobbyID);
        tournament_configuration = dummyData;
        READY_TO_START = true;
    } else {
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
                "WARMUP_GAME": 0,
                "WARMUP_TIME": 0,
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

    /*          Return this             */
    let return_data = {
        "READY_TO_START": READY_TO_START,
        "thisLobby": thisLobby,
        "tournament_configuration": tournament_configuration,
        "players_in_lobby": players_in_lobby,
        "num_players": players_in_lobby.length,
        "this_team_id": thisLobby.team_id,
        "cards": data.cards,
        "channel": data.channel,
        "ts": data.ts
    }
    return return_data;
}

const resetCurrBet = async (local_data, msg) => {
    let n = local_data.num_players;
    for (let i = 0; i < n; i++) {
        local_data.players_in_lobby[i].curr_bet = 0;
        if (msg.data.type === "setup") {
            local_data.players_in_lobby[i].chips_already_bet = msg.data.allPlayersStatus[i].chipsBet;
            local_data.players_in_lobby[i].curr_bet = msg.data.allPlayersStatus[i].chipsBet;
        }
    }
}

const updateCurrBet = async (local_data, new_chipsBet) => {
    // #debug -----------
    // console.log("\n---- updateCurrBet ----");
    let P = local_data.players_in_lobby[local_data.last_player_idx];
    // console.log("new_chipsBet > " + new_chipsBet);
    // console.log("P.chips_already_bet > " + P.chips_already_bet);
    P.curr_bet += new_chipsBet - P.chips_already_bet;
    // console.log("P.curr_bet > " + P.curr_bet);
    P.chips_already_bet = new_chipsBet;
    local_data.players_in_lobby[local_data.last_player_idx] = P;
    // console.log("new chips_already_bet from local_data = " + local_data.players_in_lobby[local_data.last_player_idx].chips_already_bet)
    return P;
}


const eventHandler = async (local_data, msg) => {

    if (msg.topic === "updates") {
        console.log(chalk.bgMagenta('------------Tournament UPDATES [' + msg.data.type + ' ]------------'));
        console.log(msg);
        console.log(chalk.bgMagenta('------------------------------------------'));
        console.log("\t--- [ local_data.players_in_lobby ] ---");
        console.log(local_data.players_in_lobby);

        local_data.this_block_message = [];
        if (msg.data.type === "setup") {

            /*          Generate block message              */
            local_data.this_block_message = update_setup(msg);

            /*          Update player images to database            */
            let res = await updatePlayerCardsImages(msg, local_data.players_in_lobby);

            if (res) {
                console.log("\n--------- Check this player's cards -----------")
                console.log(local_data.players_in_lobby[0].cards);
            }

            /*      Reset all player's curr_session_bet to      */
            resetCurrBet(local_data, msg);

            /*      Get the next player by PHE index and status        */
            local_data.next_player_idx = msg.data.nextBetPosition;
            local_data.next_player_status = msg.data.nextPlayerStatus;

        }
        else if (msg.data.type === "state" || msg.data.type === "bet") {
            console.log(chalk.bgRed("------------ bet phase ------------ check last player remaining chips update"));
            /*          Report the last player's bet        */
            local_data.last_player_idx = local_data.players_in_lobby.findIndex(P => P.slack_id === msg.data.playerId);

            /*          Update last player's curr_Bet       */
            let new_chipsBet = msg.data.allPlayersStatus[local_data.last_player_idx].chipsBet;
            let last_player = await updateCurrBet(local_data, new_chipsBet);
            // console.log("\n------- last_player after updateCurrBet -------- ");
            // console.log(last_player);
            // console.log("------------------------------");

            /*          Generate block message              */
            msg.data.player = last_player;
            local_data.this_block_message = update_state(msg);

            /*      Get the next player by PHE index        */
            // potential next player is the next one after this last player
            let x = local_data.players_in_lobby[local_data.last_player_idx].idx + 1;
            if (x === local_data.num_players) { x = 0; }
            let n = 0;
            while (msg.data.allPlayersStatus[x].state === 'fold' && n < 10) {
                x++; n++;
                if (x === local_data.num_players) { x = 0; }
            }

            /*          Set next player         */
            local_data.next_player_status = msg.data.allPlayersStatus[x];
            local_data.next_player_idx = x;
            local_data.skipped = n;
        }
        else if (msg.data.type === "cards") {
            /*      Reset all player's curr_session_bet to      */
            resetCurrBet(local_data, msg);

            // console.log(chalk.bgRed("\n----- CARDS session ----"));
            // console.log("\n--- [local_data] ---");
            // console.log(local_data);
            // console.log("--- [msg] ---");
            // console.log(msg);

            /*          Generate block message              */
            local_data.this_block_message = await update_cards(msg);

            /*          Save common cards image url in thisLobby         */
            local_data.thisLobby.common_cards_url = local_data.this_block_message[1].image_url;

            /*      Get the next player by PHE index and status        */
            local_data.next_player_idx = msg.data.nextBetPosition;
            local_data.next_player_status = msg.data.nextPlayerStatus;
            local_data.skipped = msg.data.skipped;
        }
        else if (msg.data.type === "showdown") {
            // #debug ---------------------------------------------------------
            // console.log('\n------------- SHOWDOWN: -----------------\n');
            // console.log(msg);
            // console.log("\n------------ msg.data.ranks");
            // console.log(JSON.stringify(msg.data.ranks));
            //----------------------------------------------------------------
            for (let i = 0; i < msg.data.ranks.length; i++) {
                let thisPlayer = await getOnePlayer({ slack_id: msg.data.ranks[i].playerId, team_id: local_data.this_team_id });
                msg.data.ranks[i].bestCardsInfo.url = thisPlayer.cards;
            }

            local_data.this_block_message = update_showdown(msg, local_data.thisLobby.common_cards_url);

            //local_data.this_block_message = showdown_mockup();
        }
        else if (msg.data.type === "win") {
            local_data.this_block_message = update_win(msg);
        }
        else {
            console.log(chalk.red("DEBUG: Uncaught message from child! ", msg.topic));
        }
        return local_data;
    }
}

const playerStatusHandler = async (local_data, msg) => {

    if (local_data.next_player_status.state === "active" && local_data.next_player_status.already_bet === false && local_data.next_player_status.chips > 0) {
        local_data.this_block_message = makeStatus(local_data);
    }
    return local_data;
}

const getNextBet = async (msg, local_data, bot) => {

    /*          Gather data and send message to the player            */
    if (msg.data.type === "setup" || msg.data.type === "bet" || msg.data.type === "cards" || msg.data.type === "state") {

        // console.log("\ngetNextBet() > Check next_player_status--------");
        // console.log(local_data.next_player_status);
        if (local_data.skipped) {
            if (local_data.skipped > 0) {
                // console.log(chalk.red("! SKIPPED" + local_data.skipped + " folded player(s) !"));
            }
        }
        if (local_data.next_player_status.chips === 0) {
            // console.log(chalk.blue("\n- makeBet() skipped > this player has all-in'd -\n"));

            /*      shortcut timeout        */
            shortCutCountDown();
        }
        else {
            /*          Unset if player already bet         */
            if (local_data.next_player_status.already_bet === true) {

                /*      shortcut timeout        */
                shortCutCountDown();
            }
            /*          Unset if player is not in active state (fold/all-in)         */
            else if (local_data.next_player_status.state !== "active") {

                /*      shortcut timeout        */
                shortCutCountDown();
            }
            else {

                /*      The player      */
                let betting_data = {};
                if (local_data.next_player_idx === local_data.num_players) { local_data.next_player_idx = 0; }
                let next_player = local_data.players_in_lobby.find(P => P.idx === local_data.next_player_idx);
                curr_player_slack_id = next_player.slack_id;
                betting_data.P = next_player;

                /*      The lobby       */
                betting_data.lobby_id = next_player.lastLobby;

                /*      Message block       */
                betting_data.amount_in_short = msg.data.callAmount - local_data.next_player_status.chipsBet;
                betting_data.wallet = local_data.next_player_status.chips;
                betting_data.call_amount = msg.data.callAmount;
                betting_data.small_blind_position = msg.data.smallBlindPosition;
                betting_data.min_bet = msg.data.minBet;
                betting_data.cards_array = local_data.next_player_status.cards;
                betting_data.type = msg.data.type;

                // #debug ------------------
                // console.log(chalk.green("\n----- [", next_player.name, "] is going to bet NOW!--------"));
                // console.log("\n--------- ./poker-game/start-tournament.js ------- next player to bet --------- ");
                // console.log(next_player);
                // console.log("-------------- msg.data : data supplied from tournament2.js ----------");
                // console.log(msg.data);
                // console.log("-------------- betting_data: data to be passed into makeBet() ------------");
                // console.log(betting_data);
                //-------------------------
                let private_message_block = await makeBet(betting_data);


                //-------------------------- final check on images and apply backup if needed
                // #debug ------------------
                // console.log("\n------ msg.data.type === " + msg.data.type + " ----------\n    ----- betting_data -----");
                // console.log(betting_data);
                // console.log("\n------ msg.data.type === " + msg.data.type + " ----------\n    ----- message_block------");
                // console.log(private_message_block);
                //-------------------------

                /*      Prepare payload     */
                let bet_message_payload = {
                    "channel": local_data.channel,
                    "thread_ts": local_data.ts,
                    "token": process.env.BOT_TOKEN,
                    "user": next_player.slack_id,
                    "attachments": [
                        {
                            "blocks": private_message_block
                        }
                    ]
                }
                /*      Send to one player       */
                bot.api.chat.postEphemeral(bet_message_payload);
                LOCK = false;

            }
        }
    }
    else {
        /*      This is "Showdown" or "Win"        */

        /*      shortcut timeout        */
        if (msg.data.type !== 'win') {
            shortCutCountDown();
        }
        // Don't make bet messages in these updates
        //console.log(chalk.blue("\n- makeBet() skipped > This is not an update:state that should be betting -\n"));
    }

}



module.exports = {
    startTournament,
    botEvent,
    crow
};