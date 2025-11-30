#!/bin/bash

# Load environment variables
source ../.env

# Change directory to the client package
cd ../../packages/auction-frontend

# build the frontend
pnpm build

# Change directory to the location of the built frontend
cd ./build

echo "deploying to base mainnet $BASE_SALE_FRONTEND_ID"
# Deploy for Base mainnet
netlify deploy --dir=. --prod --auth=$NETLIFY_AUTH_TOKEN --no-build --site $BASE_SALE_FRONTEND_ID
echo "done"
