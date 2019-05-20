const Tournament = require("poker-holdem-engine");

const mongoUri = "mongodb://localhost:8000/store"

// TODO : REMOVE BEFORE PRODUCTION
const chalk = require('chalk');
const error = chalk.bold.red;
const warning = chalk.keyword('orange');

// DUMMY DATA REMOVE IF NOT NEEDED
const dummyData = require('./player/dummy-players.json');

const t = new Tournament(dummyData.tournamentID, dummyData.playerList, dummyData.tournamentSettings);

//One additional listener to track acknowledgement from parent
const events = require('events');
const em = new events.EventEmitter();


//Each time when PHE/Tournament.js has an update, this will catch it.
t.on("TOURNAMENT:updated", (data, done) => {
    console.log(chalk.bgCyan('Tournament | Updated!'));

    /*          Patch extra data here          */
    // console.log(chalk.bgCyan('Tournament | Patching data here...'));
    // console.log('\nWhat data has now: --------------');
    // console.log(data);
    // console.log('\n\n');
    // console.log('\nWhat gamestate has now: --------------');
    // console.log(t.gamestate);
    // console.log('\n\n');
    data.bigBlindPosition = t.gamestate.bigBlindPosition;
    data.smallBlindPosition = data.bigBlindPosition - 1 >= 0 ? data.bigBlindPosition - 1 : data.players.length - 1;
    data.dealerPosition = data.smallBlindPosition - 1 >= 0 ? data.smallBlindPosition - 1 : data.players.length - 1;

    //Sends data to parent.
    process.send({ topic: "updates", data }, () => {

        //Runs when confirmation is recv'ed
        em.once("recieved update", (msg) => {
            console.log(warning("Tournament | Got the message!"));

            //Done() kicks the tournament to the next step.
            done();
        })
    });

});

//Main communication processes with parent here.
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
            process.send({ topic: "exit" });
            console.log(warning("-----------------------------------------"))
            break;
        case "reply":
            console.log(error("tournament | Msg = reply. Attemping to leave loop......."));
            em.emit("recieved update");
            console.log(warning("------------------------------------------"))
            break;
        default:
            console.log(error(`Uncaught msg topic found : ${msg.topic}`));
    }
})


