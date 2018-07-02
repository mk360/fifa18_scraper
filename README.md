# FIFA 18 Scraper

## Intro

This Node.js script rips every single player available at the time it runs. It takes all the needed informations from [FutHead.com](https://www.futhead.com) (kudos for the guys out there for not blocking my IP when doing my endless requests). Taking full profit of ES6 gadgets and toys (arrow functions, three dots operator, generator functions, a pinch of destructuring and _so many_ async/await Promises), it has evolved from a buggy and ugly web scraper into a dream data collector any FIFA fan could dream of.

## Required Dependencies

* [cheerio-req](https://www.npmjs.com/package/cheerio-req) : for the requests. And the mini-jQuery.

 _Fair Warning: One dependency `htmlparser2` needs further editing in order for the scraper to work properly._

 _The module in its "working" version can be found in my fork of the project, until it makes its way to the official build._ 

* [js-beautify](https://www.npmjs.com/package/cheerio-req) _(deprecated, install and use at your own risk)_ : to make the final product object _look like_ an object, not like an obfuscated pile of characters. No significant change required in this one.

## Included player details

Each different player is just an entry in the huge generated `players` object, and each of these entries contains the following details:
* Basic info :
  * Their name ;
  * What league they play in ;
  * What club they play in ;
  * The nation they play for, mapped by a numerical ID ;
  * Images of the player, his nation, and his club: they're not base64-encoded, I just took the `data-src` property of these images ;
  * The foot they use best (their "strong foot") ;
  * How good are they when using their "wrong foot" (the opposite of their strong foot, basically) ;
  * How good are they when they want to use skill moves.
  * The position the player plays in.
* In-game info :
  * The overall rating of the player ;
  * The edition the player was published for (Team of the Year, Team of the Week, St. Patrick...) ;
  * The main stats of the player. It is itself an object containing numerical values related to his ability in different domains ;
  * The work rates of the player (how willing to attack / defend the player is) ;
  * The _card quality_ of the player (whether he's a gold, silver or bronze player).

## Output

The result of years of waiting for the scraper to be done will appear as a "players.js" file. But if there's a fact you should be wary about, it is that it will produce it at the directory where you run the script, so be careful.

A beautified sample of what the data would look like can be found [here](https://github.com/mk360/fifa18_scraper/blob/master/Sample.js).
