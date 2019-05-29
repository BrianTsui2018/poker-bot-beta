const handleBlockActions = async (bot, message) => { //TODO change parameters for deployment
    console.log('\n\n---------------- poker-api.js -> "handleBlockActions()" ----------------\n');
    console.log(`ia_message_callback_block_id= ${message.actions[0].block_id}`);
    console.log(`ia_message_callback_name= ${JSON.stringify(message.raw_message.user.name)}`);

/************************************** add this section to index.js around line 355 **************************************/
    //handle takeTurn buttons
    if(message.actions[0].block_id === 'turnbuttons'){
        switch(message.actions[0].value){
            case 'fold':
                bot.reply(message, `${message.raw_message.user.name} folds`);
                break;
            case 'call':
                bot.reply(message, `${message.raw_message.user.name} calls/checks`);
                break;
            case 'raise':
                //TODO add function to get raise amount
                bot.reply(message, `${message.raw_message.user.name} raises`);
                break;
            case 'all-in':
                bot.reply(message, `${message.raw_message.user.name} is all-in!!!`);
                break;
/******************************************************************************************************************/
        }
    }
}

//Handling taking turns
const takeTurn = async (player, message) => { //TODO integrate into gameflow
    console.log('\n\n---------------- poker-api.js -> "takeTurn()" ----------------\n');
    try {
        await bot.reply(message, `It's ${player.name}'s turn.`);
    } catch (e) {
        console.log(e);
    }
//ephemeral messages must include playerid and channel
//send cards
    var mes = {"user": message.user_id, "channel": message.channel, "blocks": message_blocks.makeBet};
    try {
        await bot.sendEphemeral(mes);
    } catch (e) {
        console.log(e);
    }
//sending ephemeral buttons
    mes.blocks = message_blocks.takeTurnButtons;
    try {
        await bot.sendEphemeral(mes);

    } catch (e) {
        console.log(e);
    }
}

const playershand_mockup = [

    {
        "type": "section",
        "text": {
            "type": "mrkdwn",
            "text": "**Your Cards in the Hole**\n"
        }
    },
    {
        "type": "image",
        "image_url": "https://i.imgur.com/rqxxJsZ.jpg",
        "alt_text": "computer thumbnail"
    },

];

/*------------------------------------------------------------------------------------
|   Fold, Check/Call, Raise, All-In?
|       Attachment in array format.
|
|                                                                                   */
const takeTurnButtons = [
    {
        "type": "actions",
        "elements": [
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Fold",
                    "emoji": true
                },
                "value": "fold"
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Call/Check",
                    "emoji": true
                },
                "value": "call"
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "Raise",
                    "emoji": true
                },
                "value": "raise"
            },
            {
                "type": "button",
                "text": {
                    "type": "plain_text",
                    "text": "All-in!",
                    "emoji": true
                },
                "value": "all-in"
            }
        ]
    }
]
module.exports = {
    playershand_mockup,
    takeTurnButtons
}
