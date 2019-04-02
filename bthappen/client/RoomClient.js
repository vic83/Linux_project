/**
 * Front for RoomServer
 */


// Import the http server as base
var http = require("http");



/**
 * Class for Room client.
 *
 */
class RoomClient {
    /**
     * Constructor.
     *

    constructor() {
        this.gameBoard = new GomokuBoard();
    }*/



    /**
     * Set the url of the server to connect to.
     *
     * @param  String url to use to connect to the server.
     * @param  Boolean develop States if development prints shall be made.
     *
     */
    setServer(url, develop) {
        this.server = url;
        this.develop = develop;
    }



    /**
     * Make a HTTP GET request, wrapped in a Promise.
     *
     * @param  String url to connect to.
     *
     * @return Promise
     *
     */
    httpGet(url) {
        return new Promise((resolve, reject) => {
            if (this.develop) {
                console.log("URL sent to server: " + this.server + url);
            }
            http.get(this.server + url, (res) => {
                var data = "";

                res.on('data', (chunk) => {
                    data += chunk;
                }).on('end', () => {
                    if (res.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject(data);
                    }
                }).on('error', (e) => {
                    reject("Got error: " + e.message);
                });
            });
        });
    }

    /**
     * Create querystring for maxNbr
     *
     * @param Number maxNbr Max number of shown search matches.
     *
     * @return String querystring
     *
     */
     getQueryMax(maxNbr) {
         let querystring = "";

         if (maxNbr) {
             querystring = "?max=" + maxNbr;
         }

         return querystring;
     }

    /**
     * View all rooms.
     *
     * @param Number maxNbr Max number of shown search matches.
     *
     * @return Promise
     *
     */
    list(maxNbr) {
        return this.httpGet("/room/list" + this.getQueryMax(maxNbr));
    }



    /**
     * View details about room with number <number>.
     *
     * @param Number number Room number.
     *
     * @return Promise
     *
     */
    viewRoomNbr(number) {
        return this.httpGet("/room/view/id/" + number);
    }


    /**
     * View details about all rooms in house <house>.
     *
     * @param String house House name.
     * @param Number maxNbr Max number of shown search matches.
     *
     * @return Promise
     *
     */
    viewRoomsInHouse(house, maxNbr) {
        return this.httpGet("/room/view/house/" + house + this.getQueryMax(maxNbr));
    }


    /**
     * View all rooms that contain the search string <search>.
     *
     * @param String search Search string.
     * @param Number maxNbr Max number of shown search matches.
     *
     * @return Promise
     *
     */
    search(search, maxNbr) {
        return this.httpGet("/room/search/" + search + this.getQueryMax(maxNbr));
    }


    /**
     * Search with priority.
     *
     * @param String search Search string.
     *
     * @return Promise
     *
     */
    searchPriority(search) {
        return this.httpGet("/room/searchp/" + search);
    }

}

// export default GomokuClient;
module.exports = RoomClient;
