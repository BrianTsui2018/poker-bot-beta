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

    cleanupLobbyForPlayer(thisPlayer);

    return thisPlayer;                 // Returns updated player object OR null
}

const cleanupLobbyForPlayer = async (thisPlayer) => {
    /*      Clean Lobby     */
    let thisLobbyID = thisPlayer.lastLobby;
    let remainingPlayers = await getAllPlayerInLobby(thisLobbyID);
    if (remainingPlayers.length === 0 || (remainingPlayers.length === 1 && remainingPlayers[0].slack_id === thisPlayer.slack_id)) {
        console.log("manager.js cleaning up the empty lobby.");
        deleteLobby({ _id: thisLobbyID });
    }
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

/**
 *   Read the chip amount from user's bank (DB) by Slack user ID 
 * @param {String} player_data  User slack ID
 * @returns {Number} bank balance
 */
const getPlayerBank = async (player_data) => {
    const thisPlayer = await getPlayerByID(player_data);
    const chips = thisPlayer.bank;
    return chips;
}
/**
 *   Read the updated at date from user's bank (DB) by Slack user ID
 * @param {String} player_data  User slack ID
 * @returns {Number} bank balance
 */
const getLastBonusAt = async (player_data) => {
    const thisPlayer = await getPlayerByID(player_data);
    const updatedTime = thisPlayer.timestamp.updateUpdatedAt();
    return updatedTime;
}

const patchPlayerDP = async (newPlayer) => {
    let extra_data = await axiosGet({ "slack_id": newPlayer.slack_id, "name": newPlayer.name });            // input only needs {name, slack_id}, returns { slack_id, display_name, dp_url }
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


/**
 * 
 * @param {Object} user_data    Object contains slack id and team id
 * @param {String} lobby_id     Lobby id
 * @returns {lobby|null}        returns lobby or null if something wrong.
 */
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



/**
 * [Manager.js] Get Curr Lobby Data
 * @param {Object} thisPlayer 
 * @returns Array of { {lobby object}, currentPlayers [id, id, ...]}
 */
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

/**
 * 
 * @param {Object} thisLobby 
 * @param {String} thisLobby._id    lobby ID used to locate the lobby from datapase.
 */
const getOneLobbyData = async (thisLobby) => {
    let data = [];
    /*      Get all the active players in lobby     */
    let players = await getAllPlayerInLobby(thisLobby._id);
    // #debug --------------------------------------------------------
    // console.log("\n------ manager.js ---------- players:");
    // console.log(players);


    /*      Construct data          */
    for (let j = 0; j < players.length; j++) {
        player_data = await axiosGet(players[j]);
        data.push(player_data);
    }
    return data;
}

 /*
 * Seeks for a player based on slack id and team id. Updates the timeStamp.udatedAt and saves.
 * @param {object} data     Object contains a user_slack_id and team_id
 */
const updateUpdatedAt = async (data, time) => {

    let playerinfo = { slack_id: data.user_slack_id, team_id: data.team_id };
    try {
        let player = await getOnePlayer(playerinfo);

        console.log("Manager API | timestampupdate !---------------");
        console.log("Was : ", player.timestamp.updatedAt);
        player.timestamp.updatedAt = time;
        await player.save();
        console.log("Now : ", player.timestamp.updatedAt);

    } catch (error) {
        console.log("Manager API | timestamp update ERROR!---------------");
        console.log(error);
    }

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



/**
 * 
 * @param {Object} player_data  Player data containing slack id and team id
 * @param {Number} amount       Amount of chips to be added to user bank
 */
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



/**
 *  Creates a lobby with lobbies in a particular team and players in said team.
 * @param {Object []}   allLobbiesInTeam 
 * @param {Number}      allLobbiesInTeam.length
 * @param {Object []}   allPlayersInTeam
 * @param {Number}      allPlayersInTeam.length
 */
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


/**
 * Makes a get request to utils app via axios
 * @param {Object} currPlayer           contains slack ID
 * @param {String} currPlayer.slack_id
 */
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

/**
 * Makes a PUT request to the utils app via Axios
 * @param {Object} betData          Contains userID and bet amount
 * @param {String} betData.userID
 */
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
    getLastBonusAt,
    withdrawChip,
    patchPlayerDP,
    updatePlayerWallet,
    updateUpdatedAt,
    axiosGet,            // input only needs {name, slack_id}, returns { slack_id, display_name, dp_url }
    axiosPUT
};


