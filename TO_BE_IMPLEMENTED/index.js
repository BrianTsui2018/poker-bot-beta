const chalk = require('chalk');

const error = chalk.bold.red;
const warning = chalk.keyword('orange');

const preflop = chalk.black.bgWhite;

const childProcess = require("child_process");

let preflop_done = false;
let num_players = 3;
let players_contacted = 0;

const startT = () => {
    const thread = childProcess.fork("tournament.js");

    console.log(chalk.blue.bgWhite("Thread created!"));
    thread.on("message", (msg) => {
        if (msg.topic === "exit") {
            thread.kill();
        }
        else if (msg.topic == "updates") {
            console.log(preflop('Index.js | out of set up.| '));

            //msg.data.ante = 25;
            //t.pause();
            console.log('->', msg.data);
            console.log(chalk.bgMagenta('------------------------------------------'));

            if (!preflop_done) {
                thread.send({ topic: "go-preflop" });
                setup_done = true;
            }

            else if (players_contacted < num_players) {

                players_contacted++;
                console.log(warning("Index.js | msg players ... Currently : " + (players_contacted) + "/3"))
                if (players_contacted < num_players - 1) {
                    thread.send({ topic: "go-preflop" });
                }
                else {
                    //enter FLOP.
                    thread.send({ topic: "go-flop" });
                }
            }
            else {
                console.log(warning("Index.js | pausing..."));
                thread.send({ topic: "debug pause" });
            }

            console.log("Here");

        }
        else {
            setup = msg.topic;
            //console.log(setup);
            thread.send({ topic: "debug pause" });

        }
    })

    thread.send({ topic: "create" });

}

startT();
