/**
 * Front for RoomServer
 */
"use strict";


// A better router to create a handler for all routes
// var Router = require("./router.js");
var Router = require("./router");
var router = new Router();
let dataFile = require('../salar.json');


// Import the http server as base
var http = require("http");
var url = require("url");
var qs = require("querystring");



/**
 * Wrapper function for sending a JSON response
 *
 * @param  Object        res     The response
 * @param  Object/String content What should be written to the response
 * @param  Integer       code    HTTP status code
 */
function sendJSONResponse(res, content, code = 200) {
    content = { "responseCode": code, "response": content };
    res.writeHead(code, { "Content-Type": "application/json; charset=utf8" });
    res.write(JSON.stringify(content, null, "    "));
    res.end();

    // --develop option active if true
    if (server.develop) {
        console.log(content);
    }
}



/**
 * Display a helptext about the API.
 *
 * @param Object req The request
 * @param Object res The response
 */
router.get("/", (req, res) => {
    sendJSONResponse(res, {
        "message": "Welcome to the Room server. This is the API of what can be done.",
        "/": "Display this helptext.",
        "/room/list": "Show all rooms.",
        "/room/view/id/:number": "Show details about room with id <number>.",
        "/room/view/house/:house": "Show all rooms in house <house>.",
        "/room/search/:search": "Show rooms matching the string <search> in any field.",
        "/room/searchp/:search": "Search with priority."
    });
});


/**
 * Returns a string that contains information about the room with a certain index.
 *
 * @param Number index The index of the room in dataFile.salar
 *
 * @returns String The room info string.
 */
function getRoomInfo(index) {
    let x = dataFile.salar[index];

    let resultString = x.Salsnr + ", " + x.Salsnamn + ", " + x.Lat + ", "
        + x.Long + ", " + x.Ort + ", " + x.Hus + ", " + x.Våning
        + ", " + x.Typ + ", " + x.Storlek;

    return resultString.replace(/null/g, '-');
}


/**
 * View all rooms.
 *
 * @param Object req The request
 * @param Object res The response
 */
router.get("/room/list", (req, res) => {

    // Get querystring
    let query = url.parse(req.url, true).query;
    let maxNbr = query['max'] || dataFile.salar.length;

    let headers = "Salsnr, Salsnamn, Lat, Long, Ort, Hus, Våning, Typ, Storlek";
    let rooms = {};

    rooms[0] = headers;
    if (maxNbr > dataFile.salar.length) {
        maxNbr = dataFile.salar.length;
    }

    // Read from JSON file
    for (let i = 0; i < maxNbr; i++) {
        rooms[i + 1] = getRoomInfo(i);
    }

    sendJSONResponse(res, rooms);
});


/**
 * Show details about room with id <number>.
 *
 * @param Object req The request
 * @param Object res The response
 */
router.get("/room/view/id/:number", (req, res) => {
    // get the value of the parameter :number
    let number = req.params.number;
    let message = "Room number " + number + " does not exist.";
    let roomInfo = "-";
    let i = 0;

    while (i < dataFile.salar.length && roomInfo === "-") {
        if (dataFile.salar[i].Salsnr === number) {
            roomInfo = getRoomInfo(i);
            message = "Room number " + number + " exists.";
        }
        i++;
    }

    // Send the response
    sendJSONResponse(res, {
        "message": message,
        "roomInfo": roomInfo
    });
});



/**
 * Shows all rooms in house <house>.
 *
 * @param Object req The request
 * @param Object res The response
 */
router.get("/room/view/house/:house", (req, res) => {
    // get the value of the parameter :house
    let house = req.params.house;
    let message = "House " + house + " does not exist.";
    let headers = "Salsnr, Salsnamn, Lat, Long, Ort, Hus, Våning, Typ, Storlek";
    let rooms = {};
    let n = 0;  // number of rooms in the house
    // Get querystring
    let query = url.parse(req.url, true).query;
    let maxNbr = query['max'] || dataFile.salar.length;

    rooms[0] = headers;
    let i = 0;
    while (i < dataFile.salar.length && n < maxNbr) {
        if (dataFile.salar[i].Hus === house) {
            n++;
            rooms[n] = getRoomInfo(i);
        }
        i++;
    }

    // Send the response
    if (n > 0) {
        sendJSONResponse(res, rooms);
    } else {
        sendJSONResponse(res, {
            "message": message
        });
    }
});


/**
 * Returns an array containing all matching rooms.
 *
 * @param String search The search string.
 * @param Number maxNbr Max number of shown search matches.
 *
 * @returns Object The array containing matching rooms.
 */
function getSearchResult(search, maxNbr) {
    let headers = "Salsnr, Salsnamn, Lat, Long, Ort, Hus, Våning, Typ, Storlek";
    let rooms = {};
    let n = 0;  // number of rooms matching the search

    rooms[0] = headers;
    let i = 0;
    while (i < dataFile.salar.length && n < maxNbr) {
        if (getRoomInfo(i).toLowerCase().includes(search.toLowerCase())) {
            n++;
            rooms[n] = getRoomInfo(i);
        }
        i++;
    }

    return rooms;
}



/**
 * Shows rooms matching the string <search> in any field.
 *
 * @param Object req The request
 * @param Object res The response
 */
router.get("/room/search/:search", (req, res) => {
    // get the value of the parameter :search
    let search = decodeURI(req.params.search);
    let message = "String " + search + " not found.";
    // Get querystring
    let query = url.parse(req.url, true).query;
    let maxNbr = query['max'] || dataFile.salar.length;
    let rooms = getSearchResult(search, maxNbr);

    // Send the response
    if (Object.keys(rooms).length > 1) {
        sendJSONResponse(res, rooms);
    } else {
        sendJSONResponse(res, {
            "message": message
        });
    }
});


/**
 * Returns the priority of a search result.
 *
 * @param Number index The index of the room in the JSON file.
 * @param String search The search string.
 *
 * @returns Number The priority of the search result.
 */
function getPriority(index, search) {
    let priority = 0;
    let roomInfoArray;

    // High priority field
    if (dataFile.salar[index].Salsnr
        && dataFile.salar[index].Salsnr.toLowerCase().includes(search.toLowerCase())) {
        priority += 0.25;
        console.log("High priority field");
    } else if (dataFile.salar[index].Salsnamn
        && dataFile.salar[index].Salsnamn.toLowerCase().includes(search.toLowerCase())) {
        priority += 0.25;
        console.log("High priority field");
    }

    // Matching an entire field
    roomInfoArray = getRoomInfo(index).toLowerCase().split(", ");
    //roomInfoArray = roomInfoArray.map(x => x.toLowerCase());
    if (roomInfoArray.includes(search.toLowerCase())) {
        priority += 0.25;
        console.log("Matching an entire field");
    }

    // Matching beginning of string
    for (let i = 0; i < roomInfoArray.length; i++) {
        if (roomInfoArray[i].startsWith(search.toLowerCase())) {
            priority += 0.25;
            console.log("Matching the beginning of a string");
            break;
        }
    }

    // Case-sensitive
    if (getRoomInfo(index).includes(search)) {
        priority += 0.25;
        console.log("Matching with case-sensitivity");
    }

    return priority;
}


/**
 * Search with priority.
 *
 * @param Object req The request
 * @param Object res The response
 */
router.get("/room/searchp/:search", (req, res) => {
    // get the value of the parameter :search
    let search = decodeURI(req.params.search);
    let headers = "Salsnr, Salsnamn, Lat, Long, Ort, Hus, Våning, Typ, Storlek";
    let message = "String " + search + " not found.";
    let rooms = {}, matches = [];
    let nbrOfMatches = 0;

    rooms[0] = headers;
    for (let i = 0; i < dataFile.salar.length; i++) {
        if (getRoomInfo(i).toLowerCase().includes(search.toLowerCase())) {
            matches[nbrOfMatches] = {
                room: getRoomInfo(i),
                priority: getPriority(i, search)
            };
            nbrOfMatches++;
        }
    }

    matches.sort((a, b) => (a.priority < b.priority) ? 1 : -1)
    for (let j = 0; j < matches.length; j++) {
        rooms[j + 1] = matches[j];
    }

    // Send the response
    if (Object.keys(rooms).length > 1) {
        sendJSONResponse(res, rooms);
    } else {
        sendJSONResponse(res, {
            "message": message
        });
    }
});



/**
 * Create and export the server
 */
var server = http.createServer((req, res) => {
    var ipAddress,
        route,
        querystring,
        develop;

    // Log incoming requests
    ipAddress = req.connection.remoteAddress;

    // Check what route is requested
    route = url.parse(req.url).pathname;

    querystring = qs.stringify(url.parse(req.url, true).query);
    if (querystring.length > 0) {
        querystring = "?" + querystring;
    }
    console.log("Incoming route " + route + querystring + " from ip " + ipAddress);

    // Let the router take care of all requests
    router.route(req, res);
});

// export default server;
module.exports = server;
