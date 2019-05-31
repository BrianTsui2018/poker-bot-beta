const axios = require('axios');

const {
    getlobbies,
    getOneLobby,
    createLobby,
    deleteLobby,
    deleteLobbyAll,
    getAllLobbiesInTeam,
    getAllActiveLobbiesInTeam
} = require('../lobby/lobby-router');

const {
    checkIn,
    checkOut,
    createPlayer,
    withdraw,
    deposit,
    getOnePlayer,
    getAllPlayerInLobby,
    getAllCurrentPlayersInTeam,
    updatePlayer
} = require('../player/player-router');

const getLobbyByID = async (lobby_id) => {
    const thisLobby = await getOneLobby(lobby_id);
    if (thisLobby) {
        return thisLobby;
    }
    else {
        return null;
    }
}

const getPlayerByID = async (player_data) => {
    const thisPlayer = await getOnePlayer(player_data);
    if (thisPlayer) {
        return thisPlayer;
    }
    else {
        return null;
    }

}

/*----------------------------------------------------------------------
|	[Manager.js] Remove Player from Lobby
|
|	Description:
|   - Handles player leaving a lobby
|	- Calls player.checkOut procedure
|	- Validations for these actions
|	 																	*/
const lobbyRemovePlayer = async (player_data) => {
    /*      Get player      */
    let thisPlayer = await getPlayerByID(player_data);
    /*      Check-out Player    */
    if (thisPlayer) {
        thisPlayer = await checkOut(thisPlayer);
    }
    else {
        // #debug ------------------------------------
        console.log(`\nmanager.js -> lobbyRemovePlayer() : getOnePlayer did not find user\n` + player_data.slack_id);
    }
    /*      Clean Lobby     */
    let thisLobbyID = thisPlayer.lastLobby;
    let remainingPlayers = await getAllPlayerInLobby(thisLobbyID);
    if (remainingPlayers.length === 0 || (remainingPlayers.length === 1 && remainingPlayers[0].slack_id === thisPlayer.slack_id)) {
        console.log("manager.js cleaning up the empty lobby.");
        deleteLobby({ _id: thisLobbyID });
    }
    return thisPlayer;                 // Returns updated player object OR null
}

const lobbyIsFull = async (lobby_id) => {
    /*      Get lobby           */
    const thisLobby = await getLobbyByID(lobby_id);

    /*      Return if not found     */
    if (!thisLobby) {
        // #debug --------------------------------------
        console.log(`\nWarning! manager.js -> lobbyIsFull(): queried a lobby that does not exist, returning false\n`);
        // ---------------------------------------------
        return true;
    }

    /*      Count players       */
    const playerList = await getAllPlayerInLobby(thisLobby._id);

    /*      Check Occupance     */
    if (playerList.length() < thisLobby.maxPlayers) {
        return false;
    }
    return true;
}

/*      Read the chip amount from user's bank (DB) by Slack user ID     */
const getPlayerBank = async (player_data) => {
    const thisPlayer = await getPlayerByID(player_data);
    const chips = thisPlayer.bank;
    return chips;
}

const patchPlayerDP = async (newPlayer) => {
    let extra_data = await axiosGet(newPlayer.slack_id, newPlayer.name);            // input only needs {name, slack_id}, returns { slack_id, display_name, dp_url }
    newPlayer.dp = extra_data.dp_url;
    newPlayer = updatePlayer(newPlayer);
    return newPlayer;
}

const registerPlayer = async (user_data) => {
    let newPlayer = await createPlayer(user_data);
    return newPlayer;
}

const registerLobby = async (lobby_data) => {
    const newLobby = await createLobby(lobby_data);
    return newLobby;
}

const getLobbyPlayers = async (lobby_id) => {
    const playerList = await getAllPlayerInLobby(lobby_id);
    // #debug -----------------------------
    //console.log("\n--------- manager.js/getLobbyPlayers -> return from getAllPlayerInLobby -----------------\n");
    //console.log(playerList);
    //-----------------------------------
    let num_players = playerList.length;
    return { num_players, playerList };
}

const playerJoinLobby = async (user_data, lobby_id) => {
    const thisPlayer = await getPlayerByID(user_data);
    let thisLobby = await getLobbyByID(lobby_id);
    let valid = true;
    // check if player exist
    if (!thisPlayer) {
        // return {
        //     success: false,
        //     player: undefined,
        //     lobby: undefined,
        //     text: `Could not fint this user [` + slack_id + `] in record.`
        // };
        return null;
    }
    // check if player is already in lobby
    if (thisPlayer.isInLobby) {
        if (thisPlayer.lastLobby === lobby_id) {
            return "ALREADY";
        } else {
            await lobbyRemovePlayer(thisPlayer);
            thisPlayer.isInLobby = false;

        }

    }
    // check if lobby exist    
    if (!thisLobby) {
        valid = false;
        return "NO-LOBBY";
    }
    // check if player bank >= buyin
    if (thisPlayer.bank < thisLobby.buyin) {
        valid = false;
        return "BROKE";
    }

    // check if lobby curr player < max players
    let currPlayers = await getLobbyPlayers(thisLobby._id);
    if (currPlayers.num_players >= thisLobby.maxPlayers) {
        valid = false;
        return "FULL";
    }
    // check-in player to lobby
    if (valid) {
        //add this step is required for checking in to work must have something to do with js data types
        var checkin_data = { slack_id: thisPlayer.slack_id, team_id: thisPlayer.team_id, lobby_id: thisLobby._id, buyin: thisLobby.buyin };
        const updatedPlayer = await checkIn(checkin_data);

        if (updatedPlayer) {
            const updated_lobby = await getLobbyByID(lobby_id);
            if (updated_lobby) {
                return updated_lobby;
            }
        }
    }
    else {
        // #debug -----------------------------
        currPlayers = await getLobbyPlayers(thisLobby._id);
        console.log(`\n------------------\nFailed to add ` + user_data.name + `. This is the lobby: [\n` + thisLobby + `]-------------\n`);
        //-------------------------------------      
        return null;
    }

}


/*----------------------------------------------------------------------
|	[Manager.js] Get Curr Lobby Data
|
|	Description:
|   -  Input: a player object
|	-  Output: an [array] of 
|           {   
|               {lobby object}, 
|               [currPlayers ID, ID, ID] 
|           }
|	 																	*/
const getCurrLobbyData = async (thisPlayer) => {

    // #debug -------------
    // console.log('\n:---------- botskills/manager.js -> getAllLobby ---------');
    // console.log('\nInput: data');
    // console.log(thisPlayer);
    //---------------------

    /*      Get this user's team_id     */
    let team_id = thisPlayer.team_id;
    // #debug -------------
    // console.log('\nGet this user\'s team_id :');
    // console.log(team_id);
    //---------------------

    /*      Get all players with the same team_id in a Set      */
    let allPlayersInTeam = await getAllCurrentPlayersInTeam({ team_id: team_id });
    // #debug -------------
    // console.log('\nGet all players with the same team_id in a Set :');
    // console.log(allPlayersInTeam);
    //--------------------

    /*      Gather all Lobby Data (in a Set)        */
    let lobby_Id_data = [];
    let P_set = new Set();
    for (let i = 0; i < allPlayersInTeam.length; i++) {
        P_set.add(allPlayersInTeam[i].lastLobby);
    }
    let it = P_set.values();
    P_set.forEach(function () {
        let L_id = it.next().value;
        lobby_Id_data.push(L_id);
    });

    // #debug -------------
    // console.log('\nThis is the set of Lobbies :');
    // console.log(lobby_Id_data);
    //--------------------

    /*      Get all lobbies from the set    */
    let allLobbiesInTeam = await getAllActiveLobbiesInTeam(lobby_Id_data);
    // #debug -------------
    // console.log('\nGet all lobbies from this set :');
    // console.log(allLobbiesInTeam);
    //--------------------

    /*      Construct data          */
    let data = await constructAllCurrLobbyData(allLobbiesInTeam, allPlayersInTeam);
    return data;
}

const getOneLobbyData = async (thisLobby) => {
    let data = [];
    /*      Get all the active players in lobby     */
    let players = await getAllPlayerInLobby(thisLobby._id);
    // #debug --------------------------------------------------------
    console.log("\n------ manager.js ---------- players:");
    console.log(players);


    /*      Construct data          */
    for (let j = 0; j < players.length; j++) {
        player_data = await axiosGet(players[j]);
        data.push(player_data);
    }
    return data;
}

/*--------------------------------------------------------------------
|	[Player / Player-Router.js] Deposit
|
|	Description:
|	- Special usage, deposit chips directly
|   - chips ensured to be positive or atleast zero
|																	*/
const deposit = async (data, chips) => {
    let thisPlayer = await getOnePlayer(data);
    if (!thisPlayer) {
        console.log('\n--------------------\nERROR! player-routers.js->deposit() could not find the player according to player_data\n--------------------------\n');
        return null;
    }
    /*       Update Player data         */
    thisPlayer.bank += chips;
    //------------------------------------

    /*       Push Player updates        */
    let updatedPlayer = await player.findOneAndUpdate({ slack_id: thisPlayer.slack_id, team_id: thisPlayer.team_id }, thisPlayer, { new: true });
    updatedPlayer = await player.findById(updatedPlayer._id);

    return updatedPlayer;
}
//--------------------------------------------------------------------

/**
 * 
 * @param {Object []} playersEndGame   Ones that just get remaining chips
 * @param {Object []} winners  Ones that remaining chips + winning amount.
 * @returns [] An array of playerIds and chips to be updated.
 */
const calculateWinnings = (playersEndGame, winners) => {

    let playerWallets = []; // { playerId : x , chips : y}

    for (w of winners) {
        let thisWinner = { playerId: w.playerId, chips: w.amount };
        playerWallets.push(thisWinner);
    }

    for (player of playersEndGame) {
        let exist = playerWallets.findIndex(p => p.playerId === player.id);
        if (exist === -1) {
            //not in list yet
            let thisPlayer = { playerId: player.id, chips: player.chips };
            playerWallets.push(thisPlayer);
        } else {
            //already in list, add their remainder back.
            playerWallets[exist].chips += player.chips
        }

    }

    return playersWallets;
}

/**
 * Updates player wallet. Needs playerId and chips from EACH player in playerList.
 * @param {Object} playerList 
 * @param {String} team_id
 */
const updatePlayerWallet = async (playerList, team_id) => {
    async.each(playerList, async (player, callback) => {

        try {
            // { playerId : x , chips : y}
            let thisPlayer = await getOnePlayer({ slack_id: player.playerId, team_id });
            thisPlayer.wallet = player.chips;
            await thisPlayer.save();

            callback();

        } catch (error) {
            throw new Error("Could not find player nor update!")
        }

        //callback()
    }, (err, res) => {
        if (err) {
            console.log("Player-router.js | updatePlayerWallet ERROR | ")
            console.log(err);
        }

        if (res) {
            console.log("Updated wallet successfully.")
        }

    })
}

/**
 * Seeks for a player base on slack id and team id. Updates the wallet and saves.
 * @param {object} data     Object contains a user_slack_id and team_id
 */
const updatePlayerWallet = async (data) => {

    let playerinfo = { slack_id: data.user_slack_id, team_id: data.team_id };
    try {
        let player = await getOnePlayer(playerinfo);

        console.log("Manager API | Wallet update !---------------");
        console.log("Was : ", player.wallet)
        player.wallet -= data.spent;
        await player.save();
        console.log("Now : ", player.wallet)

    } catch (error) {
        console.log("Manager API | Wallet update ERROR!---------------");
        console.log(error);
    }

}

const assignChip = async (player_data, amount) => {
    /*      Adds chips to user's bank (DB) by Slack user ID     */
    if (amount < 0) {
        console.log(`\nmanager.js->assignChip: attempted to deposit $` + amount`\n`);
        return null;
    }
    const updatedPlayer = await deposit(player_data, amount);
    return updatedPlayer;
}

const withdrawChip = async (user_id, amount) => {
    // removes chips from user's bank (DB) by Slack user ID
    // cannot be negative
    // cannot be more than bank's ammount
}

async function constructAllCurrLobbyData(allLobbiesInTeam, allPlayersInTeam) {
    let data = [];
    let N = allLobbiesInTeam.length;
    let M = allPlayersInTeam.length;
    for (let i = 0; i < N; i++) {
        let thisLobby = allLobbiesInTeam[i];
        let dataObj = { lobby: thisLobby, currPlayers: [] };

        for (let j = 0; j < M; j++) {
            let currPlayer = allPlayersInTeam[j];
            if (currPlayer.lastLobby == thisLobby._id) {
                // await requestForDataObj(dataObj, currPlayer);
                player_data = await axiosGet(currPlayer);
                dataObj.currPlayers.push(player_data);

            }
        }
        data.push(dataObj);
    }
    //#debug-------------------
    // console.log('\n=========== MANAGER RETURNING DATA ==============');
    // console.log(data);
    // console.log("\n");
    //--------------------------
    return data;
};

const axiosGet = async (currPlayer) => {


    const config = {
        params: {
            user: currPlayer.slack_id,
            token: process.env.BOT_TOKEN
        }
    }
    const url = "https://slack.com/api/users.info";
    const getData = async (url, config) => {
        try {
            const response = await axios.get(url, config);
            const data = response.data;
            return data
        } catch (error) {
            console.log('\n--------- bad -----------');
            console.log(error);
        }
    }
    let user_profile = await getData(url, config);


    // backup function -> //let name = user_profile.display_name_normalized === '' ? user_profile.real_name_normalized : user_profile.display_name_normalized;
    let name = currPlayer.name;
    let dp = 'https://pbs.twimg.com/profile_images/1087888631442874370/X5KNCAVj_400x400.jpg';
    if (user_profile.ok === true) {
        name = user_profile.user.profile.real_name_normalized;
        dp = user_profile.user.profile.image_24;
    }

    let player_data = { slack_id: currPlayer.slack_id, display_name: name, dp_url: dp };
    return player_data;
}

const axiosPUT = async (betData) => {

    let url = `https://imai-poker-utils.herokuapp.com/ua/${betData.userID}/action`;
    let body = await axios.put(url, betData);
    return body;
}

module.exports = {
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
    calculateWinnings,
    updatePlayerWallet,
    axiosGet,            // input only needs {name, slack_id}, returns { slack_id, display_name, dp_url }
    axiosPUT
};


