const axios = require("axios");


const wakeup = () => {
    let url = `https://imai-poker-utils.herokuapp.com/wakeup`;
    try {
        axios.get(url);

    } catch (error) {
        console.log("Error logged, could not get img..");
        console.log(error);
    }
}

module.exports = {
    wakeup
}