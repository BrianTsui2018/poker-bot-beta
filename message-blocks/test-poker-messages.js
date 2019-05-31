const {
    showdown_mockup,
    update_state_msg_data_debug,
    update_setup_msg_data_debug,
    update_setup_msg_data_players_debug,
    update_state,
    update_setup,
    update_win,
    update_cards,
    update_showdown,
    makeBet
} = require('./poker-messages');


const data_sample = {
    P:
    {
        _id: `5ceebbdae3592d615ca82e68`,
        bank: 887400,
        wallet: 100000,
        isInLobby: true,
        dp:
            'https://pbs.twimg.com/profile_images/1087888631442874370/X5KNCAVj_400x400.jpg',
        cards: 'https://i.imgur.com/bdNp7Oh.png',
        slack_id: 'UJG3K1G91',
        name: 'tsuio',
        team_id: 'TJG471LAW',
        __v: 0,
        lastLobby: '5cf0fbcc832a4f4e0ca591d0',
        idx: 0
    },
    lobby_id: '5cf0fbcc832a4f4e0ca591d0',
    amount_in_short: undefined,
    wallet: 99800,
    call_amount: 2200,
    chips_already_bet: 200,
    min_bet: 2000
}


const test_makeBet = (betting_data) => {

    let message_block = makeBet(betting_data);

    console.log("\n---------- results ------------");
    console.log(message_block);

    console.log("\n---------- Bet ------------");
    let Arr = message_block[3].elements;
    for (let j = 0; j < Arr.length; j++) {
        console.log("\n\t--- [", j, "]");
        console.log(JSON.parse(Arr[j].value));
    }

    console.log("\n---------- Raise ------------");
    Arr = message_block[5].elements;
    for (let j = 0; j < Arr.length; j++) {
        console.log("\n\t--- [", j, "]");
        console.log(JSON.parse(Arr[j].value));
    }

}

test_makeBet(data_sample);