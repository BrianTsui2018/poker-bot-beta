
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

    let update;
    if (msg.data.state) {
        update = `:spades: *${msg.data.player.name}* has decided to *${msg.data.state}* ...`;
    }
    else if (msg.data.session) {
        update = `:moneybag: *${msg.data.player.name} has decided to bet :heavy_dollar_sign:*${msg.data.amount}* !`;
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
    let playerNameList = msg.data.players[0].name;
    for (let i = 1; i < num_players; i++) {
        playerNameList = playerNameList.concat(', ', msg.data.players[i].name);
    }
    // #debug -----------
    console.log('\n--------- poker-messages.js -> update_setup() ----------');
    console.log(msg.data.players);
    console.log(playerNameList, ' / ', num_players);
    console.log('\n\n');
    //---------------------

    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": ":spades: :hearts: *Starting Poker Holdem Engine!*:clubs::diamonds: "
            }
        },
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
                    "text": `*Big Blind:*\n${msg.data.players[msg.data.bigBlindPosition].name}`
                },
                {
                    "type": "mrkdwn",
                    "text": `*Small Blind:*\n${msg.data.players[msg.data.smallBlindPosition].name}`
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



const update_cards = (msg) => {

}



const update_win = (msg) => {

    let message_block = [
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": `:medal:*Winner: ${msg.data.winners[0].playerName}* :medal: \n ${msg.data.winners[0].playerName} has won *${msg.data.winners[0].amount}* from the pot!`
            },
            "accessory": {
                "type": "image",
                "image_url": "https://i.imgur.com/BlRGh5q.png",
                "alt_text": " "
            }
        },

        // {
        //     "type": "actions",
        //     "elements": [
        //         {
        //             "type": "button",
        //             "text": {
        //                 "type": "plain_text",
        //                 "emoji": true,
        //                 "text": "Rematch"
        //             },
        //             "style": "primary",
        //             "value": "click_me_123"
        //         },
        //         {
        //             "type": "button",
        //             "text": {
        //                 "type": "plain_text",
        //                 "emoji": true,
        //                 "text": "Leave"
        //             },
        //             "style": "danger",
        //             "value": "click_me_123"
        //         }
        //     ]
        // },
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
                "text": ":black_joker: I'm starting a *Texas Poker Holdem Game!* :black_joker:"
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

module.exports = {
    showdown_mockup,
    update_state_msg_data_debug,
    update_setup_msg_data_debug,
    update_setup_msg_data_players_debug,
    update_state,
    update_setup,
    update_win,
    update_cards,
    start_game

}