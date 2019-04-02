#!/bin/bash
#
# Script for testing all routes
#

# Set the port
if [[ $LINUX_PORT ]]; then
    port=$LINUX_PORT;
else
    port=1337;
fi

# Set the server address
if [[ $LINUX_SERVER ]]; then
    server=$LINUX_SERVER;
else
    server="localhost";
fi

# Run route test
function route_test
{
    local route="$1"
    local begin=(
""
"---------------------------------------------------------------------------------"
"Testing route $server:$port/$route"
    )

    printf "%s\n" "${begin[@]}"

    fullResponse=$( curl -s "$server":"$port"/"$route" )
    responseCode=$( echo $fullResponse | cut -d "," -f1 | cut -d ":" -f2 )
    echo "Response code: $responseCode"

    if [[ "$verbose" ]]; then
        echo "$fullResponse"
    fi
}

if [[ "$1" == "--verbose" ]]; then
    verbose=true;
fi

# Test cases
route_test                                 # this is localhost:1337/
route_test room/list
route_test room/list?max=5
route_test room/view/id/2-218
route_test room/view/id/C313A
route_test room/view/id/456                 # room does not exist
route_test room/view/house/A-huset          # 3 matches
route_test room/view/house/A-huset?max=5    # max > number of matches
route_test room/view/house/C-huset?max=7
route_test room/search/stu
route_test room/search/lab?max=4
route_test room/search/Övrigt
route_test room/searchp/J33
route_test room/searchp/Platon             # Highest priority
route_test room/searchp/Platonn            # String not found
route_test room/searchp/Met
route_test room/jga                        # 404
