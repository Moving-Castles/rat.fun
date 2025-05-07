#!/bin/bash

# Change to the parent directory to use its node_modules
cd "$(dirname "$0")/.."

JSON_FILE_PATH=create-rooms/room-definitions/playtest-3.json
API_URL=http://localhost:3131/room/create

# Run the script with ts-node-esm and proper loader configuration
NODE_OPTIONS="--experimental-specifier-resolution=node --loader ts-node/esm" npx ts-node-esm create-rooms/create-rooms.ts $JSON_FILE_PATH $API_URL
