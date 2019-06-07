const axios = require("axios");


const wakeup = () => {
    let url = `https://imai-poker-utils.herokuapp.com/ua/wakeup`;
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