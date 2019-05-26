const Tournament = require("poker-holdem-engine");
const childProcess = require("child_process");
const mongoUri = "mongodb://localhost:8000/store"

// TODO : REMOVE BEFORE PRODUCTION
const chalk = require('chalk');
const error = chalk.bold.red;
const warning = chalk.keyword('orange');

// Boolean to track if cards are processed or not:
let cards_not_done = true;

// DUMMY DATA REMOVE IF NOT NEEDED
const dummyData = require('./player/dummy-players.json');


//One additional listener to track acknowledgement from parent
const events = require('events');
const pidgeon = new events.EventEmitter();
const pidgeon_index = new events.EventEmitter();
const pidgeon_image = new events.EventEmitter();

let imageURLs = null;

pidgeon_index.on("recieved acknowledgement", () => {
    console.log("PIDGEON: Index acknlowedged! Proceeding to done.")
    pidgeon.emit("Proceed Tournament");
});

//Sends data to parent.
pidgeon_index.on("Data ready", (data) => {
    process.send({ topic: "updates", data }, () => {
        //Runs when confirmation is recv'ed
        console.log("Process sent updates to index.js");
    });
})

pidgeon_image.on("recieved images", (imgData) => {
    console.log("PIDGEON IMAGE: I have new images!");
    imageURLs = imgData;
})

pidgeon.on("Check for image data", (data) => {
    setTimeout(() => {
        if (imageURLs) {
            data.cardImages = imageURLs;
            imageURLs = null;
        }

        pidgeon_index.emit("Data ready", data);
    }, 5000)

})


let t = new Tournament(dummyData.tournamentID, dummyData.playerList, dummyData.tournamentSettings);


//Each time when PHE/Tournament.js has an update, this will catch it.
t.on("TOURNAMENT:updated", (data, done) => {
    // console.log(chalk.bgCyan('Tournament | Updated!'));

    // /*          Patch extra data here          */
    // console.log(chalk.bgCyan('Tournament | Patching data here...'));
    // // console.log('\nWhat data has now: --------------');
    // // console.log(data);
    // // console.log('\n\n');

    // if (data.type === 'setup') {
    //     data.bigBlindPosition = t.gamestate.bigBlindPosition;
    //     data.smallBlindPosition = data.bigBlindPosition - 1 >= 0 ? data.bigBlindPosition - 1 : data.players.length - 1;
    //     data.dealerPosition = data.smallBlindPosition - 1 >= 0 ? data.smallBlindPosition - 1 : data.players.length - 1;
    // }
    // console.log('\nWhat gamestate has now: --------------');
    // console.log(t.gamestate);
    // console.log('\n\n');
    // //Sends data to parent.
    // process.send({ topic: "updates", data }, () => {

    //     //Runs when confirmation is recv'ed
    //     em.once("recieved update", (msg) => {
    //         console.log(warning("Tournament | Got the message!"));

    //         //Done() kicks the tournament to the next step.
    //         done();
    //     })
    // });
    console.log(chalk.bgCyan('Tournament | Updated!'));

    /*          Patch extra data here          */
    // if (data.type === 'setup') {
    //     data.bigBlindPosition = t.gamestate.bigBlindPosition;
    //     data.smallBlindPosition = data.bigBlindPosition - 1 >= 0 ? data.bigBlindPosition - 1 : data.players.length - 1;
    //     data.dealerPosition = data.smallBlindPosition - 1 >= 0 ? data.smallBlindPosition - 1 : data.players.length - 1;
    // }

    dataRouter(data);

    pidgeon.emit("Check for image data", data);

    pidgeon.once("Proceed Tournament", (msg) => {
        console.log(warning("Tournament | Got the message!"));
        //Done() kicks the tournament to the next step.
        done();
    })
});

const dataRouter = (data) => {
    if (data.type === 'setup') {
        //Beginning of the set up
        // 1) Make child thread to make card-pairs
        console.log(chalk.bold("Sending card pairs to child to handle------------"))
        console.log(data.players[0]);
        imageThread.send({ topic: "card-pairs", data: data.players });
        data.bigBlindPosition = t.gamestate.bigBlindPosition;
        data.smallBlindPosition = data.bigBlindPosition - 1 >= 0 ? data.bigBlindPosition - 1 : data.players.length - 1;
        data.dealerPosition = data.smallBlindPosition - 1 >= 0 ? data.smallBlindPosition - 1 : data.players.length - 1;

    }
    else if (data.type === 'cards') {
        //let commonCards = t.gamestate.deck.slice(0, 5);
        //First time sending out common cards. We're going to make all sets in one go.
        imageThread.send({ topic: "common-cards", data: data.cards })
        //Never coming back into this loop even if we get a card update again.
    }
}

//Forks a child to handle image generation
const imageThread = childProcess.fork("./card-gen/card-generator.js");
imageThread.on("message", (msg) => {
    switch (msg.topic) {
        case "images":
            console.log(chalk.green("Image Thread : Got images back"));
            console.log(chalk.bgCyan('--------------IMAGES------------'))
            console.log(msg.data);
            console.log(chalk.bgCyan('--------------xxxxxx------------'))
            //////////// PIDGEON
            pidgeon_image.emit("recieved images", msg.data);
            //////////// PIDGEON
            break;
        default:
            console.log(chalk.green("Image Thread : Uncaught message - ", msg.topic))
    }
});


//Main communication processes with parent (index.js) here.
process.on("message", async (msg) => {
    switch (msg.topic) {
        case "start-game":
            console.log(chalk.green("tournament | Msg = start-game | Starting !"));
            await t.start();
            break;
        case "pause-game":
            console.log(warning("tournament | Msg = pause-game | Attempting to pause...."))
            t.pause();
            console.log(t.state)
            console.log(warning('----------------------------------------'))
            break;
        case "restart-game":
            console.log(warning("tournament | Msg = restart-game | Attempting to restart"));
            t.restart();
            console.log(t.state);
            console.log(warning('-----------------------------------------'))
            break;
        case "quit-game":
            console.log(warning("tournament | Msg = restart-game | Attempting to quit"));
            t.quit();
            //process.send({ topic: "exit" });
            console.log(warning("-----------------------------------------"))
            break;
        case "acknowledgement":
            console.log(error("tournament | Msg = acknowledgement. Attemping to leave loop......."));
            //////////// PIDGEON
            pidgeon_index.emit("recieved acknowledgement");
            //////////// PIDGEON
            console.log(warning("------------------------------------------"))
            break;
        default:
            console.log(error(`Uncaught msg topic found : ${msg.topic}`));
    }
})

