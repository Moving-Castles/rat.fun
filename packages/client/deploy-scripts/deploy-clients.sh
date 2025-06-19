#!/bin/bash

# Load environment variables
source ../.env

# Change directory to the client package
cd ..

# build the frontend
pnpm build

ls

# Change directory to the location of the built frontend
cd ./build

# Deploy for Pyrope
# NETLIFY_SITE_ID=$PYROPE_CLIENT_ID netlify deploy --dir=. --prod --auth=$NETLIFY_AUTH_TOKEN

echo "This is a dry-run. inspect script to enable deployment"

pnpm preview
