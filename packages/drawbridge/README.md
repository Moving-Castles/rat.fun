# drawbridge

Headless wallet connection and session management for MUD applications.

## Overview

A stripped-down, framework-agnostic version of `@latticexyz/entrykit` that provides:

1. **Wallet Connection** - Connect any wallet via wagmi (MetaMask, Coinbase, WalletConnect, etc.)
2. **Session Management** - Create persistent session accounts with MUD World delegation
3. **Gasless Transactions** - ERC-4337 account abstraction with paymaster support

## Installation

```bash
pnpm add drawbridge
```

## Quick Start

```typescript
import { Drawbridge } from "drawbridge"
import { baseSepolia } from "viem/chains"
import { http } from "viem"
import { injected, coinbaseWallet } from "@wagmi/connectors"

// 1. Create Drawbridge instance
const drawbridge = new Drawbridge({
  chainId: baseSepolia.id,
  chains: [baseSepolia],
  transports: {
    [baseSepolia.id]: http()
  },
  connectors: [injected(), coinbaseWallet()],
  worldAddress: "0x..." // Your MUD World contract
})

// 2. Initialize (reconnect if previously connected)
await drawbridge.initialize()

// 3. Subscribe to state changes
drawbridge.subscribe((state) => {
  console.log("Status:", state.status)
  console.log("User address:", state.userAddress)
  console.log("Session client:", state.sessionClient)
  console.log("Ready:", state.isReady)
})

// 4. Connect wallet
const connectors = drawbridge.getAvailableConnectors()
await drawbridge.connectWallet(connectors[0].id)

// 5. Setup session (if needed)
const prereqs = await drawbridge.checkPrerequisites()
if (!prereqs.isReady) {
  await drawbridge.setupSession((status) => {
    console.log("Setup:", status.type, status.message)
  })
}

// 6. Use session client for transactions
const { sessionClient } = drawbridge.getState()
if (sessionClient) {
  // Automatically routed through World.callFrom()
  // Gas paid by paymaster
  await sessionClient.writeContract({
    address: systemAddress,
    abi: systemAbi,
    functionName: "doSomething",
    args: [...]
  })
}
```

## Architecture

```
drawbridge/
├── src/
│   ├── Drawbridge.ts          # Main API - orchestrates everything
│   │
│   ├── types/               # Shared types and constants
│   │   ├── clients.ts       # SessionClient, ConnectedClient
│   │   ├── state.ts         # DrawbridgeStatus enum
│   │   ├── config.ts        # Configuration types
│   │   └── mud.ts           # MUD-specific constants
│   │
│   ├── wallet/              # Wallet connection (wagmi)
│   │   ├── connection.ts    # Wallet connect/disconnect logic
│   │   ├── watcher.ts       # Wallet state monitoring
│   │   └── config.ts        # Wagmi configuration
│   │
│   ├── session/             # Session account + delegation
│   │   ├── core/            # Session infrastructure
│   │   │   ├── signer.ts    # Session private key management
│   │   │   ├── account.ts   # ERC-4337 smart account creation
│   │   │   ├── client.ts    # MUD-extended session client
│   │   │   └── storage.ts   # localStorage persistence
│   │   │
│   │   ├── delegation/      # MUD World delegation
│   │   │   ├── check.ts     # Check delegation status
│   │   │   ├── setup.ts     # Orchestrates delegation setup
│   │   │   ├── eoa.ts       # EOA delegation registration
│   │   │   ├── smart-account.ts # Smart account delegation
│   │   │   └── shared.ts    # Shared delegation utilities
│   │   │
│   │   └── patterns/        # Session-specific patterns
│   │       ├── call-with-signature.ts # EOA gasless transactions
│   │       ├── eip712-signing.ts      # EIP-712 message signing
│   │       └── wallet-deployment.ts   # Smart wallet factory deployment
│   │
│   └── bundler/             # ERC-4337 infrastructure
│       ├── client.ts        # Bundler client creation
│       ├── transport.ts     # Bundler RPC transport
│       └── paymaster.ts     # Paymaster configuration
```

## Key Concepts

### Session Account

An ephemeral ERC-4337 smart account that acts on behalf of the user. The session account:

- Owned by a private key stored in localStorage
- Persists across page refreshes
- Can execute transactions via delegation
- Gas paid by paymaster (if configured)

### Delegation

Authorization in the MUD World contract that allows the session account to call systems on behalf of the user. Two registration paths:

- **EOA:** CallWithSignature pattern (user signs message, session submits)
- **Smart Account:** User operation via bundler

### Bundler

ERC-4337 RPC endpoint that processes user operations from smart accounts. Required for all session accounts.

### Paymaster (Optional)

Sponsors gas fees for user operations, enabling gasless transactions.

## Configuration

### Basic Configuration

```typescript
new Drawbridge({
  chainId: 8453, // Base mainnet
  chains: [base],
  transports: {
    8453: http("https://mainnet.base.org")
  },
  connectors: [injected()],
  worldAddress: "0x..."
})
```

### With Bundler + Paymaster

```typescript
import { defineChain } from "viem"

const myChain = defineChain({
  id: 8453,
  name: "Base",
  rpcUrls: {
    default: { http: ["https://mainnet.base.org"] },
    bundler: { http: ["https://bundler.base.org/rpc"] } // Required
  },
  contracts: {
    paymaster: {
      address: "0x..." // Optional - for gas sponsorship
    }
  }
})

new Drawbridge({
  chainId: myChain.id,
  chains: [myChain],
  transports: { [myChain.id]: http() },
  connectors: [injected()],
  worldAddress: "0x..."
})
```

### Wallet-Only Mode (No Sessions)

```typescript
new Drawbridge({
  chainId: 8453,
  chains: [base],
  transports: { 8453: http() },
  connectors: [injected()],
  skipSessionSetup: true // No session account, no delegation
})
```

## API Reference

### `Drawbridge`

#### Constructor

```typescript
new Drawbridge(config: DrawbridgeConfig)
```

#### Methods

- `initialize(): Promise<void>` - Initialize and reconnect
- `subscribe(listener): Unsubscribe` - React to state changes
- `getState(): DrawbridgeState` - Get current state snapshot
- `getAvailableConnectors(): ConnectorInfo[]` - List available wallets
- `connectWallet(connectorId): Promise<void>` - Connect to wallet
- `disconnectWallet(): Promise<void>` - Disconnect wallet
- `checkPrerequisites(): Promise<PrerequisiteStatus>` - Check if session ready
- `setupSession(onStatus?): Promise<void>` - Register delegation
- `destroy(): Promise<void>` - Clean up instance
- `clearStorage(): void` - Remove session keys

#### State

```typescript
type DrawbridgeState = {
  status: DrawbridgeStatus // Current status
  sessionClient: SessionClient | null // MUD-enabled client
  userAddress: Address | null // User's wallet address
  sessionAddress: Address | null // Session account address
  isReady: boolean // Delegation registered
}
```

#### Status Flow

```
UNINITIALIZED → DISCONNECTED → CONNECTING → CONNECTED
  → SETTING_UP_SESSION → READY
```

## EOA vs Smart Account

Drawbridge handles both wallet types, but the delegation registration differs:

### EOA Wallets (MetaMask, etc.)

- User signs an EIP-712 message (free)
- Session account submits to World.callWithSignature() or World.callWithSignatureAlt()
- Gasless for user

### Smart Accounts (Coinbase Smart Wallet, etc.)

- May require wallet deployment first
- User approves user operation via bundler
- Can be sponsored by paymaster

See [delegation documentation](./src/session/delegation/README.md) for details.

## Module Documentation

- [Wallet Module](./src/wallet/README.md) - Wallet connection and state management
- [Session Module](./src/session/README.md) - Session account creation and delegation
- [Delegation Module](./src/session/delegation/README.md) - EOA vs Smart Account paths
- [Bundler Module](./src/bundler/README.md) - ERC-4337 infrastructure
- [Types Module](./src/types/README.md) - Type system overview

## Development

### Build

```bash
pnpm build
```

### Type Check

```bash
pnpm test
```

## License

MIT

## Related Projects

- [@latticexyz/entrykit](https://github.com/latticexyz/mud/tree/main/packages/entrykit) - Full-featured version with UI
- [MUD](https://mud.dev) - Onchain application framework
- [viem](https://viem.sh) - Ethereum TypeScript library
- [wagmi](https://wagmi.sh) - React hooks for Ethereum
