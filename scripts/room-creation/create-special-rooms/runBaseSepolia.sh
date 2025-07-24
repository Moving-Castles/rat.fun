#!/bin/bash

# Change to the script directory
cd "$(dirname "$0")"

JSON_FILE_PATH=room-definitions/test.json
API_URL=https://base-sepolia.rat-fun-server.com/room/create-special

# Run the script with tsx (modern TypeScript runner)
npx tsx create-special-rooms.ts $JSON_FILE_PATH $API_URL
