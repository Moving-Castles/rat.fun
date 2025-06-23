# RAT.FUN

## Packages

### client

SvelteKit frontend.

### contracts

Mud based.

### server

- creating and entering rooms is done through the server
- the server executes the LLM calls
- chain calls are done from admin account on behalf of the player
- server maintains websocket connections to the players for alerts

### cms-private

- using [sanity.io](https://www.sanity.io/)
- stores the system prompts for the LLM calls
- requires authentication to read

### cms-public

- using [sanity.io](https://www.sanity.io/)
- stores room images
- stores room and outcome statistics
- publicly accessible

### scripts

Misc. utility scripts.

## Setup

### Prerequisites

Install [foundry](https://getfoundry.sh/)

Package manager: `pnpm`

Node version: `20`

### Environment variables

A number of variables are required for the project to build and run.

Copy `.env.example` to `.env` and fill in the values.

#### client

- `PUBLIC_SANITY_CMS_ID` (required): Public CMS ID for Sanity. Needed to fetch room images and other metadata.
- `NETLIFY_AUTH_TOKEN` (not required): Netlify authentication token. Needed to deploy clients to Netlify.
- `PYROPE_CLIENT_ID` (not required): ID of netlify deployment for client for pyrope testnet.
- `DOCS_ID` (not required): ID of netlify deployment for docs.

#### contracts

- `PRIVATE_KEY` (required): Private key of deploy account. Pre-filled with anvil account #1

#### server

- `PRIVATE_KEY` (required): Private key of admin/deploy account. Pre-filled with anvil account #1
- `CHAIN_ID` (required): Chain ID of the network to deploy to. Pre-filled with anvil chain ID
- `ANTHROPIC_API_KEY` (required): API key for Anthropic
- `PRIVATE_SANITY_CMS_ID` (required): Private CMS ID for Sanity. Needed to retrieve the system prompts.
- `PRIVATE_SANITY_CMS_TOKEN` (required): Private CMS token for Sanity. Needed to retrieve the system prompts.
- `PUBLIC_SANITY_CMS_ID` (required): Public CMS ID for Sanity. Used to store in-game statistics and metadata.
- `PUBLIC_SANITY_CMS_TOKEN` (required): Public CMS token for Sanity. Used to store in-game statistics and metadata.
- `REPLICATE_API_TOKEN` (required): API token for Replicate. Needed to generate room images.

#### scripts

Not crucial for local development.
If needed, same values as for server.

## Install, build and run

1. Install dependencies: `pnpm i`
2. Build contracts: `cd packages/contracts && pnpm build` (to not have dev script fail on first run)
3. Run dev script: `pnpm dev`
