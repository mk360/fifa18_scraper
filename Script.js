var currentQuality = "gold";

var players = {};

var selector = "li.list-group-item.list-group-table-row.player-group-item.dark-hover";

var pre = document.getElementById("log");

var pageNumber = 1;

var maxPage = {
	gold: 67,
	silver: 173,
	bronze: 117
};

pre.log = function(message, status) {
	let font = document.createElement("font");
	switch (status) {
		case "success": font.color = "green";
		break;
		case "failure": font.color = "red";
		break;
		default : "";
	}
	font.innerHTML = message;
	font.family = "Monlo";
	this.appendChild(font);
	this.appendChild(document.createElement("br"));
};

pre.log("Starting scraper...");

var scrapeNewPage;

(scrapeNewPage = function(pageNumber) {
	if (maxPage[currentQuality] >= pageNumber) {
		$.ajax(defaultAjaxRequest("http://www.futhead.com/18/players/?bin_platform=ps&page=" + pageNumber, function(data) {
			let queryContent = data.contents.remove(data.contents.substring(0, data.contents.indexOf("</head>")));
			delete document.body.style; // So we don't overuse CPU resources by rendering useless styles, especially when you're ripping 300+ pages
			document.getElementById("injected").innerHTML = queryContent;
		})).then(() => {
			let players = document.querySelectorAll(selector);
			createPlayerData(players);
		}).catch((err) => {
			console.error("Unable to scrape, aborting.");
			return;
		});
	} else return;
})(pageNumber);

function createPlayerData(data) {
	data.forEach(function(member) {
		let baseInfos = member.childNodes[1].childNodes[1];
		let additionalInfos = baseInfos.childNodes[7].childNodes[1].childNodes;
		let workRatesArr = additionalInfos[3].childNodes[0].textContent.split(" / ");
		let workRates = {};
		let strongFoot = getDeepContent(additionalInfos[5]);
		let weakFoot = Number(getDeepContent(additionalInfos[7]));
		let skillMoves = Number(getDeepContent(additionalInfos[9]));
		workRates.offense = workRatesArr[0];
		workRates.defense = workRatesArr[1];
		let futheadLink = futheadify(baseInfos.href);
		let ovr = Number(baseInfos.childNodes[1].childNodes[1].innerText); // A long chain, but browsers consider blank text as a child Node so it pushes the needed node to 2nd place
		let name = baseInfos.childNodes[3].childNodes[7].innerText;
		let position = baseInfos.childNodes[3].childNodes[9].childNodes[1].innerText; // Even longer chains XD
		let playing = futheadTrim(baseInfos.childNodes[3].childNodes[9].childNodes[2].data);
		let club = playing.split(" | ")[0];
		let league = playing.split(" | ")[1];
		let classList = baseInfos.childNodes[1].childNodes[1].classList;
		let edition = classList[classList.length - 1].toUpperCase();
		let statsSpan = baseInfos.childNodes[5];
		if (edition !== "PRO" && name !== "Banner") {
		// Second condition is to deny a troll from the site admins so yeah, we definitely won't record this
			if (!players[name]) {
				players[name] = [];
			}
			var stats = {
				pace: Number(statsSpan.childNodes[1].innerText.remove(/[A-Z]+/)),
				shooting: Number(statsSpan.childNodes[2].innerText.remove(/[A-Z]+/)), 
				passing: Number(statsSpan.childNodes[3].innerText.remove(/[A-Z]+/)),
				dribbling: Number(statsSpan.childNodes[4].innerText.remove(/[A-Z]+/)),
				defending: Number(statsSpan.childNodes[5].innerText.remove(/[A-Z]+/)),
				physical: Number(statsSpan.childNodes[6].innerText.remove(/[A-Z]+/))
			};
			var embeddedPlayerInfos = {
				baseData: {
					name: name,
					club: club,
					league: league,
					url: futheadLink,
					strongFoot: strongFoot,
					weakFoot: weakFoot,
					skillMoves: skillMoves
				},
				ig_data: { // in-game data
					ovr: ovr,
					edition: edition,
					stats: stats,
					workRates: workRates,
					position: position
				}
			};
			players[name].push(embeddedPlayerInfos);
			if (players[name].length > 1) {
				players[name].sort(function(firstEdition, secondEdition) {
					return secondEdition.ig_data.ovr - firstEdition.ig_data.ovr;
				});
			}
		}
	});
	
	pre.log("Scraping page " + pageNumber + " of " + maxPage[currentQuality] + ": SUCCESS", "success");
	pageNumber++;
	if (maxPage[currentQuality] >= pageNumber) {
		scrapeNewPage(pageNumber);
	} else {
		if (currentQuality === "bronze") {
			write(players);
			return;
		} else {
			pre.log("Scraping all " + currentQuality + " players: SUCCESS", "success");
			pre.log("Moving into next quality");
			delete maxPage[currentQuality];
			currentQuality = Object.keys(maxPage)[0];
			pageNumber = 1;
			scrapeNewPage(pageNumber);
		}
	}
}

function futheadify(link) {
	return link.replace("file://", "http://www.futhead.com");
}

function futheadTrim(string) {
	return string.trim().replace(/[\n\s]+/mg, " ").replace("| ", "");
}

Object.defineProperty(String.prototype, "remove", {
	writable: true,
	enumerable: false,
	value: function(str) {
		return this.replace(str, "");
	}
});

function defaultAjaxRequest(url, callback) {
	return {
		url: "http://whateverorigin.org/get?url=" + encodeURIComponent(url) + "&callback=?",
		dataType: 'jsonp',
		type: 'GET',
		success: callback
	};
}

function write(object) {
	pre.log("Scraping Successful, " + Object.keys(players).length + " players saved", "success");
	scrapeNewPage = null;
	let downloadLink = document.createElement("a");
	downloadLink.href = "data:text/plain;charset=utf-8," + encodeURIComponent(JSON.stringify(object));
	downloadLink.download = "Sample.js";
	downloadLink.innerHTML = "Download the players database";
	document.body.prepend(downloadLink);
	downloadLink.click();
}

function getDeepContent(node) {
	return node.childNodes[0].textContent;
}
