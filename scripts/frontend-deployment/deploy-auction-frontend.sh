#!/bin/bash

# Abort if not on main branch
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$CURRENT_BRANCH" != "main" ]; then
    echo "Error: Must be on main branch to deploy. Currently on: $CURRENT_BRANCH"
    exit 1
fi

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
