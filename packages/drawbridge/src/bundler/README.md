# Bundler Module

ERC-4337 account abstraction infrastructure for session accounts.

## Overview

This module provides the bundler client and paymaster configuration needed for session accounts to submit user operations. All session accounts in drawbridge are ERC-4337 smart accounts, which require bundler infrastructure to function.

## What is a Bundler?

A **bundler** is a specialized RPC endpoint that:

- Accepts ERC-4337 user operations (UserOps)
- Validates and simulates operations
- Bundles multiple operations together
- Submits them to the EntryPoint contract on-chain

Unlike regular transactions, user operations from smart accounts must go through a bundler.

## What is a Paymaster?

A **paymaster** is an optional ERC-4337 contract that:

- Sponsors gas fees for user operations
- Enables gasless transactions for end users
- Can implement custom sponsorship logic (spending limits, allowlists, etc.)

## Files

### `client.ts`

Creates a bundler client for submitting user operations.

**Features:**

- Automatic paymaster configuration (from chain config or override)
- Custom fee estimation for local development (Anvil)
- Default polling configuration

**Usage:**

```typescript
import { createBundlerClient } from "./client"

const bundlerClient = createBundlerClient({
  transport: getBundlerTransport(chain),
  client,
  account: sessionAccount,
  paymaster: paymasterClient // optional
})
```

### `transport.ts`

Creates the transport for connecting to a bundler RPC endpoint.

**Configuration:**
Reads from chain config: `chain.rpcUrls.bundler.http[0]`

**Usage:**

```typescript
import { getBundlerTransport } from "./transport"

const transport = getBundlerTransport(chain)
```

### `paymaster.ts`

Configures paymaster for gas sponsorship.

**Types:**

- **Simple Paymaster**: Just an address, returns static paymaster data
- **Custom Paymaster**: Full PaymasterClient with dynamic logic (e.g., Coinbase, Pimlico)

**Priority:**

1. Custom paymaster client (passed as override)
2. Simple paymaster address (from `chain.contracts.paymaster`)
3. `undefined` (user pays own gas)

**Usage:**

```typescript
import { getPaymaster } from "./paymaster"

const paymaster = getPaymaster(chain, customPaymasterClient)
// Returns Paymaster | undefined
```

## Session Account Requirements

Every session account **must** have:

- Bundler transport configured
- Paymaster is optional

The bundler is required because session accounts are ERC-4337 smart accounts. Without a bundler, they cannot submit transactions.

## Configuration Examples

### Chain Config with Bundler + Paymaster

```typescript
const myChain = defineChain({
  id: 8453,
  name: "Base",
  rpcUrls: {
    default: {
      http: ["https://mainnet.base.org"]
    },
    bundler: {
      http: ["https://bundler.base.org/rpc"] // Required
    }
  },
  contracts: {
    paymaster: {
      address: "0x..." // Optional
    }
  }
})
```

### Custom Paymaster Override

```typescript
import { createPaymasterClient } from "viem/account-abstraction"

const customPaymaster = createPaymasterClient({
  transport: http("https://paymaster.example.com")
})

const drawbridge = new Drawbridge({
  chains: [myChain],
  paymasterClient: customPaymaster // Override
})
```

## Architecture

```
Session Account (ERC-4337 Smart Account)
    ↓
Bundler Client (viem BundlerClient)
    ↓
Bundler Transport (HTTP to bundler RPC)
    ↓
Paymaster (optional gas sponsorship)
    ↓
EntryPoint Contract (on-chain)
```

## Related Documentation

- [Session Module](../session/README.md) - How sessions use bundler
- [ERC-4337 Specification](https://eips.ethereum.org/EIPS/eip-4337)
- [Viem Account Abstraction Docs](https://viem.sh/account-abstraction)
