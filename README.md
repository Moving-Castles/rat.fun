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
