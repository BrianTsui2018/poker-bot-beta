const {
    getlobbies,
    getOneLobby,
    createLobby,
    deleteLobbyAll
} = require('../lobby/lobby-router');

const {
    checkIn,
    checkOut,
    createPlayer,
    withdraw,
    deposit,
    getOnePlayer,
    getAllPlayerInLobby
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

const getAllLobby = async (data) => {
    // append all players to each lobby
    // returns all lobby objects
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
    getAllLobby,
    lobbyRemovePlayer,
    getPlayerByID,
    getPlayerBank,
    assignChip,
    withdrawChip
};