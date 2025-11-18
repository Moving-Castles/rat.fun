# Types Module

Shared type definitions and constants used throughout drawbridge.

## Overview

This module contains the foundational types and constants that are imported by other modules. It's organized into three categories: client types, state management, and MUD-specific constants.

## Files

### `clients.ts`

Viem client type definitions.

**Types:**

- `ConnectedClient` - A viem client with an account (any connected wallet)
- `SessionClient` - ERC-4337 smart account with MUD World extensions

**Usage:**

```typescript
import { SessionClient, ConnectedClient } from "../types/clients"

function processSession(client: SessionClient) {
  const { userAddress, worldAddress, account } = client
  // ...
}
```

### `state.ts`

drawbridge status enum for state management.

**Types:**

- `DrawbridgeStatus` - Enum representing connection and setup states

**State Flow:**

```
UNINITIALIZED → DISCONNECTED → CONNECTING → CONNECTED
  → SETTING_UP_SESSION → READY
```

**Usage:**

```typescript
import { DrawbridgeStatus } from "../types/state"

if (status === DrawbridgeStatus.READY) {
  // Session is ready to use
}
```

### `mud.ts`

MUD World-specific constants and configurations.

**Exports:**

- `defaultClientConfig` - Default viem polling interval
- `unlimitedDelegationControlId` - Resource ID for unlimited delegation
- `worldTables` - MUD World table definitions
- `worldAbi` - Minimal World ABI for delegation

**Usage:**

```typescript
import { unlimitedDelegationControlId, worldAbi } from "../types/mud"

// Register delegation with unlimited control
await client.writeContract({
  address: worldAddress,
  abi: worldAbi,
  functionName: "registerDelegation",
  args: [delegatee, unlimitedDelegationControlId, "0x"]
})
```

## Import Patterns

**Individual imports:**

```typescript
import { SessionClient } from "../types/clients"
import { DrawbridgeStatus } from "../types/state"
import { worldAbi } from "../types/mud"
```

**Barrel import (all types):**

```typescript
import { SessionClient, DrawbridgeStatus, worldAbi } from "../types"
```

## Type Dependencies

```
types/ (no internal dependencies)
  ↓
Used by:
  - session/
  - bundler/
  - delegation/
  - wallet/
  - drawbridge.ts
```

This module has no internal dependencies on other drawbridge-drawbridge modules, making it the foundation of the type system.
