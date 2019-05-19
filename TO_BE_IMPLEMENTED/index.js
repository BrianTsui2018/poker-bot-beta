const chalk = require('chalk');


const childProcess = require("child_process");

const startT = () => {
    //Immediately fork a child process to start to run tournament
    const thread = childProcess.fork("tournament2.js");

    //Each time child process passes a msg back, this thread listener catches it.
    thread.on("message", (msg) => {
        if (msg.topic === "exit") {
            thread.kill();
        }
        else if (msg.topic == "updates") {
            console.log(chalk.bgMagenta('------------Tournament UPDATES------------'));
            console.log(msg.data);
            console.log(chalk.bgMagenta('------------------------------------------'));


            //Replace with actions for this state!
            setTimeout(() => {
                console.log(chalk.bold("Attemting to end wait"));
                thread.send({ topic: "reply" });
            }, 5000);
            //----------------end replacement.

        }
        else {
            console.log(chalk.red("DEBUG: Uncaught message from child! ", msg.topic));
        }
    })

    //Start the game
    thread.send({ topic: "start-game" });
}

startT();
