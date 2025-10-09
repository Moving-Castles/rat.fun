#!/bin/bash

# Change to the script directory
cd "$(dirname "$0")"

JSON_FILE_PATH=trip-definitions/playtest-5.json
API_URL=http://localhost:3131/trip/create

# Run the script with proper ESM configuration
NODE_OPTIONS="--loader ts-node/esm" pnpm ts-node-esm create-trips.ts $JSON_FILE_PATH $API_URL
