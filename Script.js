const req = require("cheerio-req")
const fs = require("fs")

let players = {}

function* setQualityRipper(quality, number = 1) {
	let max = {
		gold: 103,
		silver: 205,
		bronze: 123
	}[quality]

	while (max >= number) {
		yield "https://www.futhead.com/18/players/?level=" + quality +
		"&bin_platform=ps&page=" + number;
		number++
	}
}

let gold = setQualityRipper("gold")
let silver = setQualityRipper("silver")
let bronze = setQualityRipper("bronze")

async function ripPage(htmlLink, cb) {
	(async function fetchPage(link, cb) {
		await req(link, cb)
	})(htmlLink, cb)
}

async function collectPage(link) {
	return new Promise((resolve, reject) => {
		ripPage(link, (err, $) => {
			harvestPlayerData($)
			resolve("whatever thing this is supposed to mean")
		})
	}).catch(err => {
		console.log(err)
		console.log("We're sorry, but an error happened and we couldn't keep working.")
		console.log("Don't worry, we got your back covered.")
		writePlayersToFile(true)
	})
}

function harvestPlayerData($) {
	let compoundData = createPlayerData($)
	let builtObject = buildObject(compoundData)
	addEntry(players, builtObject)
}

function sortPlayersByOverall(player1, player2) {
	return player2.ig_data.overall - player1.ig_data.overall
}

function createPlayerData($) {
	let baseData = createBasePlayerData($)
	let ig_data = createIGData($)
	return synthetize(baseData, ig_data)
}

function addEntry(targetObject, playerData) {
	for (i in playerData) {
		if (!(i in targetObject)) {
			targetObject[i] = []
		}
		targetObject[i] = targetObject[i].concat(playerData[i])
		if (targetObject[i].length > 1) {
			targetObject[i] = targetObject[i].sort(sortPlayersByOverall)
		}
	}
}

async function fetchAllPages(generator) {
	let link = generator.next().value
	let i = 1 
	while (link) {
		await collectPage(link)
		console.log("Ripping page " + i + ": success")
		link = generator.next().value
		i++
	}
	console.log("Done.")
}

function createBasePlayerData($) {
	let names = map($(".player-name"), spanFunction)
	let positions = map($(".player-club-league-name strong"), spanFunction)
	let leaguesAndClubs = map($(".player-club-league-name strong"), player => futheadTrim(player.next.data))
	let playerImages = map($(".player-info .player-image"), image => image.attribs["data-src"])
	let clubImages = map($(".player-info .player-club"), image => image.attribs["data-src"])
	let nationImages = map($(".player-info .player-nation"), image => image.attribs["data-src"])
	let strongFoot = map($(".player-stat.stream-col-100 .value"), spanFunction)
	let separatedStars = chunk(map($(".player-stat.stream-col-90 .value"), spanFunction), 2)
	let skillMoves = getStars(separatedStars, 1)
	let weakFoot = getStars(separatedStars, 0)
	return assembleBaseData([names, positions, leaguesAndClubs, [playerImages, clubImages, nationImages], [strongFoot, skillMoves, weakFoot]], names.length)
}


function createIGData($) {
	let overallSpans = $(".player-rating .revision-gradient")
	let editions = map(overallSpans, overall => overall.attribs.class.split(" ").pop().toUpperCase())
	let workrates = map($(".player-stat.stream-col-160 .value"), spanFunction)
	let overalls = map(overallSpans, spanFunction)
	let attributes = map($(".player-info"), span => {
			return {
				pace: getPlayerAttributes(span, 1),
				shooting: getPlayerAttributes(span, 2),
				passing: getPlayerAttributes(span, 3),
				dribbling: getPlayerAttributes(span, 4),
				defense: getPlayerAttributes(span, 5),
				physical: getPlayerAttributes(span, 6)
			}
		}
	)
	return assembleInGameData([editions, overalls, attributes, workrates], overalls.length)
}

function assembleBaseData(elements, length) {
	let assemblerArray = []
	for (i = 0; i < length; i++) {
		let [club, league] = elements[2][i].split("|")
		assemblerArray.push({
			name: elements[0][i],
			position: elements[1][i],
			nation: +elements[3][2][i].split("/").pop().replace(".png", ""),
			club,
			league,
			images: {
				nation: elements[3][2][i],
				club: elements[3][1][i],
				player: elements[3][0][i]
			},
			strongFoot: elements[4][0][i],
			skillMoves: +elements[4][1][i],
			weakFoot: +elements[4][2][i]
		})
	}
	return assemblerArray
}

function assembleInGameData(elements, length) {
	let assemblerArray = []
	if (elements[0][i] === "TRANSFER") elements[0][i] = "NIF"
	for (i = 0; i < length; i++) {
		let [offensiveWork, defensiveWork] = elements[3][i].split(" / ")
		offensiveWork = offensiveWork[0]
		defensiveWork = defensiveWork[0]
		let obj = {
			overall: +elements[1][i],
			edition: elements[0][i],
			stats: elements[2][i],
			workRates: {
				offense: offensiveWork,
				defense: defensiveWork
			},
			quality: elements[1][i] >= 75 ? "gold" : elements[1][i] >= 65 ? "silver" : "bronze"
		}
		if (obj.edition !== "NIF" && !obj.edition.includes("WORLDCUP") && !obj.edition.includes("ICON")) {
			obj.isSpecial = true
		}
		if (obj.edition.includes("WORLDCUP")) {
			obj.isWorldCup = true
		}
		assemblerArray.push(obj)
	}
	return assemblerArray
}

(async function f(fct) {
	console.log("Starting scraper. Ripping gold players.")
	await fct(gold)
	console.log("All gold players fetched. Moving to the silver quality.")
	await fct(silver)
	console.log("All silver players fetched. Moving to the bronze quality.")
	await fct(bronze)
	console.log("All bronze players fetched. Mission successful.")
	writePlayersToFile()
})(fetchAllPages)

function futheadTrim(str) {
	return str.trim().replace(/[\n\s]{2,}/g, "").replace("|", "")
}

function map(...fct) {
	return Array.prototype.map.call(...fct)
}

function getPlayerAttributes(span, index) {
	return getAttributeValue(span, index)
}

function getAttributeValue(span, index) {
	return +span.next.next.children[index].children[0].children[0].data
}

function spanFunction(span) {
	return span.children[0].data
}

function chunk(array, size) {
	let newArray = []
	while (array.length >= size) {
		let tinyArray = []
		for (i = 0; i < size; i++) {
			tinyArray.push(array.shift())
		}
		newArray.push(tinyArray)
	}
	if (array.length) newArray.push(array)
	return newArray
}

function getStars(array, index) {
	let arr = []
	for (i = 0; i < array.length; i++) {
		arr.push(array[i][index])
	}
	return arr
}

function synthetize(baseData, ig_data) {
	let arr = []
	for (i = 0; i < baseData.length; i++) {
		arr.push({ baseData: baseData[i], ig_data: ig_data[i] })
	}
	return arr
}

function buildObject(objectToBe) {
	let collectedPlayers = {}
	for (i = 0; i < objectToBe.length; i++) {
		let playerCopy = objectToBe[i]
		if (!(playerCopy.baseData.name in collectedPlayers)) {
			collectedPlayers[playerCopy.baseData.name] = []
		}
		collectedPlayers[playerCopy.baseData.name].push(playerCopy)
	}
	return collectedPlayers
}

function writePlayersToFile(onerr) {
	let stringified = JSON.stringify(players)
	console.log("The data you've scraped is currently being written into a file.")
	fs.writeFile("players.js", "const players = " + stringified, function() {
		console.log("Your \"players.js\" file is now ready.")
		if (onerr) {
			console.log("And sorry for what happend. :X")
		} else {
			console.log("If you liked the output, please star my repo on GitHub!")
		}
	})
}
