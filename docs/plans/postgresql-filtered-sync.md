# PostgreSQL Filtered Sync Implementation Plan

## Overview

Replace MUD indexer-based hydration with a server-mediated approach that queries PostgreSQL directly, enabling entity-level filtering before data reaches the client.

## Current State

- SQLite indexer running on AWS Fargate
- Client loads ALL entities via `syncToRecs` → MUD indexer
- Post-sync filtering in `initEntities.ts` removes unwanted data after download
- Filtering rules:
  - PLAYER: Full sync for active player, minimal props (entityType, name) for others
  - RAT: Only active player's current rat
  - TRIP: Balance > 0 OR owned by active player
  - ITEM: Only items in active player's rat inventory

## Target State

- PostgreSQL decoded indexer on AWS Fargate
- Server queries PostgreSQL with filters, returns only needed data
- Client hydrates stores directly, skips MUD indexer hydration
- Live sync continues normally via RPC

---

## Phase 1: Infrastructure - PostgreSQL Indexer

### 1.1 Set up PostgreSQL database

- [ ] Provision PostgreSQL instance (RDS or similar)
- [ ] Configure networking (VPC, security groups)
- [ ] Create database and credentials

### 1.2 Deploy PostgreSQL decoded indexer

- [ ] Update Fargate task definition for `postgres-decoded-indexer`
- [ ] Environment variables:
  ```
  DATABASE_URL=postgresql://user:pass@host:5432/dbname
  RPC_HTTP_URL=<your-rpc>
  STORE_ADDRESS=<world-address>
  START_BLOCK=<initial-block>
  FOLLOW_BLOCK_TAG=safe
  ```
- [ ] Deploy and verify indexer is syncing
- [ ] Verify tables are created: `<world_address>__<namespace>__<table_name>`

### 1.3 Verify data structure

- [ ] Connect to PostgreSQL and inspect table schemas
- [ ] Confirm all game tables are present (Player, Rat, Trip, Item, CurrentRat, Inventory, etc.)
- [ ] Note column names and types for query building

---

## Phase 2: Hydration Server

### 2.1 Create new server package or endpoint

- [ ] Decide: new package vs extend existing `packages/server`
- [ ] Set up PostgreSQL client (e.g., `postgres`, `drizzle-orm`, or `@vercel/postgres`)
- [ ] Configure DATABASE_URL environment variable

### 2.2 Implement filtered query endpoint

```typescript
// POST /api/hydrate
// Body: { activePlayerId: string, chainId: number }
// Response: { blockNumber: bigint, entities: Entities }
```

### 2.3 Build SQL queries for each entity type

```sql
-- Get current indexed block
SELECT block_number FROM mud.chain_state WHERE chain_id = $1;

-- Players: full data for active, minimal for others
SELECT * FROM "<world>__app__Player" WHERE entity_id = $activePlayerId;
SELECT entity_id, entity_type, name FROM "<world>__app__Player" WHERE entity_id != $activePlayerId;

-- Get active player's current rat
SELECT value as rat_id FROM "<world>__app__CurrentRat" WHERE entity_id = $activePlayerId;

-- Rat: only active player's current rat
SELECT * FROM "<world>__app__Rat" WHERE entity_id = $ratId;

-- Trips: balance > 0 OR owned by active player
SELECT * FROM "<world>__app__Trip" WHERE balance > 0 OR owner = $activePlayerId;

-- Items: only in active player's rat inventory
SELECT item_id FROM "<world>__app__Inventory" WHERE entity_id = $ratId;
SELECT * FROM "<world>__app__Item" WHERE entity_id = ANY($inventoryItemIds);
```

### 2.4 Transform SQL results to entity format

- [ ] Match the `Entities` type used by client stores
- [ ] Handle bigint serialization (JSON doesn't support bigint natively)
- [ ] Include blockNumber in response

### 2.5 Deploy hydration server

- [ ] Add to existing Fargate setup or deploy separately
- [ ] Ensure it can access PostgreSQL (same VPC)
- [ ] Set up API endpoint URL

---

## Phase 3: Client Changes

### 3.1 Create hydration service

```typescript
// packages/client/src/lib/modules/chain-sync/hydrateFromServer.ts

export async function hydrateFromServer(activePlayerId: string): Promise<{
  blockNumber: bigint
  entities: Entities
}> {
  const response = await fetch(`${HYDRATION_SERVER_URL}/api/hydrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ activePlayerId, chainId: CHAIN_ID })
  })

  const data = await response.json()
  return {
    blockNumber: BigInt(data.blockNumber),
    entities: deserializeEntities(data.entities) // Handle bigint deserialization
  }
}
```

### 3.2 Modify setupPublicNetwork

```typescript
// packages/common/src/mud/setupPublicNetwork.ts

export async function setupPublicNetwork(
  networkConfig: NetworkConfig,
  devMode: boolean,
  publicClient?: PublicClient<Transport, Chain>,
  initialBlockLogs?: { blockNumber: bigint; logs: [] } // New parameter
): Promise<SetupPublicNetworkResult> {
  // ...existing setup...

  const resolvedConfig = {
    world,
    config: mudConfig,
    address: networkConfig.worldAddress as Hex,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    // Skip indexer hydration if initialBlockLogs provided
    initialBlockLogs: initialBlockLogs,
    indexerUrl: initialBlockLogs ? undefined : networkConfig.indexerUrl
  }

  const { components, latestBlock$, storedBlockLogs$, waitForTransaction } =
    await syncToRecs(resolvedConfig)

  // ...rest unchanged...
}
```

### 3.3 Update client initialization flow

```typescript
// Somewhere in client initialization (e.g., SessionAndSpawnLoading.svelte or similar)

// 1. Fetch filtered data from server
const { blockNumber, entities } = await hydrateFromServer(activePlayerId)

// 2. Set up MUD sync with empty initial logs at that block
const publicNetwork = await setupPublicNetwork(
  networkConfig,
  devMode,
  undefined,
  { blockNumber, logs: [] } // Skip MUD hydration
)

// 3. Hydrate stores directly
entities.set(entities)

// 4. Set up component systems for live updates
for (const componentKey of publicNetwork.tableKeys) {
  createComponentSystem(componentKey)
}
```

### 3.4 Simplify initEntities

- [ ] Remove post-sync filtering logic (now done server-side)
- [ ] Keep the store hydration and component system setup
- [ ] Or deprecate entirely if initialization is handled elsewhere

---

## Phase 4: Testing & Migration

### 4.1 Local testing

- [ ] Run PostgreSQL locally (Docker)
- [ ] Run postgres-decoded-indexer locally against test chain
- [ ] Test hydration endpoint with various activePlayerId values
- [ ] Verify client receives correct filtered data

### 4.2 Staging deployment

- [ ] Deploy PostgreSQL indexer to staging
- [ ] Deploy hydration server to staging
- [ ] Test full flow: connect wallet → server hydration → live sync
- [ ] Compare entity counts: old (full sync + filter) vs new (server filtered)

### 4.3 Production migration

- [ ] Deploy PostgreSQL infrastructure
- [ ] Run PostgreSQL indexer alongside SQLite (both syncing)
- [ ] Deploy hydration server
- [ ] Feature flag: switch between old and new hydration
- [ ] Monitor performance and correctness
- [ ] Deprecate SQLite indexer once stable

---

## Phase 5: Cleanup

- [ ] Remove SQLite indexer infrastructure
- [ ] Remove post-sync filtering code from initEntities (if not needed)
- [ ] Update documentation
- [ ] Remove feature flags

---

## Considerations

### Error handling

- Server unavailable: fall back to MUD indexer hydration?
- PostgreSQL connection issues: retry logic
- Block number mismatch: validate server response

### Performance

- Connection pooling for PostgreSQL
- Consider caching frequent queries
- Monitor query performance, add indexes if needed

### Security

- Hydration server should validate activePlayerId
- Rate limiting on hydration endpoint
- Don't expose raw SQL - only parameterized queries

### Data consistency

- Ensure server queries are atomic (single transaction)
- Return consistent blockNumber with data
- Handle case where indexer is behind RPC

---

## Open Questions

1. Where to host hydration server? Same Fargate cluster? Lambda?
2. Authentication for hydration endpoint? (wallet signature verification?)
3. Fallback strategy if server is unavailable?
4. How to handle dashboard package? (different filtering needs)
