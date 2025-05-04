# RAT ROOM

## Packages

### Client

Svelte frontend.

### CMS

- Stores room images
- Stores room and outcome statistics
- Stores the system prompts for the LLM calls

### Contracts

Mud based.

### Scripts

Misc. scripts.

### Server

- Creating and entering rooms is done through the server
- The server executes the LLM calls
- Chain calls are done from admin account on behalf of the player
- Server maintains websocket connections to the players for alerts

## Setup

### Prerequisites

Install [forge](https://book.getfoundry.sh/forge/)
Install [mprocs](https://github.com/pvolok/mprocs)

Package manager: `pnpm`
Node version: `20`

### Installation

1. Get env variables for the respective packages and put them in their place
2. Run install script and dev script from the root directory
   a. `pnpm i`
   b. `pnpm dev`

Actually pretty simple
