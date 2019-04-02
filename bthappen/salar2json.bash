#!/bin/bash

INPUT_FILE="salar.csv"
OUTPUT_FILE="salar.json"
touch $OUTPUT_FILE

# Get the headers in an array
headersString=$( cat $INPUT_FILE | head -2 | tail -1 | tr -d '\r' )
IFS=',' read -r -a headers <<< "$headersString"
let maxIndex=${#headers[@]}-1              # headers length - 1

# Number of lines in the csv file
nbrOfLines=$( wc -l $INPUT_FILE | cut -d " " -f1 )

resultString=""


#
# Append one room to result string.
# $1 is the row number
#
function append-room
{
    resultString+="\n        {"
    rowNbr=$1

    for i in `seq 0 "$maxIndex"`
    do
        let colNbr=$i+1
        item=$( get-item $rowNbr $colNbr )

        if [[ "$item" = "" ]]; then
            resultString+="\n            \"${headers[i]}\": null"
        else
            resultString+="\n            \"${headers[i]}\": \"$item\""
        fi

        # Not last field (last column)
        if [[ "$i" -lt "$maxIndex" ]]; then
            resultString+=","
        fi

    done

    if [[ "$rowNbr" -lt "$nbrOfLines" ]]; then
        resultString+="\n        },"
    else
        resultString+="\n        }"
    fi
}

#
# Get item from row and column.
# $1 is the row number
# $2 is the column number
#
function get-item
{
    rowNbr=$1
    colNbr=$2

    # Empty field (\r ends line in csv files)
    item=$(cat $INPUT_FILE | head -$rowNbr | tail -1 | tr -d '\r' | cut -d "," -f"$colNbr" )

    echo $item
}


resultString+='{\n    "salar": ['

for j in `seq 3 "$nbrOfLines"`
do
    append-room $j
done

resultString+='\n    ]\n}'

echo -e "$resultString" > $OUTPUT_FILE
