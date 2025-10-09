# Create Trip Script

This script creates a new trip by sending a signed request to the API.

## Prerequisites

- Node.js (v14 or higher)
- pnpm
- TypeScript
- A `.env` file in the parent directory containing your `PRIVATE_KEY`

## Installation

1. Install dependencies:

```bash
# Install ts-node and typescript globally (recommended)
pnpm add -g ts-node typescript

# Or install as dev dependencies in your project
pnpm add -D ts-node typescript @types/node
```

2. Create a `.env` file in the parent directory with your private key:

```
PRIVATE_KEY=your_private_key_here
```

## Usage

1. Create a JSON file (e.g., `trip-details.json`) with the following structure:

```json
{
  "tripPrompt": "Your Trip Prompt"
}
```

2. Run the script:

```bash
# Using ts-node (if installed globally)
ts-node create-trips.ts trip-details.json https://your-api-url/trip/create

# Using pnpm
pnpm ts-node create-trips.ts trip-details.json https://your-api-url/trip/create

# Or after building
node dist/create-trips.js trip-details.json https://your-api-url/trip/create
```

## Building

To build the TypeScript file:

```bash
# Build the TypeScript file
pnpm tsc create-trips.ts

# The compiled JavaScript will be in the dist directory
```

## Error Handling

The script will:

- Validate the presence of required environment variables
- Check for required fields in the JSON file
- Handle API errors and display appropriate error messages
- Provide type safety for all operations
