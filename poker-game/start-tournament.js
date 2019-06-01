"use strict";

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
    calculateWinnings,
    updatePlayerWallet,
    getAllPlayerInLobby,
    deletePlayerAll,
    updatePlayer
} = require('../player/player-router');

const { retryGetCommonCards, retryGetPairCards } = require('../utils/cards');

const startTournament = async (bot, data) => {

    /*      Ready message to establish the thread       */
    // TODO: allow player to enter the game thread early 

    /*        Prepare start game data       */
    let local_data = await game_setup(data);

    /*     Start Tounarment      */
    if (local_data.READY_TO_START === true) {
        startT(bot, local_data);
    }

}

const startT = (bot, local_data) => {

    /*        Requirement         */
    const childProcess = require("child_process");

    /*       Variables         */
    let configs = [JSON.stringify(local_data.tournament_configuration)];
    local_data.next_player_idx = -1;

    /*      Start Thread       */
    const thread = childProcess.fork("tournament2.js", configs);            //Immediately fork a child process to start to run tournament

    /*      Event Listener (to child process tournament)      */
    thread.on("message", async (msg) => {                                   //Each time child process passes a msg back, this thread listener catches it.
        if (msg.topic === "exit") {
            thread.kill();
        }
        else {
            /*        Build update message block + set next player to bet       */
            local_data = await eventHandler(local_data, msg);

            /*        Send update to Slack            */
            bot.sendWebhook(getUpdatePayload(local_data), async function (err, res) {
                if (err) {
                    console.log(err);
                }
                else {
                    await getNextBet(msg, local_data, bot);
                }
            });

            /*          Wait or no wait               */
            if (msg.data.type === 'win') {

                //set is_playing to false.
                local_data.thisLobby.is_playing = false;
                local_data.thisLobby = await updateLobby(local_data.thisLobby);

                //End game player list : group everything in one array that has { playerId , chips}
                let playerList = calculateWinnings(msg.data.playersEndGame, msg.data.winners);

                //Update everyone's wallet with playerList
                await updatePlayerWallet(playerList, local_data.thisLobby.team_id);

                /*      One game ended, kill thread       */
                thread.send({ topic: "quit-game" });
                thread.kill();
            }
            else {
                //Replace with actions for this state!
                setTimeout(() => {
                    // console.log(chalk.bold("Attempting to end wait"));
                    thread.send({ topic: "acknowledgement" });
                }, 8000);
                //----------------end replacement.
            }
        }

    })

    /*        Start the game           */
    // thread.send({ topic: "start-game", configs: tournament_configuration });
    thread.send({ topic: "start-game" });
}

/*      Not used debug function     */
// const testConfigSetupMsg = async (msg, bot) => {
//     console.log('\n------------ Testing dummy fetch ----------------\n');
//     try {
//         /*      Retrieve players data       */
//         const dummyLobbyID = await getLobbyIdByName("Test_Lobby_777");
//         const player_lobby_data = await getAllPlayerInLobby(dummyLobbyID);

//         /*      Convert DB JSON data into a suitable structure      */
//         let players = [];
//         let N = player_lobby_data.length;
//         for (let i = 0; i < N; i++) {
//             let player = player_lobby_data[i];
//             let P = {
//                 id: player.slack_id,
//                 name: player.name,
//                 serviceUrl: "(missing)"
//             };
//             players.push(P);
//         }
//         console.log('\n------------ msg from tournament instance ----------------\n');
//         // console.log(players);
//         console.log(msg);
//         console.log('-------------------------------------------\n');
//         /*      Build the block message with the player data and topic      */
//         const blockmsg = require('./configSetupMsg')(players, msg.topic);
//         /*      Bot send block message to slack        */
//         bot.sendWebhook({
//             blocks: blockmsg,
//             channel: message.channel_id,
//         }, function (err, res) {
//             if (err) {
//                 console.log(err);
//             }
//         });
//     }
//     catch (error) {
//         console.log(error);
//     }
// }


async function updatePlayerCardsImages(msg, players_in_lobby) {
    let imgArr = msg.data.cardImages;


    for (let i = 0; i < players_in_lobby.length; i++) {
        let x = players_in_lobby.findIndex(P => P.slack_id === imgArr[i].id);
        players_in_lobby[x].cards = imgArr[i].url;
        players_in_lobby[x] = await updatePlayer(players_in_lobby[x]);
        players_in_lobby[x].idx = imgArr[i].index;

    }
}

/*     Prepare update message payload     */
const getUpdatePayload = (local_data) => {
    return {
        blocks: local_data.this_block_message,
        channel: local_data.channel,
        thread_ts: local_data.ts
    }
}

const game_setup = async (data) => {
    let READY_TO_START = false;
    let thisLobby;
    let tournament_configuration;
    let players_in_lobby = [];

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
    // console.log("\n./poker-game/start-tournament.js > READY TO START | players_in_lobby = ");
    // console.log(players_in_lobby);

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


const eventHandler = async (local_data, msg) => {

    if (msg.topic === "updates") {
        console.log(chalk.bgMagenta('------------Tournament UPDATES------------'));
        console.log(msg);
        console.log(chalk.bgMagenta('------------------------------------------'));

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

            /*      Get the next player by PHE index and status        */
            local_data.next_player_idx = msg.data.nextBetPosition;
            local_data.next_player_status = msg.data.nextPlayerStatus;

            /*      Backup Card images          */
            // if (!msg.data.cardImages[0].url) {
            //     console.log(chalk.red("!! -- IMAGE NOT FOUND @ PAIR CARDS-- !! Starting backup measures"));
            //     local_data.this_block_message = await retryGetPairCards(local_data.players_in_lobby);
            // }
        }
        else if (msg.data.type === "state" || msg.data.type === "bet") {
            /*          Report the last player's bet        */
            let last_player_idx = local_data.players_in_lobby.findIndex(P => P.slack_id === msg.data.playerId);

            /*          Generate block message              */
            msg.data.player = local_data.players_in_lobby[last_player_idx];
            local_data.this_block_message = update_state(msg);

            /*      Get the next player by PHE index        */
            // potential next player is the next one after this last player
            let x = local_data.players_in_lobby[last_player_idx].idx + 1;
            if (x === local_data.num_players) { x = 0; }

            /*          Set next player         */
            local_data.next_player_status = msg.data.allPlayersStatus[x];
            local_data.next_player_idx = x;

        }
        else if (msg.data.type === "cards") {
            /*          Generate block message              */
            local_data.this_block_message = await update_cards(msg);

            /*          Save common cards image url in thisLobby         */
            local_data.thisLobby.common_cards_url = local_data.this_block_message[1].image_url;

            /*      Get the next player by PHE index and status        */
            local_data.next_player_idx = msg.data.nextBetPosition;
            local_data.next_player_status = msg.data.nextPlayerStatus;
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
        }
        else if (msg.data.type === "win") {
            local_data.this_block_message = update_win(msg);
            // #debug --------------------------------------------------------
            // console.log('\n------------- WIN: -----------------\n');
            // console.log("\n---- local_data.thisLobby ----");
            // console.log(local_data.thisLobby);
            // console.log("\n---- local_data.players_in_lobby ----");
            // console.log(local_data.players_in_lobby);
            //----------------------------------------------------------------
        }
        else {
            console.log(chalk.red("DEBUG: Uncaught message from child! ", msg.topic));
        }
        return local_data;
    }
}


const getNextBet = async (msg, local_data, bot) => {

    /*          Gather data and send message to the player            */
    if (msg.data.type === "setup" || msg.data.type === "bet" || msg.data.type === "cards" || msg.data.type === "state") {

        console.log("\ngetNextBet() > Check next_player_status--------");
        console.log(local_data.next_player_status);

        if (local_data.next_player_status.chips === 0) {
            console.log(chalk.blue("\n- makeBet() skipped > this player has all-in'd -\n"));
        }
        else {
            /*          Unset if player already bet         */
            if (local_data.next_player_status.already_bet === true) {
                console.log("\n");
                console.log(chalk.bgCyan("This player already bet! Betting round done!"));
                console.log(local_data.players_in_lobby[local_data.next_player_idx].name);
                console.log(chalk.bgCyan("------------------------\n"));
            }
            /*          Unset if player is not in active state (fold/all-in)         */
            else if (local_data.next_player_status.state !== "active") {
                console.log(chalk.blue("\n- makeBet() skipped > this player has already bet -\n"));
            }
            else {

                /*      The player      */
                let betting_data = {};
                if (local_data.next_player_idx === local_data.num_players) { local_data.next_player_idx = 0; }
                let next_player = local_data.players_in_lobby.find(P => P.idx === local_data.next_player_idx);
                betting_data.P = next_player;

                /*      The lobby       */
                betting_data.lobby_id = next_player.lastLobby;

                /*      Message block       */
                if (msg.data.amount) { betting_data.amount_in_short = msg.data.amount; }
                else {
                    betting_data.amount_in_short = msg.data.callAmount - local_data.next_player_status.chipsBet;
                }

                betting_data.wallet = local_data.next_player_status.chips;
                betting_data.call_amount = msg.data.callAmount;
                betting_data.chips_already_bet = local_data.next_player_status.chipsBet;
                betting_data.min_bet = msg.data.minBet;
                betting_data.cards_array = local_data.next_player_status.cards;
                betting_data.type = msg.data.type;

                // #debug ------------------
                console.log(chalk.green("\n----- [", next_player.name, "] is going to bet NOW!--------"));
                // console.log("\n--------- ./poker-game/start-tournament.js ------- next player to bet --------- ");
                // console.log(next_player);
                // console.log("-------------- msg.data : data supplied from tournament2.js ----------");
                // console.log(msg.data);
                console.log("-------------- betting_data: data to be passed into makeBet() ------------");
                console.log(betting_data);
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
            }
        }
    }

    else {
        // Don't make bet messages in these updates
        console.log(chalk.blue("\n- makeBet() skipped > This is not an update:state that should be betting -\n"));
    }

}

module.exports = {
    startTournament
};