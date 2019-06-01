const { nameGen } = require('../lobby/lobby-name-gen')

const genLobbyNames = (n) => {
    if (!n) {
        n = 1;
    }
    let names = nameGen();
    let nameList = [];
    for (let i = 0; i < n; i++) {
        let A = {
            "name": names[i],
            "text": names[i],
            "value": names[i],
            "type": "button"
        };
        nameList.push(A);
    }
    return nameList;
}


const askForBuyin = () => {
    let message_block = [
        {
            "name": "50000",
            "text": "$50,000",
            "value": "50000",
            "type": "button",
        },
        {
            "name": "100000",
            "text": "$100,000",
            "value": "100000",
            "type": "button",
        },
        {
            "name": "250000",
            "text": "$250,000",
            "value": "250000",
            "type": "button",
        },
        {
            "name": "500000",
            "text": "$500,000",
            "value": "500000",
            "type": "button",
        },
        {
            "name": "1000000",
            "text": "$1,000,000",
            "value": "1000000",
            "type": "button",
        },
    ]

    return message_block;
}


const showdown_mockup = () => {

    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "SHOW DOWN."
            }
        },
        {
            "type": "image",
            "title": {
                "type": "plain_text",
                "text": "All cards revealed!",
                "emoji": true
            },
            "image_url": "https://i.imgur.com/ceTQ9vF.jpg",
            "alt_text": "All cards revealed! "
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Your Best Combo:*\n Stephanie : *TWO PAIRS*"
            },
            "accessory": {
                "type": "image",
                "image_url": "https://i.imgur.com/rqxxJsZ.jpg",
                "alt_text": "computer thumbnail"
            }
        },
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Game Over!* Stephanie has lost the game to Noah, who had *ROYAL FLUSH* !"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": "Until the next game! :smile: :beer:",
                "emoji": true
            }
        }
    ];
    return message_block;
}


const update_setup_msg_data_debug = (msg) => {
    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*msg Topic:* " + msg.topic
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*Type:*\n" + msg.data.type
                },
                {
                    "type": "mrkdwn",
                    "text": "*hadId:*\n" + msg.data.handId
                },
                {
                    "type": "mrkdwn",
                    "text": "*ante:*\n" + msg.data.ante
                },
                {
                    "type": "mrkdwn",
                    "text": "*pot:*\n" + msg.data.pot
                },
                {
                    "type": "mrkdwn",
                    "text": "*sb:*\n" + msg.data.sb
                },
            ]
        },
        {
            "type": "divider"
        }
    ];
    return message_block;
}


const update_state_msg_data_debug = (msg) => {

    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*msg Topic:* " + msg.topic
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*Type:*\n" + msg.data.type
                },
                {
                    "type": "mrkdwn",
                    "text": "*Hand ID:*\n" + msg.data.handId
                },
                {
                    "type": "mrkdwn",
                    "text": "*Player ID:*\n" + msg.data.playerId
                },
                {
                    "type": "mrkdwn",
                    "text": "*Session:*\n" + msg.data.session
                },
                {
                    "type": "mrkdwn",
                    "text": "*State:*\n" + msg.data.state
                },
                {
                    "type": "mrkdwn",
                    "text": "*Bank:*\n" + msg.data.player.bank
                },
                {
                    "type": "mrkdwn",
                    "text": "*Wallet:*\n" + msg.data.player.wallet
                },
                {
                    "type": "mrkdwn",
                    "text": "*Player Name:*\n" + msg.data.player.name
                },
                {
                    "type": "mrkdwn",
                    "text": "*Team ID:*\n" + msg.data.player.team_id
                },
                {
                    "type": "mrkdwn",
                    "text": "*Lobby_id:*\n" + msg.data.player.lastLobby
                }
            ]
        },
        {
            "type": "divider"
        }
    ];
    return message_block;
}


const update_setup_msg_data_players_debug = (msg) => {
    const num_players = msg.data.players.length;
    let message_block = [];

    for (let i = 0; i < num_players; i++) {
        let P = {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": "*players.name:*\n" + msg.data.players[i].name
                },
                {
                    "type": "mrkdwn",
                    "text": "*players.id:*\n" + msg.data.players[i].id
                },
                {
                    "type": "mrkdwn",
                    "text": "*players.chips:*\n" + msg.data.players[i].chips
                },
                {
                    "type": "mrkdwn",
                    "text": "*players.chipsBet:*\n" + msg.data.players[i].chipsBet
                },
                {
                    "type": "mrkdwn",
                    "text": "*players.serviceUrl:*\n" + msg.data.players[i].serviceUrl
                },
                {
                    "type": "mrkdwn",
                    "text": "*players.cards:*\n\> rank: [" + msg.data.players[i].cards[0].rank + "], type: [" + msg.data.players[i].cards[0].type + "]\n\> rank: [" + msg.data.players[i].cards[1].rank + "], type: [" + msg.data.players[i].cards[1].type + "]"

                }
            ]
        }
        message_block.push(P);
        message_block.push({ "type": "divider" });
    }
    return message_block;
}


const update_state = (msg) => {

    /* TODO: ------------------------
    |   if msg comes in as bet = 0, 
    |   it assumes player bets 0, 
    |   should distinguish cases:
    |   - fold
    |   - call
    |   - check
    \   ----------------------------*/

    let update;
    if (msg.data.state) {
        update = `:spades: *<@${msg.data.player.slack_id}>* has decided to *${msg.data.state}* ...`;
    }
    else if (msg.data.session) {
        update = `:moneybag: *<@${msg.data.player.slack_id}> bet :heavy_dollar_sign:*${msg.data.amount}* !`;
    }
    else {
        throw new Error(" poker-message.js | data is neither STATE nor BET. Please check files.");
    }

    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `:arrow_right: Session : *${msg.data.session}* `
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": update
            }
        },
        {
            "type": "divider"
        }
    ]
    return message_block;
}

const update_setup = (msg) => {
    /*          Build Players Name List           */
    const num_players = msg.data.players.length;
    let playerNameList = '<@' + msg.data.players[0].name + '>';
    for (let i = 1; i < num_players; i++) {
        playerNameList = playerNameList.concat(', <@', msg.data.players[i].name, '>');
    }
    // #debug -----------
    // console.log('\n--------- poker-messages.js -> update_setup() ----------');
    // console.log(msg.data.players);
    // console.log(playerNameList.length, ' / ', num_players);
    // console.log('\n\n');
    //---------------------

    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "plain_text",
                "text": `:star: ${playerNameList} :star:`,
                "emoji": true
            }
        },
        {
            "type": "section",
            "fields": [
                {
                    "type": "mrkdwn",
                    "text": `*Big Blind:*\n <@${msg.data.players[msg.data.bigBlindPosition].id}>`
                },
                {
                    "type": "mrkdwn",
                    "text": `*Small Blind:*\n<@${msg.data.players[msg.data.smallBlindPosition].id}>`
                },
                {
                    "type": "mrkdwn",
                    "text": `*Pot:*\n :moneybag: ${msg.data.pot}`
                },
                {
                    "type": "mrkdwn",
                    "text": `*Ante:*\n :heavy_dollar_sign: ${msg.data.ante}`
                },
                {
                    "type": "mrkdwn",
                    "text": "_  Beginning the game shortly ..._"
                }
            ]
        }
    ]
    return message_block;
}



const update_cards = async (msg) => {
    let this_block_message;
    if (msg.data.session === "FLOP") { this_block_message = FLOP(msg.data); }
    else if (msg.data.session === "RIVER") { this_block_message = RIVER(msg.data); }
    else if (msg.data.session === "TURN") { this_block_message = TURN(msg.data); };

    console.log()


    //Run a check to see if images are set into the data message
    console.log()
    if (!this_block_message[1].image_url) {
        try {
            let results = await retryGetCommonCards(msg.data.cards)
            if (!results) throw new Error()
            this_block_message[1].text.image_url = results
            return this_block_message;
        } catch (error) {
            console.log("poker-message.js | update_cards | Cannot find cards")
            let noCard = {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": ""
                }
            };

            noCard.text.text = textBasedCards(msg.data.cards);
            this_block_message[1] = noCard;

            return this_block_message;
        }



    }

    return this_block_message;
}

const update_showdown = (msg, url) => {
    let this_block_message = SHOWDOWN(msg.data, url);

    return this_block_message;
}

const update_win = (msg) => {

    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `:medal:*Winner: <@${msg.data.winners[0].playerId}>* :medal: \n <@${msg.data.winners[0].playerId}> has won *${msg.data.winners[0].amount}* from the pot!`
            },
            "accessory": {
                "type": "image",
                "image_url": "https://i.imgur.com/BlRGh5q.png",
                "alt_text": " "
            }
        },
        {
            "type": "divider"
        }
    ]
    return message_block;
}


const start_game = (data) => {
    let message_block = [
        {
            "type": "divider"
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":black_joker: I'm starting a *Texas Poker Holdem Game!* :black_joker:\n(Click on this thread to enter game :diamonds:)"
            },
            "accessory": {
                "type": "image",
                "image_url": "https://i.imgur.com/uDmkaxZ.png",
                "alt_text": "Starting A Game!"
            }
        },
        {
            "type": "context",
            "elements": []
        }
    ]

    let player = {
        "type": "image",
        "image_url": "https://api.slack.com/img/blocks/bkb_template_images/profile_3.png",
        "alt_text": "Pam Beasely"
    }

    let count = {
        "type": "plain_text",
        "emoji": true,
        "text": `${data.players.length} Players`
    }

    for (let i = 0; i < data.players.length; i++) {

        message_block[2].elements.push(player);
    }

    message_block[2].elements.push(count);

    return message_block;

}

/*------------------------------------------------------------------------------------
|   Create Of Join? 
|       Attachment in array format.
|
|                                                                                   */
const create_or_join = [
    {
        title: 'Would you like to Create a new lobby, or Join a current game?',
        callback_id: 'create-or-join',
        attachment_type: 'default',
        actions: [
            {
                "name": "create",
                "text": "Create:diamonds:",
                "value": "create",
                "type": "button",
            },
            {
                "name": "join",
                "text": "Join:spades:",
                "value": "join",
                "type": "button",
            },
            {
                "name": "no",
                "text": "Cancel",
                "value": "no",
                "type": "button",
            }
        ]
    }
]

const newGame_or_stay = [
    {
        title: "You're already in a game. Would you like to quit it and create a new lobby?",
        callback_id: 'quitOrStay',
        attachment_type: 'default',
        actions: [
            {
                "name": "newGame",
                "text": "New Game",
                "value": "new",
                "type": "button",
            },
            {
                "name": "stay",
                "text": "Stay in current",
                "value": "stay",
                "type": "button",
            }
        ]
    }
]

const pingPlayer = (data) => {
    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*ping!* :robot_face:"
            }
        }

    ]
    return message_block;
}

const current_lobbies_info = async (data) => {
    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "*Which lobby would you like to join?* Here are a list of current games."
            }
        },
        {
            "type": "divider"
        }
    ];

    for (let i = 0; i < data.length; i++) {
        let lobbyName = data[i].lobby.name;
        let currP = data[i].currPlayers.length;
        let maxP = data[i].lobby.maxPlayers;
        let buyin = data[i].lobby.buyin;
        let minBet = data[i].lobby.minBet;

        let value = {
            "topic": "JOIN_LOBBY",
            "lobby_id": data[i].lobby._id
        }
        message_block.push({
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*${lobbyName}* [${currP}/${maxP}]\nBuy-in = $${buyin} | Min-bet = $${minBet}`
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Join:spades:"
                },
                "value": JSON.stringify(value)
            }
        });
        let player_elements = [];
        let players = data[i].currPlayers;

        for (let j = 0; j < currP; j++) {
            player_elements.push(
                {
                    "type": "image",
                    "image_url": players[j].dp_url,
                    "alt_text": players[j].display_name
                }
            );
        }

        player_elements.push({
            "type": "plain_text",
            "emoji": true,
            "text": " in game"
        });
        message_block.push(
            {
                "type": "context",
                "elements": player_elements
            }, {
                "type": "divider"
            }
        );

    }

    let create_value = {
        "topic": "CREATE_LOBBY",
    }

    message_block.push(
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*New Lobby*\nMake a new one for other players to join.`
            },
            "accessory": {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "emoji": true,
                    "text": "Create:diamonds:"
                },
                "value": JSON.stringify(create_value)
            }
        }
    )
    let cancel_value = {
        "topic": "REFERESH_ALL",
    }
    message_block.push(
        {
            "type": "divider"
        },
        {
            "type": "actions",
            "elements": [
                {
                    "type": "button",
                    "text": {
                        "type": "plain_text",
                        "emoji": true,
                        "text": "Refresh All"
                    },
                    "value": JSON.stringify(cancel_value)
                }
            ]
        }
    );
    return message_block;

}

const one_lobby_info = async (data) => {
    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `Would anyone here like to play a game of Poker with <@${data.currPlayers[0].slack_id}>? :clubs:`
            }
        },
        {
            "type": "divider"
        }
    ];

    let lobby_id = data.lobby._id;
    let lobbyName = data.lobby.name;
    let currP = data.currPlayers.length;
    let maxP = data.lobby.maxPlayers;
    let buyin = data.lobby.buyin;
    let minBet = data.lobby.minBet;

    let value = {
        "topic": "JOIN_LOBBY_DIRECT",
        "lobby_id": lobby_id
    }
    message_block.push({
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": `*${lobbyName}* [${currP}/${maxP}]\nBuy-in = $${buyin} | Min-bet = $${minBet}`
        },
        "accessory": {
            "type": "button",
            "text": {
                "type": "plain_text",
                "emoji": true,
                "text": "Join:spades:"
            },
            "value": JSON.stringify(value)
        }
    });

    let player_elements = [];
    let players = data.currPlayers;
    for (let j = 0; j < currP; j++) {
        player_elements.push(
            {
                "type": "image",
                "image_url": players[j].dp_url,
                "alt_text": players[j].display_name
            }
        );
    }

    player_elements.push({
        "type": "plain_text",
        "emoji": true,
        "text": " in game"
    });
    message_block.push(
        {
            "type": "context",
            "elements": player_elements
        }, {
            "type": "divider"
        }
    );
    return message_block;
}

const { retryGetPairCards, textBasedCards } = require('../utils/cards');
/**
 * 
 * @param {Object} data         Game data
 * @param {String} data.type    setup / state / session...etc
 * @param {Object} data.card 
 */
const makeBetDisplay = async (data) => {
    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": "-*Your Cards in the Hole*-\n"
            }
        },
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `*Wallet*: :heavy_dollar_sign: ${data.wallet} \n:arrow_forward: Current Call Amount : ${data.amount_in_short}`
            }
        },
    ];

    let betInfo = {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "Bet:"
        }
    }

    let hasCard = {
        "type": "image",
        "image_url": data.P.cards,     //data.cards_url
        "alt_text": "Your cards"
    }

    let noCard = {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": ""
        }
    }

    //Check state and image : if setup and no image >> fire request.
    if (data.type === "setup" && !data.P.cards) {
        try {
            let results = await retryGetPairCards(data);
            if (!results) throw new Error(error);
            hasCard.image_url = results;
            data.P.cards = results;
            message_block.push(hasCard);
        } catch (error) {
            //back up measures
            console.log("in poker msg .js ")
            console.log("data");
            noCard.text.text = textBasedCards(data.cards_array)
            message_block.push(noCard);
        }
    }
    else if (!data.P.cards) {
        //If no image : construct cards and already beyond set up stage.
        noCard.text.text = textBasedCards(data.cards_array);
        message_block.push(noCard);
    }
    else {
        //else construct url block
        message_block.push(hasCard);
    }

    message_block.push(betInfo);
    //return the block
    return message_block;
}


/*------------------------------------------------------------------------------------
|   Fold, Check/Call, Raise, All-In?
|       Attachment in array format.
|
|                                                                                   */
const makeBet = async (data) => {

    /*
        data.lobby_id
        data.cards
        data.cards_url
        data.wallet
        data.call_amount
        data.min_bet
        data.chips_already_bet
        data.cards_array <<-- card objects  *Needs update from upstream
        data.type <<-- phrase
    */
    if (!data.wallet) { data.wallet = 100001; }
    if (!data.call_amount) { data.call_amount = 10; }

    /*      Display information     */
    console.log("before makebet display : ");
    console.log(data);
    let message_block = await makeBetDisplay(data);

    /*      Call/check and Fold     */
    let bet_elemenets = [];

    // /*      Player has enough to call / check      */
    if (data.amount_in_short < data.wallet) {
        data.val = data.amount_in_short;
        bet_elemenets.push(button_check_call(data));
    } else {
        data.val = data.wallet;
        bet_elemenets.push(button_all_in(data));
    }

    /*      Player can only fold if there's a amount in short        */
    if (data.amount_in_short > 0) {
        bet_elemenets.push(button_fold(data));
    }

    /*      Push into message block         */
    message_block.push(
        {
            "type": "actions",
            "elements": bet_elemenets
        }
    );


    /*      Up to 8 raise buttons   */
    let raise_elements = [];
    let base_raise_amount = 0;

    // console.log("\n--- makeBet() > input");
    // console.log("data.amount_in_short = ", data.amount_in_short);
    // console.log("data.min_bet = ", data.min_bet);

    if (data.amount_in_short === 0) { base_raise_amount = data.min_bet; } // case that no one has raised yet
    else { base_raise_amount = (data.amount_in_short) * 2; }  // case that there's already a raise, or Pre-Flop call/check for non-BB/SB players

    for (let i = 1; i <= 8; i++) {
        data.val = base_raise_amount * i;
        if (data.val < data.wallet) { raise_elements.push(button_raise(data)); }
    }

    // console.log("base_raise_amount = ", base_raise_amount);
    // console.log("--------------------------\n")

    /*          Raise: All in          */
    data.val = data.wallet;
    raise_elements.push(button_all_in(data));

    /*      Player raise        */
    if (data.amount_in_short < data.wallet) {
        message_block.push(
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": "Raise:"
                }
            },
            {
                "type": "actions",
                "elements": raise_elements
            }
        );
    }
    return message_block;
}

const button_all_in = (data) => {
    return {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": "All-in!",
            "emoji": true
        },
        "value": JSON.stringify({ "topic": "BET", "choice": "all-in", "val": data.val, "lobby_id": data.lobby_id }) // all in
    };
}

const button_raise = (data) => {
    return {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": `+\$${data.val.toString(10)} `,
            "emoji": true
        },
        "value": JSON.stringify({ "topic": "BET", "choice": "raise", "val": data.val, "lobby_id": data.lobby_id })
    };
}

const button_check_call = (data) => {
    let text_str = "Check ($0)";
    if (data.amount_in_short > 0) { text_str = `Call \$ ${data.amount_in_short.toString(10)} `; }
    return {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": text_str,
            "emoji": true
        },
        "style": "primary",
        "value": JSON.stringify({ "topic": "BET", "choice": "call", "val": data.val, "lobby_id": data.lobby_id }) //data.call_amount
    };
}

const button_fold = (data) => {
    return {
        "type": "button",
        "text": {
            "type": "plain_text",
            "text": "Fold",
            "emoji": true
        },
        "style": "danger",
        "value": JSON.stringify({ "topic": "BET", "choice": "fold", "val": 0, "lobby_id": data.lobby_id })
    };
}

const base_template = [
    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "" //Insert section here
        }
    },
    {
        "type": "image",
        "title": {
            "type": "plain_text",
            "text": "card", //Insert Text here.
            "emoji": true
        },
        "image_url": "", //Insert image URL here
        "alt_text": "" //Alt msg here
    },
    {
        "type": "divider"
    },
    {
        "type": "section",
        "text": {
            "type": "plain_text",
            "text": "Collecting user bets soon....", //Longer text here.
            "emoji": true
        }
    }
]

const card_name_translator = (cards) => {

    translatedCards = []
    for (let idx = 0; idx < cards.length; idx++) {
        let thisCard = "";
        switch (cards[idx].rank) {
            case 'K': thisCard = "King of ";
                break;
            case 'Q': thisCard = "Queen of ";
                break;
            case 'J': thisCard = "Jack of ";
                break;
            case 'A': thisCard = "Ace of ";
                break;
            default: thisCard = parseInt(cards[idx].rank) + " of ";
        }

        switch (cards[idx].type) {
            case 'D': thisCard += 'Diamonds';
                break;
            case 'C': thisCard += "Clubs";
                break;
            case 'S': thisCard += "Spades";
                break;
            case 'H': thisCard += "Hearts";
                break;
            default: throw new Error("Unexpect card type came in ... ");
        }

        translatedCards.push(thisCard);
        thisCard = "";

    }
    return translatedCards.join(', ');

}

const FLOP = (data) => {
    let flop_block = [...base_template];
    flop_block[0].text.text = ":diamonds: Session : *FLOP*";
    flop_block[1].title.text = "Cards : ";
    flop_block[3].text.text = `First three cards: ${card_name_translator(data.cards)} ...what now ? `;
    flop_block[1].image_url = data.cardImages[0].url.length > 0 ? data.cardImages[0].url : null;
    flop_block[1].alt_text = "Three cards shown!";

    return flop_block;
}

const RIVER = (data) => {
    let river_block = [...base_template];
    river_block[0].text.text = ":clubs: Session : *RIVER*";
    river_block[1].title.text = "Cards : ";
    river_block[3].text.text = `New card: ${card_name_translator(data.cards)} ...what now ? `;
    river_block[1].image_url = data.cardImages[0].url.length > 0 ? data.cardImages[0].url : null;
    river_block[1].alt_text = "Four cards shown!";

    return river_block;
}

const TURN = (data) => {
    let turn_block = [...base_template];
    turn_block[0].text.text = ":HEART: Session : *TURN*";
    turn_block[1].title.text = "Cards : ";
    turn_block[3].text.text = `New card: ${card_name_translator(data.cards)} ...what now ? `;
    turn_block[1].image_url = data.cardImages[0].url.length > 0 ? data.cardImages[0].url : null;
    turn_block[1].alt_text = "Five cards shown!";

    return turn_block;
}

const get_show_down_template = (url) => {
    return [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":loudspeaker: *SHOW DOWN* :bangbang: \n Cards are ranked from highest to lowest!"
            }
        },
        {
            "type": "image",
            "title": {
                "type": "plain_text",
                "text": "Example Image",
                "emoji": true
            },
            "image_url": url,
            "alt_text": "Example Image"
        },
        {
            "type": "divider"
        }
    ];
}


const get_show_down_user = (playerId, bestCardsInfo) => {
    return {
        "type": "section",
        "text":
        {
            "type": "mrkdwn",
            "text": `*<@${playerId}>*\n: black_small_square: Best Cards: * ${bestCardsInfo.name}* !` //replace with :black_medium_square:*[User 1]* \n :black_small_square:Best Cards : [bestCards] \n :black_small_square:Info : [bestCardsInfo Obj]
        },
        "accessory":
        {
            "type": "image",
            "image_url": `${bestCardsInfo.url}`, //Fill with image url
            "alt_text": "Card pairs"
        }
    };
}


const SHOWDOWN = (data, url) => {
    let showdown_array = get_show_down_template(url);
    console.log("!!!!!!!!!!!!pkmsgjs | SHOWDOWN!!!!!!!!!!!!")
    console.log(showdown_array);
    console.log(JSON.stringify(showdown_array))
    /*      Loop through each "showdown" player        */
    for (let idx = 0; idx < data.ranks.length; idx++) {
        let show_down_user = get_show_down_user(data.ranks[idx].playerId, data.ranks[idx].bestCardsInfo)
        console.log(show_down_user)
        showdown_array.push(show_down_user);
        // showdown_array[showdown_array.length - 1].text.text = `*<@${ data.ranks[idx].playerId }>*\n: black_small_square: Best Cards: ${ data.ranks[idx].bestCardsInfo.name } .`;
        // showdown_array[showdown_array.length - 1].accessory.image_url = data.ranks[idx].bestCardsInfo.url;
    }
    showdown_array.push({ "type": "divider" })

    return showdown_array;
}

module.exports = {
    askForBuyin,
    genLobbyNames,
    showdown_mockup,
    update_state_msg_data_debug,
    update_setup_msg_data_debug,
    update_setup_msg_data_players_debug,
    update_state,
    update_setup,
    update_win,
    update_cards,
    start_game,
    create_or_join,
    newGame_or_stay,
    current_lobbies_info,
    one_lobby_info,
    pingPlayer,
    makeBet,
    update_showdown

}

