#!/bin/bash

# Change to the parent directory to use its node_modules
cd "$(dirname "$0")/.."

JSON_FILE_PATH=trip-definitions/playtest-5.json
API_URL=https://rat-fun-server.com/trip/create

# Run the script with ts-node and proper ESM configuration
cd create-trips && NODE_OPTIONS="--experimental-specifier-resolution=node --loader ts-node/esm" pnpm ts-node --esm create-trips.ts $JSON_FILE_PATH $API_URL
