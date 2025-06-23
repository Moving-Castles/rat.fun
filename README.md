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

### Installation

1. Get env variables for the respective packages and put them in their place
2. Run install script and dev script from the root directory
   a. `pnpm i`
   b. `pnpm dev`
