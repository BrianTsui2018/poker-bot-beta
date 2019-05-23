const async = require('async');

let data = [];
const getCurrLobbyData = async (thisPlayer) => {
    /*      Get this user's team_id     */
    let team_id = thisPlayer.team_id;
    /*      Get all players with the same team_id in a Set      */
    let allPlayersInTeam = await getAllCurrentPlayersInTeam({ team_id: team_id });
    let lobby_Id_data = [];
    let P_set = new Set();
    for (let i = 0; i < allPlayersInTeam.length; i++) {
        P_set.add(allPlayersInTeam[i].lastLobby);
    }
    let it = P_set.values();
    P_set.forEach(function () {
        let L_id = it.next().value;
        console.log(L_id);
        lobby_Id_data.push(L_id);
    });

    /*      Get all lobbies from the set    */
    let allLobbiesInTeam = await getAllLobbiesInTeam(lobby_Id_data);

    /*      Construct data          */
    let data = [];


    async.series([
        // Task #1
        function (callback) {
            db.query(-- , function (err, users) {
                if (err) return callback(err);
                //Check that a user was found

                callback();                     // #1 is done
            });
        },
        // Task #2
        function (callback) {
            async.parallel([
                // Task #2A
                function (callback) {
                    db.query('posts', { userId: userId }, function (err, posts) {
                        if (err) return callback(err);
                        locals.posts = posts;
                        callback();             // #2A is done
                    });
                },
                // Task #2B
                function (callback) {
                    db.query('photos', { userId: userId }, function (err, photos) {
                        if (err) return callback(err);

                        locals.photos = [];

                        // Task #2B-N
                        async.forEach(photos, function (photo, callback) {

                            callback();         // one of #2B-N done

                        }, callback);           // #2B is done (async.ForEach done)
                    });
                }
            ], callback);                       // #2 is done (2A and 2B done) (async.parallel)
        }
    ], function (err) {                         // Final Callback (async.series done)
        if (err) return next(err);

        res.render('user-profile', locals);
    });
}