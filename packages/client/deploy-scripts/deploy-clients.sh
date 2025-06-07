#!/bin/bash

# Load environment variables
source ../.env

# Change directory to the client package
cd ..

# build the frontend
pnpm build

# Change directory to the location of the built frontend
cd ./dist

# Deploy for Pyrope
NETLIFY_SITE_ID=$PYROPE_CLIENT_ID netlify deploy --dir=. --prod --auth=$NETLIFY_AUTH_TOKEN
