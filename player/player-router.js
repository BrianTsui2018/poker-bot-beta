/*
	Player / Player-Router

	Description:
	- This is a collection of lower level player-DB communication

	- "Player" model reference:
        - Attributes:
            > slack_id: string | Player's slack ID
            > name : string | Player slack name
            > team_id : string | This account's workspace id
            > team_domain : string | This account's workspace domain
            > bank : int | Amount of Chips in bank
            > lastLobby : string | Last Played Lobby
            > wallet : int | Amount of Chips in wallet (withdrawn)
        > isInLobby : Boolean | Whether player is current in a lobby ( on record )		- refer to player/player-model.js

    Exports:
        - createPlayer
		- checkIn
		- checkOut
		- withdraw
        - deposit
        - getPlayer
*/

const player = require('./player-model');


/*----------------------------------------------------------------------------------
|	[Player / Player-Router.js] Create Player
|
|	Description:
|	- Creates a player instance 
|	- and saves to DB
|
|	 																				*/
const createPlayer = async (data) => {
    try {
        const newPlayer = new player(data);		    // Constructs a player locally with the passed in data {user_id and user_name}
        data.res = await newPlayer.save(); 					// This pushes the locally created player up to the DB
        return data;
    } catch (e) {
        // error statement
        console.log(e);
        return e;
    }
}
//----------------------------------------------------------------------------------


/*----------------------------------------------------------------------------------
|	[Player / Player-Router.js] Check-in Player
|
|	Description:
|	- Player has joined a lobby 
|	- Arguments: {user_id, lobby_id, buyin}
|   - Update: bank, wallet, lastLobby, isInLobby
|   - Does not check if lobby exist
| 
|	 																				*/
const checkIn = async (data) => {
    try {
        // #debug -----------------------------
        // console.log('\n----------- player/player-router.js -> checkIn() ---------------');
        // console.log('----- data -----\n');
        // console.log(data);
        // ------------------------------------

        let thisPlayer = await player.findOne({ slack_id: data.slack_id, team_id: data.team_id });

        // #debug -----------------------------
        // console.log('\n----- thisPlayer -----\n');
        // console.log(thisPlayer);
        // ------------------------------------

        /*      Catch No User error             */
        if (!thisPlayer) {
            console.log('\nError at player/player-router.js -> checkIn()! Should not reach here, manager did not check if player exist in dB.\n');
            return null;
        }

        /*      Player can join the lobby       */
        if (thisPlayer.bank >= data.buyin && thisPlayer.isInLobby === false) {

            /*       Update Player data         */
            thisPlayer.bank -= data.buyin;
            thisPlayer.wallet = data.buyin;
            thisPlayer.lastLobby = data.lobby_id;
            thisPlayer.isInLobby = true;
            //------------------------------------

            /*        Push Player updates        */
            const updatedPlayer = await player.findOneAndUpdate({ slack_id: thisPlayer.slack_id, team_id: thisPlayer.team_id }, thisPlayer, { new: true });
            // #debug -----------------
            // console.log("\n------------- player-routers.js -> checkIn() ---------------");
            // console.log(updatedPlayer);
            //-------------------------
            return updatedPlayer;
        }
        else {      /*      Player cannot join the lobby        */
            console.log('\nError at player/player-router.js -> checkIn()! Should not reach here, manager did not check for bank balance, player overdraft, or Player already in lobby, double-joined.\n');
            return null;
        }
    } catch (e) {
        // error statement
        console.log(e);
        return e;
    }
}
//----------------------------------------------------------------------------------

/*----------------------------------------------------------------------------------
|	[Player / Player-Router.js] Check-out Player
|
|	Description:
|	- Player has joined a lobby 
|	- Arguments: {user_id, lobby_name, buyin}
|   - Update: bank, wallet, lastLobby, isInLobby
|   - Does not check if lobby exist (no error, but may oversee bugs)
|	 																				*/
const checkOut = async (data) => {
    try {
        let thisPlayer = await player.findOne({ slack_id: data.slack_id, team_id: data.team_id });
        /*      Catch No User error             */
        if (!thisPlayer) {
            console.log('\nError at player/player-router.js -> checkOut()! Should not reach here, manager did not check if player exist in dB.\n');
            return null;
        }

        /*      Player can leave lobby         */
        if (thisPlayer.isInLobby) {

            /*       Update Player data         */
            thisPlayer.bank += thisPlayer.wallet;
            thisPlayer.wallet = 0;
            thisPlayer.isInLobby = false;
            //------------------------------------

            /*        Push Player updates        */
            let updatedPlayer = await player.findOneAndUpdate({ slack_id: thisPlayer.slack_id, team_id: thisPlayer.team_id }, thisPlayer, { new: true });
            updatedPlayer.isInLobby = false;
            return updatedPlayer;
        }
        else {      /*      Player cannot join the lobby        */
            console.log('\nError at player/player-router.js -> checkOut()! Should not reach here, manager did not check if player exist\n');
            return null;
        }
    } catch (e) {
        // error statement
        console.log(e);
        return e;
    }
}
//----------------------------------------------------------------------------------

/*--------------------------------------------------------------------
|	[Player / Player-Router.js] Get Player
|
|	Description:
|	- Returns one player if exist
|																	*/
const getOnePlayer = async (data) => {
    try {
        let thisPlayer;
        if (data.team_id) {
            thisPlayer = await player.findOne({ slack_id: data.slack_id, team_id: data.team_id });
        }
        else {
            thisPlayer = await player.findOne({ slack_id: data.slack_id, isInLobby: true });
        }
        return thisPlayer;
    } catch (e) {
        console.log(e);
        return null;
    }
}
//--------------------------------------------------------------------

/*--------------------------------------------------------------------
|	[Player / Player-Router.js] Withdraw
|
|	Description:
|	- Special usage, withdraw chips directly
|																	*/
const withdraw = async (data, chips) => {

}
//--------------------------------------------------------------------

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



/*--------------------------------------------------------------------
|	[Player / Player-Router.js] Get Player
|
|	Description:
|	- Returns an array of players
|																	*/
const getAllPlayerInLobby = async (lobby_id) => {
    try {
        const playerList = await player.find({ lastLobby: lobby_id, isInLobby: true });
        // #debug ---------------------------------
        // console.log('--- player-router.js -> getAllPlayerInLobby() --- ');
        // console.log(playerList);
        //------------------------------------------
        return playerList;
    } catch (error) {
        console.log(error);
    }

}
//--------------------------------------------------------------------

/*--------------------------------------------------------------------
|	[Player / Player-Router.js] Delete All Players in DB
|
|	Description:
|	- Returns an array of players
|																	*/
const deletePlayerAll = async () => {
    try {
        const deletedPlayers = await player.deleteMany({});
        return deletedPlayers;
    } catch (e) {
        // error statements
        console.log(e);
        return e;
    }
}
//--------------------------------------------------------------------

/*--------------------------------------------------------------------
|	[Player / Player-Router.js] Get All Currently playing Players in team
|
|	Description:
|	- Returns an array of players
|																	*/
const getAllCurrentPlayersInTeam = async (data) => {
    try {
        const playerList = await player.find({ team_id: data.team_id, isInLobby: true });
        return playerList;

    } catch (error) {
        // error statements
        console.log(error);
        return error;
    }

}

const updatePlayer = async (thisPlayer) => {
    try {
        const updatedPlayer = await player.findOneAndUpdate({ slack_id: thisPlayer.slack_id, team_id: thisPlayer.team_id }, thisPlayer, { new: true });
        return updatedPlayer;

    } catch (error) {
        console.log(error);
        return error;
    }
}


module.exports = {
    createPlayer,
    checkIn,
    checkOut,
    withdraw,
    deposit,
    getOnePlayer,
    getAllPlayerInLobby,
    deletePlayerAll,
    getAllCurrentPlayersInTeam,
    updatePlayer

};