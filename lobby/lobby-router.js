/*
	Lobby / Lobby-Router

	Description:
	- This is a collection of lower level lobby-DB communication

	- "Lobby" model reference:
		- Attributes:
			> name : string | Lobby name
			> maxPlayers : int | Max num of players
			> buyin : int | $ Buy-in when enter the lobby
			> minBet : int | minimum bet amount = big blind = (Buy-in / 25) 
		- refer to lobby/lobby-model.js

	Exports:
		- getlobbies
		- getOneLobby
		- createLobby
		- updateLobby
		- deleteLobby
		- deleteLobbyAll
*/


const lobby = require('./lobby-model');

/*----------------------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] Get All Lobbies
|
|	Description:
|	- Uses Mongoose function <my_model>.find() 
|	- to retrieve all lobbies from database
|
|	 																				*/
const getlobbies = async () => {
	try {
		const lobby_list = await lobby.find({});
		return lobby_list;
	} catch (e) {
		// error statement
		return e;
	}
}
//----------------------------------------------------------------------------------


/*----------------------------------------------------------------------------------
|	!! THIS IS ONLY A TEST PURPOSE METHOD !! 
|	* Unstable results *
|	[Lobby / Lobby-Router.js] Get Lobby ID by Name
|
|	Description:
|	- Uses Mongoose function <my_model>.findOne() 
|	
|
|	 																				*/
const getLobbyIdByName = async (lobbyName) => {
	try {
		const lobs = await lobby.findOne({ name: lobbyName });
		// #debug
		// console.log('/n--------------- lobby-router.js -> getLobbyIdByName()-----------\n');
		// console.log(lobs);
		return lobs._id;
	} catch (e) {
		// error statement
		return e;
	}
}
//----------------------------------------------------------------------------------



/*------------------------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] Get One Lobby
|
|	Description:
|	- Uses Mongoose function <my_model>.findByID(id) 
|	- to retrieve a lobby from DB
|
|	 																				*/
const getOneLobby = async (lobby_id) => {
	try {
		const thisLobby = await lobby.findOne({ _id: lobby_id });
		return thisLobby;
	} catch (e) {
		return e;
	}
}
//------------------------------------------------------------------------------------



/*------------------------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] Create a Lobby
|
|	Description:
|	- Creates a lobby instance 
|	- and saves to DB
|
|	 																				*/
const createLobby = async (data) => {
	try {
		// ...............................
		// todo : 						..
		// find lobby by name			..
		// if exist						..
		// return a complaint			..
		// ...............................

		// ...........................................
		// todo : 									..
		// check if user is already in a lobby		..
		// if yes									..
		// return a complaint						..	
		// ...........................................

		const newlobby = new lobby(data);		// Constructs a lobby locally with the passed in { data }
		await newlobby.save(); 					// This pushes the locally created lobby up to the DB

		// #debug ----------------------
		// console.log(`\nNew lobby [ ${newlobby.lobbyName} ]  is saved to database, ID = [${newlobby.id}]\n`);
		//------------------------------

		return newlobby;

	} catch (e) {
		//Something bad happened
		console.log(e);
		return e;
	}
}
//----------------------------------------------------------------------------------

/*------------------------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] Edit(Update) a Lobby
|
|	Description:
|	- Uses Mongoose function findOneAndUpdate 
|	- to update the lobby data with the matching lobby name provided
|	- returns the updated lobby model
|
|	 																				*/
const updateLobby = async (this_lobby) => {
	try {
		const updated_lobby = await lobby.findOneAndUpdate(this_lobby._id, this_lobby);			// Potential problem with atomicity.
		return updated_lobby;
	} catch (e) {
		console.log(e);
		return e;
	}
}
//----------------------------------------------------------------------------------


/*----------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] deleteLobby
|
|	Description:
|	- Uses Mongoose function findByIdAndDelete 
|	- to delete the lobby data with lobby ID provided
|	- returns the deleted lobby model
|
|	 																	*/
const deleteLobby = async (this_lobby) => {
	try {
		const deleted_lobby = await lobby.findByIdAndDelete(this_lobby._id, () => {
			console.log("\nlobby-router.js : lobby deleted, id = " + this_lobby._id + " and name =" + this_lobby.name);
		});
		return deleted_lobby;
	} catch (e) {
		// error statements
		console.log(e);
		return e;
	}
}
//----------------------------------------------------------------------

/*----------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] deleteLobbyAll
|
|	Description:
|	- Uses Mongoose function deleteMany
|	- to delete all lobbies in DB
|	- returns an array of deleted lobbies
|
|	 																	*/
const deleteLobbyAll = async () => {
	try {
		const deletedLobbies = await lobby.deleteMany({});
		return deletedLobbies;
	} catch (e) {
		// error statements
		console.log(e);
		return e;
	}
}
//----------------------------------------------------------------------


/*----------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] getAllLobbiesInTeam
|
|	Description:
|
|	 																	*/
const getAllLobbiesInTeam = async (data) => {
	try {
		let allLobbiesInTeam = lobby.find({ team_id: data.team_id });
		return allLobbiesInTeam;
	} catch (e) {
		// error statements
		console.log(e);
		return e;
	}
}
//----------------------------------------------------------------------
/*----------------------------------------------------------------------
|	[Lobby / Lobby-Router.js] getAllActiveLobbiesInTeam
|
|	Description:
|
|	 																	*/
const getAllActiveLobbiesInTeam = async (lobbyIdList) => {
	try {
		let allLobbiesInTeam = [];
		for (let i = 0; i < lobbyIdList.length; i++) {
			let thisLobby = await getOneLobby(lobbyIdList[i]);
			if (thisLobby) {
				allLobbiesInTeam.push(thisLobby);
			}
			else {
				console.log("\n-- Warning: lobby/lobby-router.js -> getAllLobbiesInTeam() -> getOneLobby() : attempted to get a lobby by ID but no such lobby exist on database. Proceed returning lobby list.\n");
			}
		}
		return allLobbiesInTeam;
	} catch (e) {
		// error statements
		console.log(e);
		return e;
	}
}

module.exports = {
	getlobbies,
	getOneLobby,
	createLobby,
	updateLobby,
	deleteLobby,
	deleteLobbyAll,
	getLobbyIdByName,
	getAllLobbiesInTeam,
	getAllActiveLobbiesInTeam
};