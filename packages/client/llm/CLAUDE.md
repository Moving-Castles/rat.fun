# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

RAT ROOM is a blockchain-based gaming application where players own rats that enter rooms for AI-generated outcomes. The system combines:

- **Frontend**: SvelteKit 5 with TypeScript
- **Smart Contracts**: MUD framework (Entity Component System)
- **Backend**: Node.js/Fastify server with LLM integration
- **Content Management**: Dual Sanity CMS setup

## Development Commands

### Starting Development

```bash
pnpm dev              # Starts all 7 services via mprocs (recommended)
pnpm dev:client       # Client only
pnpm dev:contracts    # Contracts only
```

### Building

```bash
pnpm build            # Build all packages
pnpm build:client     # Client only
```

### Code Quality

```bash
# In packages/client/
pnpm lint             # ESLint + Prettier check
pnpm format           # Prettier format
pnpm check            # Svelte type checking
```

### Testing

```bash
pnpm test             # Run all tests (recursive)
```

## Architecture

### Multi-Process Development

The project uses `mprocs` to run 7 concurrent processes:

1. **client** - SvelteKit dev server
2. **contracts** - MUD contract development
3. **server** - Backend API server
4. **anvil** - Local Ethereum node
5. **indexer** - Blockchain indexer
6. **cms-public** & **cms-private** - Content management systems
7. **explorer** - MUD explorer interface

### Package Structure

- `packages/client/` - SvelteKit frontend with complex component architecture
- `packages/contracts/` - MUD-based smart contracts using ECS pattern
- `packages/server/` - Fastify server with LLM integration (Claude, Groq)
- `packages/cms-public/` - Room data, outcomes, statistics
- `packages/cms-private/` - System prompts, AI configuration
- `packages/scripts/` - Utility scripts

### Key Technologies

- **MUD Framework**: Version 2.2.22 with Entity Component System architecture
- **Svelte 5**: Uses modern runes-based reactivity (`$state`, `$props`, `$derived`)
- **Blockchain**: Foundry for contracts, viem/wagmi for client interaction
- **AI Integration**: Claude Sonnet 4, Groq, Replicate for image generation
- **Package Manager**: pnpm with workspaces

## Game Logic Architecture

### Entity Relationships (defined in mud.config.ts)

- **Players** own **Rats** (via `OwnedRat`, `Owner` tables)
- **Rats** enter **Rooms** for outcomes
- **Rooms** have prompts that trigger LLM calls
- Economic system with tokens, levels, and traits

### Key Tables in MUD Schema

- `GameConfig` - Global game settings and costs
- `Name`, `EntityType`, `Level` - Core entity properties
- `Dead`, `Traits`, `Inventory` - Rat attributes
- `Prompt`, `VisitCount`, `KillCount` - Room properties
- `Balance`, `Owner` - Economic and ownership data

### Real-time Updates

- WebSocket connections between client and server
- Blockchain events trigger UI updates via MUD's store-sync
- Server executes blockchain transactions on behalf of players

## Frontend Specifics

### SvelteKit 5 Patterns

- Uses runes syntax: `let { prop } = $props()`, `let state = $state()`
- Component architecture in `src/lib/components/`
- Page transitions with custom mask-based animations
- GSAP for complex animations
- **Full Svelte 5 documentation**: Available at `/packages/client/llm/llms-full.txt`

### Blockchain Integration

- Network initialization in `src/lib/initNetwork.ts`
- MUD client setup with RECS for entity management
- Real-time blockchain state synchronization

### Styling

- SCSS with component-scoped styles
- CSS-in-JS for dynamic styling
- Custom page transition system with mask animations

## Development Workflow

### Prerequisites

- Node.js 20
- pnpm 10
- Foundry (forge)
- mprocs

### Environment Setup

1. Set environment variables in respective package directories
2. `pnpm i` from root
3. `pnpm dev` to start all services

### Common Patterns

- MUD uses Entity Component System - entities are bytes32 IDs with component data
- Server acts as admin account for blockchain transactions
- LLM calls generate room outcomes based on prompts
- WebSocket events notify clients of game state changes

### Important Files

- `/packages/contracts/mud.config.ts` - Defines entire game schema
- `/mprocs.yaml` - Multi-process development configuration
- `/packages/client/src/lib/initNetwork.ts` - Blockchain connection setup
- `/packages/server/src/config.ts` - Server and LLM configuration

## Package Management

Uses pnpm workspaces with package references (e.g., `contracts: "workspace:*"`). The monorepo structure enables shared dependencies and cross-package imports.
