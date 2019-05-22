const {
    getlobbies,
    getOneLobby,
    createLobby,
    deleteLobbyAll,
    getAllLobbiesInTeam
} = require('../lobby/lobby-router');

const {
    checkIn,
    checkOut,
    createPlayer,
    withdraw,
    deposit,
    getOnePlayer,
    getAllPlayerInLobby,
    getAllCurrentPlayersInTeam
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

const registerPlayer = async (user_data) => {
    await createPlayer(user_data);
    const newPlayer = await getPlayerByID(user_data);
    return newPlayer;
}

const registerLobby = async (lobby_data) => {
    const newLobby = await createLobby(lobby_data);
    return newLobby;
}

const getLobbyPlayers = async (lobby_id) => {
    const playerList = await getAllPlayerInLobby(lobby_id);
    // #debug -----------------------------
    console.log("\n--------- manager.js/getLobbyPlayers -> return from getAllPlayerInLobby -----------------\n");
    console.log(playerList);
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
        // return {
        //     success: false,
        //     player: thisPlayer,
        //     lobby: undefined,
        //     text: `<@${thisPlayer.slack_id}> is already in lobby.`
        // };
        return null;
    }
    // check if lobby exist    
    if (!thisLobby) {
        valid = false;
    }
    // check if player bank >= buyin
    if (thisPlayer.bank < thisLobby.buyin) {
        valid = false;
    }

    // check if lobby curr player < max players
    let currPlayers = await getLobbyPlayers(thisLobby._id);
    if (currPlayers.num_players >= thisLobby.maxPlayers) {
        valid = false;
    }
    // check-in player to lobby
    if (valid) {
        const updatedPlayer = await checkIn({ slack_id: thisPlayer.slack_id, team_id: thisPlayer.team_id, lobby_id: thisLobby._id, buyin: thisLobby.buyin });
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
    let lobby_Id_data = [];
    let P_set = new Set();
    for (let i = 0; i < allPlayersInTeam.length; i++) {
        P_set.add(allPlayersInTeam[i].lastLobby);
    }
    let it = P_set.values();
    P_set.forEach(function () {
        let L_id = it.next().value;
        console.log(L_id);
        lobby_Id_data.push(L_id);
    });

    // #debug -------------
    // console.log('\nThis is the set of Lobbies :');
    // console.log(lobby_Id_data);
    //--------------------

    /*      Get all lobbies from the set    */
    let allLobbiesInTeam = await getAllLobbiesInTeam(lobby_Id_data);
    // #debug -------------
    // console.log('\nGet all lobbies from this set :');
    // console.log(allLobbiesInTeam);
    //--------------------

    /*      Construct data          */
    let data = [];
    // let dataObj = {
    //     lobby: [],
    //     currPlayers: []
    // };
    for (let j = 0; j < allLobbiesInTeam.length; j++) {

        let thisLobby = allLobbiesInTeam[j];
        let dataObj = { lobby: thisLobby, currPlayers: [] };
        for (let k = 0; k < allPlayersInTeam.length; k++) {
            let currPlayer = allPlayersInTeam[k];

            if (currPlayer.lastLobby == thisLobby._id) {
                dataObj.currPlayers.push(currPlayer._id);
                // #debug ----------------
                //console.log('...push ' + currPlayer.name + ' to ' + dataObj.lobby.name + '...');
                // -----------------------
            }
        }
        data.push(dataObj);
    }

    // returns all lobby objects
    // #debug -------------
    // console.log('\nall lobby objects :');
    // console.log(data);
    //--------------------

    /*--------------------------------------------------
    |
    |   Example output ---------------------------------
    |
    |   [ { lobby:
    |       { maxPlayers: 6,
    |       buyin: 50000,
    |       minBet: 2000,
    |       _id: 5ce435c9c95ff25924482ff6,
    |       name: 'Test_Lobby_777',
    |       __v: 0 },
    |   currPlayers:
    |       [ 5ce435c9c95ff25924482ff7,
    |       5ce435c9c95ff25924482ff9,
    |       5ce435c9c95ff25924482ff8 ] },
    |   { lobby:
    |       { maxPlayers: 6,
    |       buyin: 250000,
    |       minBet: 2000,
    |       _id: 5ce3ea7ff8b90d1ed4d4ea28,
    |       name: 'The Helix',
    |       __v: 0 },
    |   currPlayers: [ 5ce4e1e31c9d440000b86ff5 ] } ]
    |
    \--------------------------------------------------*/
    return data;

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


module.exports = {
    registerPlayer,
    registerLobby,
    playerJoinLobby,
    lobbyIsFull,
    getLobbyByID,
    getLobbyPlayers,
    getCurrLobbyData,
    lobbyRemovePlayer,
    getPlayerByID,
    getPlayerBank,
    assignChip,
    withdrawChip
};