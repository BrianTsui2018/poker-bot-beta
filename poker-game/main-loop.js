
/*      Init Game      */
    //------    Check input validation (Simple)     ------//    

/*      Set Gamestate     */
    //-- Game State ---------------------------------------------
    // max_players              // max # of players,
    // buy-in,                  // this lobby's buyin
    // min-bet,                 // this lobby's min bet, also big blind $
    // phase,                   // reset the game phase to 'pre-flop'
    // top-bet-amount,          // current betting round's top-bet amount to match to ('call' / 'check')
    // top-bet-holder,          // the player who holds the current betting round's top bet. (reach this player = all bet match, end turn)
    // pot,                     // main pot
    // side-pot,                // side pot, reset
    // card-deck,               // card deck, reset
    // seats                    // a container an 'array' container, 
                                // a 'queue' to go around to make bets. 
                                // these are 'seats' that may presist to the next round. 
                                // do not reset here.
    // queue                    // actual queue of players who are waiting in line to join, will be auto seated when ready
    //-----------------------------------------------------------          



/*      Set Players     */

    // Use manager API to get players for this round

        // Some played the previous game, some joined lobby and have been waiting in queue

    // kick players whose chips left in wallet is less than min bet (use manager api)

    // Seat in the new players into empty seats

        // Use manager API to seat players-in-queue into empty 'seats'

    // Set the remaining empty 'seats' to 'null'

/*      Start Game      */

// ====================================


/*      Pre-flop      */

    // Use manager api "check-out" function to kick the idle players

        // send kicked players a DM instruction to join again

/*      Flop      */



/*      River      */



/*      Turn      */


/*      Showdown        */

// ====================================

/*      Reset       */


// ====================================
