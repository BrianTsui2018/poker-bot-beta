const Tournament = require("./poker-holdem-engine/tournament");

const tournamentID = 'tester';
const mongoUri = "mongodb://localhost:8000/store"

const chalk = require('chalk');

const error = chalk.bold.red;
const warning = chalk.keyword('orange');

const preflop = chalk.black.bgWhite;

const players = [
    {
        id: "000001",
        name: "Stephanie",
        serviceUrl: "https://e20c063e.ngrok.io"
    },
    {
        id: "000002",
        name: "Noah",
        serviceUrl: "https://e20c063e.ngrok.io"
    },
    {
        id: "000003",
        name: "Brian",
        serviceUrl: "https://e20c063e.ngrok.io"
    },
    {
        id: "000004",
        name: "Angry Poker Dude",
        serviceUrl: "https://e20c063e.ngrok.io"
    },
];


const tournamentSettings = {
    "BUYIN": 100,
    "WARMUP": false,
    "WARMUP_GAME": 10,
    "WARMUP_TIME": 10,
    "HAND_THROTTLE_TIME": 1,
    "SMALL_BLINDS": [50, 100, 200, 250],
    "SMALL_BLINDS_PERIOD": 1,
    "PAY_ANTE_AT_HAND": 1,
    "MAX_GAMES": 1,
    "POINTS": [
        [10, 2, 0, 0]
    ]
};

let t;
process.on("message", (msg) => {
    console.log(chalk.cyan('Tournament.js | Checking msg topic: ', msg.topic))
    switch (msg.topic) {
        case "create":
            console.log("Got 'create'! ,, creating...")
            t = new Tournament(tournamentID, players, tournamentSettings, { autoStart: true });
            t.on("TOURNAMENT:updated", (data, done) => {
                console.log(chalk.bgCyan('Tournament | Updated!'));
                t.pause();

                process.send({ topic: "updates", data });

            });
            break;
        case "go-preflop":
            console.log(chalk.cyan(" Tournament.js | PRE-FLOP |case restart |  Restarting!  "));
            t.restart();
            break;
        case "go-flop": {
            console.log(chalk.cyan("Tournament.js | FLOP | Restarting "));
            t.restart();
            break;
        }
        case "debug pause":
            t.pause();
            console.log(chalk.bgMagenta("PAUSED"));
            break;
        default:
            console.log(`Index.js | [${msg.topic}] ----- ${msg.message}...`)
    }
})



