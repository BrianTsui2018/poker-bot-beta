
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


const update_setup_msg_data = (msg) => {

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


const update_state_msg_data = (msg) => {

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


const update_setup_msg_data_players = (msg) => {
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


module.exports = {
    showdown_mockup,
    update_state_msg_data,
    update_setup_msg_data,
    update_setup_msg_data_players
}