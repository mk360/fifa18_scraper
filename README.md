# FIFA 18 Scraper

## Intro

This program rips the full FIFA 18 Ultimate Team players database as registered in-game. Using jQuery's `ajax` method as repeatedly as necessary, it takes the content from the [Futhead](https://www.futhead.com) website and turns it into a (huge) file containing 99% of all you need to know about every single player in the game. Each player might come several times, as each time is a separate "edition" of the player, as EA might publish different editions of him i.e. when he performs very well during a certain game.

Remark: You might still find mistakes and inaccuracies (such as `null` values where they shouldn't be, for instance), but they concern players nobody knows about, and as such their profile wasn't complete enough to be included in the game's database.

## Included player details

Each different player is just an entry in the huge generated `players` object, and each of these entries contains the following details:
* Basic info :
  * Their name ;
  * What league they play in ;
  * What club they play in ;
  * The URL to their Futhead info page ;
  * The foot they use best (their "strong foot") ;
  * How good are they when using their "wrong foot" (the opposite of their strong foot, basically) ;
  * How good are they when they want to be fancy and use skill moves.
* In-game info :
  * The overall rating of the player ;
  * The edition the player was published for (Team of the Year, Team of the Week, St. Patrick...) ;
  * The main stats of the player. It is itself an object containing numerical values related to his ability in different domains ;
  * The work rates of the player (how willing to attack / defend the player is) ;
  * The position the player plays in.

A sample of what the data would look like can be found [here](https://github.com/mk360/fifa18_scraper/sample.js).
