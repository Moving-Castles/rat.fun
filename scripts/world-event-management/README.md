Script to create a world event.

Happens in two steps:

1. Publication

- New world event document is created on the public sanity cms
- Including activation date and time (required)
- Publication text (optional)

2. Activation

- Send transaction to create the world event onchain (args are: title, prompt, duration in blocks and id of the world event document)
- Updates the world event document with the title, prompt, activationText, and duration

Events are defined in json files in the `event-definitions` directory.

## Installation

```bash
pnpm i --ignore-workspace
```

## Usage

### List all events

```bash
pnpm start list
```

### Publish an event (Phase 1)

```bash
pnpm start publish <event-index>
```

### Activate an event (Phase 2)

```bash
pnpm start activate <event-index>
```

## Environment Variables

Create a `.env` file in the project root with:

```
SANITY_PROJECT_ID=your_project_id
SANITY_DATASET=production
SANITY_TOKEN=your_sanity_token
RPC_URL=your_rpc_url
PRIVATE_KEY=your_private_key
WORLD_EVENT_CONTRACT_ADDRESS=your_contract_address
```

## Event Definition Format

Each event should be defined in `event-definitions/<index>/info.json`:

```json
[
  {
    "index": 1,
    "id": "",
    "worldAddress": "",
    "state": "draft",
    "publication": {
      "publicationTitle": "Event Title",
      "activationDateTime": "2024-01-01T12:00:00Z",
      "publicationText": "Optional publication text"
    },
    "activation": {
      "activationTitle": "Event Title",
      "prompt": "Event prompt",
      "activationDateTime": "2024-01-01T12:00:00Z",
      "activationText": "Activation text",
      "duration": 1000,
      "image": "optional_image_url"
    }
  }
]
```
