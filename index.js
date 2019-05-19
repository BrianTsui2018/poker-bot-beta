//----------------------------------------
/*              Import                  */
const Botkit = require('botkit');
const {
    handleSlash
} = require('./slash-commands')
const joinPokerEventListener = require('./bot-skills/poker-commands.js');

//----------------------------------------
/*      Authentication checkpoint       */
if (!process.env.CLIENT_ID || !process.env.CLIENT_SECRET || !process.env.VERIFICATION_TOKEN || !process.env.PORT) {                   // online deployment doesn't need to check for PORT env var
    console.log('Error: Specify CLIENT_ID, CLIENT_SECRET, VERIFICATION_TOKEN in environment');
    process.exit(1);
} else {
    console.log('Good job, you have the variables!')
}
//----------------------------------------
/*          MongoDB storage             */
const mongodbStorage = require('./phe-storage-mongoose/index.js')({
    mongoUri: process.env.MONGODB,
});
//----------------------------------------
/*      Controller, the Slackbot        */
const controller = Botkit.slackbot({
    storage: mongodbStorage,
    debug: false,
    clientSigningSecret: process.env.CLIENT_SIGNING_SECRET,
});
//----------------------------------------
/*        Configure Controller          */
controller.configureSlackApp({
    clientId: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    scopes: ['commands', 'bot', 'incoming-webhook'],
});

//----------------------------------------
/*          Bot Server setup               */
controller.setupWebserver(process.env.PORT, function (err, webserver) {
    controller.createWebhookEndpoints(controller.webserver);
    controller.createOauthEndpoints(controller.webserver,
        function (err, req, res) {
            if (err) {
                res.status(500).send('ERROR: ' + err);
            } else {
                res.send('Success!');
            }
        });
});

//----------------------------------------
/*      Spawns "bot" from Controller    */
const bot_RTM = controller.spawn({
    token: process.env.BOT_TOKEN,
    incoming_webhook: {
        url: process.env.SLACK_WEBHOOK
    }
})


/* #Brian's notes -------

    * "incoming webhook" is a url to post JSON from app to Slack. 
    "Outgoing webhook" is obsolete (legacy).
    
    * Use bot.sendWebhook(message, callback())
    Pass sendWebhook an object that contains at least a text field. 
    This object may also contain other fields defined by Slack which can alter the appearance of your message.

------------------------*/


//---- Test zone ---------------------------------------------------------------------//


controller.hears('hi', 'direct_message', (bot, message) => {
    bot.reply(message, 'Hello.');
});

controller.hears('I am hungry', 'direct_message', (bot, message) => {
    bot.reply(message, 'Haha no food for you!');
})
//------------------------------------------------------------------------------------//

//----------------------------------------
/*   Bot listens to keyword in Slack    */
joinPokerEventListener(controller);


//----------------------------------------
/*        Slash Command handling        */
controller.on('slash_command', async (bot, message) => {
    bot.replyAcknowledge();
    //TO DO: Put json objects to separate file for tidiness
    handleSlash(bot, message);
})

//----------------------------------------