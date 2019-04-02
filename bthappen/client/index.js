#!/usr/bin/env node

/**
 * Main program to run the Room client
 *
 */
"use strict";

const VERSION = "1.0.0";

// For CLI usage
var path = require("path");
var scriptName = path.basename(process.argv[1]);
var args = process.argv.slice(2);
var arg;

// development option
var develop = false;

// Get the server with defaults
var RoomClient = require("./RoomClient.js");
var RoomServer = require("../server/RoomServer.js");

var roomClient = new RoomClient();

var port = 1337;
var serverPart = "localhost";
var server;


// Make it using prompt
var readline = require("readline");

var rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});



/**
 * Display helptext about usage of this script.
 */
function usage() {
    console.log(`Usage: ${scriptName} [options]

Options:
 -h                  Display help text.
 -v                  Display the version.
 --server <server>   Set the server url to use.
 --port <number>     Set the port number to use.
 --develop           Print url sent to server.`);
}



/**
 * Display helptext about bad usage.
 *
 * @param String message to display.
 */
function badUsage(message) {
    console.log(`${message}
Use -h to get an overview of the command.`);
}



/**
 * Display version.
 */
function version() {
    console.log(VERSION);
}



// Walk through all arguments checking for options.
while ((arg = args.shift()) !== undefined) {
    switch (arg) {
        case "-h":
            usage();
            process.exit(0);
            break;

        case "-v":
            version();
            process.exit(0);
            break;

        case "--server":
            serverPart = args.shift();
            if (serverPart === undefined) {
                badUsage("--server must be followed by a url.");
                process.exit(1);
            }
            break;

        case "--port":
            port = args.shift();
            if (port === undefined) {
                badUsage("--port must be followed by a port number.");
                process.exit(1);
            }
            break;

        case "--develop":
            develop = true;
            break;

        default:
            badUsage("Unknown argument.");
            process.exit(1);
            break;
    }
}



/**
 * Display a menu.
 */
function menu() {
    console.log(`Commands available:

 exit              Leave this program.
 menu              Print this menu.
 url               Get url to view the server in browser.
 list              List all rooms.
 view <id>         View the room with the selected id.
 house <house>     View the names of all rooms in this building (house).
 search <string>   View the details of all matching rooms (one per row).
 searchp <string>  Search with priority.`);
}



/**
 * Callbacks for game asking question.
 */
rl.on("line", function(line) {
    // Split incoming line with arguments into an array
    var args = line.trim().split(" ");
    let maxNbr;

    args = args.filter(value => {
        return value !== "";
    });

    switch (args[0]) {
        case "exit":
            console.log("Bye!");
            process.exit(0);
            break;

        case "menu":
            menu();
            rl.prompt();
            break;

        case "url":
            console.log("Click this url to view the server in a browser.\n" + server + "/");
            rl.prompt();
            break;

        case "list":
            maxNbr = args[1];

            roomClient.list(maxNbr)
                .then(value => {
                    console.log(value);
                    rl.prompt();
                })
                .catch(err => {
                    console.log("FAILED: Could not list the rooms.\nDetails: " + err);
                    rl.prompt();
                });
            break;

        case "view":
            let number = args[1];

            roomClient.viewRoomNbr(number)
                .then(value => {
                    console.log(value);
                    rl.prompt();
                })
                .catch(err => {
                    console.log("FAILED: Could not view the room.\nDetails: " + err);
                    rl.prompt();
                });
            break;

        case "house":
            let house = args[1];

            maxNbr = args[2];
            roomClient.viewRoomsInHouse(house, maxNbr)
                .then(value => {
                    console.log(value);
                    rl.prompt();
                })
                .catch(err => {
                    console.log("FAILED: Could not view the house.\nDetails: " + err);
                    rl.prompt();
                });
            break;

        case "search":
            let search = args[1];

            maxNbr = args[2];
            roomClient.search(search, maxNbr)
                .then(value => {
                    console.log(value);
                    rl.prompt();
                })
                .catch(err => {
                    console.log("FAILED: Could not perform the search.\nDetails: " + err);
                    rl.prompt();
                });
            break;

        case "searchp":
            let searchp = args[1];

            roomClient.searchPriority(searchp)
                .then(value => {
                    console.log(value);
                    rl.prompt();
                })
                .catch(err => {
                    console.log("FAILED: Could not perform the search.\nDetails: " + err);
                    rl.prompt();
                });
            break;

        default:
            console.log("Enter 'menu' to get an overview of what you can do here.");
            rl.prompt();
    }
});



rl.on("close", function() {
    console.log("Bye!");
    process.exit(0);
});


// Main
server = "http://" + serverPart + ":" + port;
roomClient.setServer(server, develop);
console.log("Use -h to get a list of options to start this program.");
console.log("Ready to talk to server url '" + server + "'.");
console.log("Use 'menu' to get a list of commands.");
rl.setPrompt("Rooms$ ");
rl.prompt();
