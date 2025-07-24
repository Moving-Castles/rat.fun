#!/bin/bash

# Load environment variables
source ../.env

# Change directory to the client package
cd ../../packages/client

# build the frontend
pnpm build

# Change directory to the location of the built frontend
cd ./build

# Deploy for Base Sepolia (burner wallet)
NETLIFY_SITE_ID=$BASE_SEPOLIA_CLIENT_ID netlify deploy --dir=. --prod --auth=$NETLIFY_AUTH_TOKEN --no-build

# Deploy for Base Sepolia (entry kit)
NETLIFY_SITE_ID=$BASE_SEPOLIA_ENTRYKIT_CLIENT_ID netlify deploy --dir=. --prod --auth=$NETLIFY_AUTH_TOKEN --no-build