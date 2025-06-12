#!/bin/bash

# Change to the parent directory to use its node_modules
cd "$(dirname "$0")/.."

JSON_FILE_PATH=room-definitions/playtest-5.json
API_URL=https://reality-model-1.mc-infra.com/room/create

# Run the script with ts-node and proper ESM configuration
cd create-rooms && NODE_OPTIONS="--experimental-specifier-resolution=node --loader ts-node/esm" pnpm ts-node --esm create-rooms.ts $JSON_FILE_PATH $API_URL
