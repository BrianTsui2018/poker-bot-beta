/*
	Lobby / Lobby-Model
	
	Description:
	- Defines a "lobby" schema
	- returns the model
	- Attributes:
		> name : string | Lobby name
		> maxPlayers : int | Max num of players
		> buy-in : int | $ Buy-in when enter the lobby
		> minBet : int | minimum bet amount = big blind = (Buy-in / 25) 

*/

const mongoose = require('mongoose');


//----- Adjust this if necessary ------
const MONEY_SCALE = 50000;
//-------------------------------------

const lobbySchema = new mongoose.Schema(
	{
		name: {
			type: String,
			trim: true 			// todo: make unique
		},
		maxPlayers: {
			type: Number,
			default: 6  		// Means that we don't have to input in the request.
		},
		buyin: {
			type: Number,
			default: MONEY_SCALE
		},
		minBet: {
			type: Number,
			default: (MONEY_SCALE / 25) 	// minimum bet, the big-blind amount, scales with the buy-in
		},
		team_id: {
			type: String,
			trim: true
		},
		channel: {
			type: String,
			trim: true,
			default: "general"
		},
		is_playing: {
			type: Boolean,
			default: false
		}
	});


const lobby = mongoose.model('lobby', lobbySchema);
module.exports = lobby;
