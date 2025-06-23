# RAT.FUN

## Packages

### client

SvelteKit frontend.

### cms-private

- Stores the system prompts for the LLM calls
- Requires authentication to read

### cms-public

- Stores room images
- Stores room and outcome statistics
- Publicly accessible

### contracts

Mud based.

### server

- Creating and entering rooms is done through the server
- The server executes the LLM calls
- Chain calls are done from admin account on behalf of the player
- Server maintains websocket connections to the players for alerts

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
