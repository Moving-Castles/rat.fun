# Wallet Module

Wallet connection layer using wagmi - handles any wallet type (EOA or Smart Account).

## Overview

This module provides the low-level wallet connection functionality. It wraps wagmi's core functions to:

- Connect/disconnect wallets
- Watch for account changes
- Manage connection state

**Key principle:** The wallet layer treats all wallets the same - EOA/Smart Account distinction doesn't matter here.

## Files

### `config.ts`

Creates wagmi configuration with chains, transports, and connectors.

**Function:** `createWalletConfig()`

**What it does:**

- Configures supported chains and RPC transports
- Sets up wallet connectors (MetaMask, Coinbase, WalletConnect, etc.)
- Enables localStorage persistence for connection state

**Usage:**

```typescript
import { createWalletConfig } from "./config"
import { injected, coinbaseWallet } from "@wagmi/connectors"
import { http } from "viem"

const wagmiConfig = createWalletConfig({
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http()
  },
  connectors: [injected(), coinbaseWallet()],
  pollingInterval: 2000 // optional
})
```

---

### `watcher.ts`

Watches for wallet account changes (connect, disconnect, switch).

**Function:** `setupAccountWatcher()`

**What it does:**

- Uses wagmi's `watchAccount` to monitor connection state
- Calls provided handler on any account change
- Returns cleanup function to stop watching

**Handler is called when:**

- Wallet connects
- Wallet disconnects
- User switches accounts
- User switches chains

**Usage:**

```typescript
import { setupAccountWatcher } from "./watcher"

const unwatch = setupAccountWatcher(wagmiConfig, async account => {
  if (account.isConnected) {
    console.log("Connected:", account.address)
    await handleConnection(account)
  } else {
    console.log("Disconnected")
    await handleDisconnection()
  }
})

// Later, stop watching
unwatch()
```

---

### `connection.ts`

Connection management functions.

**Functions:**

#### `attemptReconnect(wagmiConfig)`

Attempts to reconnect to previously connected wallet from localStorage.

**Returns:**

```typescript
{
  reconnected: boolean
  address?: Address  // if reconnected
}
```

**When to use:** During initialization to restore previous session.

**Example:**

```typescript
import { attemptReconnect } from "./connection"

const result = await attemptReconnect(wagmiConfig)
if (result.reconnected) {
  console.log("Restored connection:", result.address)
}
```

#### `attemptConnectWalletToChain(wagmiConfig, connectorId, chainId?)`

Connect to a specific wallet connector and chain if not already connected.

**Parameters:**

- `connectorId` - ID of connector (from `getAvailableConnectors()`)
- `chainId` - Optional chain to connect on

**Throws:**

- `Error("Connector not found")` if connectorId invalid
- `ConnectorAlreadyConnectedError` if already connected

**Example:**

```typescript
import { attemptConnectWalletToChain } from "./connection"

await attemptConnectWalletToChain(wagmiConfig, "injected", 8453)
```

#### `disconnectWallet(wagmiConfig)`

Disconnect currently connected wallet.

**What it does:**

- Clears wagmi connection state
- Removes from localStorage

**Example:**

```typescript
import { disconnectWallet } from "./connection"

await disconnectWallet(wagmiConfig)
```

#### `getAvailableConnectors(wagmiConfig)`

Get list of available wallet connectors.

**Returns:** Array of `Connector` objects

**Example:**

```typescript
import { getAvailableConnectors } from "./connection"

const connectors = getAvailableConnectors(wagmiConfig)
connectors.forEach(connector => {
  console.log(connector.id, connector.name, connector.type)
})
```

---

## Architecture

```
Wallet Layer (treats all wallets the same)
    ↓
wagmi Core
    ├─ MetaMask (EOA)
    ├─ WalletConnect (EOA)
    ├─ Coinbase Smart Wallet (Smart Account)
    ├─ Safe (Smart Account)
    └─ ... any wallet
```

**Note:** EOA vs Smart Account distinction is NOT handled here. That distinction matters in the session layer during delegation registration.

---

## Usage Pattern

### 1. Create Config

```typescript
const wagmiConfig = createWalletConfig({
  chains: [baseSepolia],
  transports: { [baseSepolia.id]: http() },
  connectors: [injected()]
})
```

### 2. Setup Watcher

```typescript
const unwatch = setupAccountWatcher(wagmiConfig, account => {
  // Handle connection state changes
})
```

### 3. Attempt Reconnect (on load)

```typescript
const result = await attemptReconnect(wagmiConfig)
if (result.reconnected) {
  // Handle reconnected wallet
}
```

### 4. Connect Wallet (user action)

```typescript
const connectors = getAvailableConnectors(wagmiConfig)
await attemptConnectWalletToChain(wagmiConfig, connectors[0].id, chainId)
```

### 5. Disconnect (user action)

```typescript
await disconnectWallet(wagmiConfig)
```

---

## EOA vs Smart Account

**Does the distinction matter here?** ❌ **NO**

The wallet layer is **wallet-type agnostic**. It:

- Connects any wallet type
- Watches all wallet types the same way
- Doesn't care if it's EOA or Smart Account

**Where does it matter?** ✅ In the **session layer** during delegation registration:

- EOAs use CallWithSignature pattern
- Smart Accounts use user operations

See [session/delegation/README.md](../session/delegation/README.md) for details.

---

## Connector Types

Common wagmi connectors:

### EOA Connectors

- **injected()** - MetaMask, Phantom, Rainbow, etc.
- **walletConnect()** - WalletConnect protocol
- **safe()** - Gnosis Safe (also acts as connector)

### Smart Account Connectors

- **coinbaseWallet()** - Coinbase Smart Wallet
- Custom connectors for other smart wallets

**All work the same** through wagmi's connector interface.

---

## Related Documentation

- [wagmi Documentation](https://wagmi.sh) - Full wagmi API reference
- [viem Documentation](https://viem.sh) - Underlying Ethereum library
- [Session Module](../session/README.md) - Where wallet type distinction matters

---

## Future Improvements

1. **Connection retry logic** - Auto-retry on transient failures
2. **Multi-chain support** - Better handling of chain switching
3. **Connection timeout** - Configurable timeouts for slow wallets
