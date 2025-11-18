# Session Module

Persistent session account creation and MUD World delegation management.

## Overview

The session module provides the core functionality for creating ephemeral session accounts that can act on behalf of users in MUD applications. This enables:

- **Persistent sessions** - Survives page refreshes via localStorage
- **Gasless transactions** - User doesn't pay gas for every action
- **Delegated execution** - Session acts with user's permissions
- **Automatic key management** - No manual private key handling

## Architecture

```
session/
├── core/                      # Session infrastructure
│   ├── signer.ts              # Session private key management
│   ├── account.ts             # ERC-4337 smart account creation
│   ├── client.ts              # MUD-extended session client
│   └── storage.ts             # localStorage persistence
│
├── delegation/                # MUD World delegation
│   ├── check.ts               # Check delegation status
│   ├── setup.ts               # Register delegation (EOA + Smart Account paths)
│   └── README.md              # Delegation architecture docs
│
└── patterns/                  # Session-specific patterns
    ├── call-with-signature.ts # EOA gasless transactions
    ├── eip712-signing.ts      # EIP-712 message signing
    └── wallet-deployment.ts   # Smart wallet factory deployment
```

## Core Concepts

### Session Key (Ephemeral Private Key)

- **What:** A randomly generated private key stored in localStorage
- **Lifespan:** Persists across page refreshes, one per user address
- **Purpose:** Owns the session smart account
- **Security:** Deliberately ephemeral - not meant for long-term value storage

### Session Account (Smart Account)

- **What:** An ERC-4337 smart account owned by the session key
- **Type:** Simple smart account (via `permissionless` library)
- **Address:** Deterministic based on session key
- **Capabilities:** Can submit user operations via bundler with paymaster

### Session Client (Extended Viem Client)

- **What:** A viem client with MUD World extensions
- **Base:** BundlerClient with SmartAccount
- **Extensions:**
  - `callFrom()` - Routes calls through `World.callFrom(userAddress, ...)`
  - `sendUserOperationFrom()` - Routes user ops through World
  - Context properties: `userAddress`, `worldAddress`, `internal_signer`

### Delegation (MUD Authorization)

- **What:** On-chain registration in World contract
- **Grants:** Session account permission to call systems as user
- **Type:** "Unlimited" delegation (full system access)
- **Table:** `UserDelegationControl[delegator][delegatee]`

## Session Lifecycle

```
1. User connects wallet
   ↓
2. getSessionSigner(userAddress)
   → Retrieves or creates session key
   → Stores in localStorage
   ↓
3. getSessionAccount({ client, userAddress })
   → Creates ERC-4337 smart account
   → Owned by session key
   ↓
4. getSessionClient({ sessionAccount, userAddress, worldAddress })
   → Creates bundler client
   → Extends with MUD World actions
   → Returns SessionClient
   ↓
5. checkDelegation({ userAddress, sessionAddress })
   → Queries World.UserDelegationControl table
   → Returns true/false
   ↓
6. setupSession({ userClient, sessionClient, worldAddress })
   → Registers delegation (EOA or Smart Account path)
   → Deploys session account if needed
   ↓
7. Session Ready ✓
   → SessionClient can call World systems
   → All transactions routed through World.callFrom()
   → Gas sponsored by paymaster
```

## Module Breakdown

### `/core` - Session Infrastructure

**Purpose:** Create and manage session accounts.

**Key Files:**

- `signer.ts` - Generate/retrieve session private keys
- `account.ts` - Create ERC-4337 smart accounts
- `client.ts` - Assemble session client with MUD extensions
- `storage.ts` - Persist session keys in localStorage

**Key Functions:**

```typescript
getSessionSigner(userAddress: Address): LocalAccount
getSessionAccount({ client, userAddress }): Promise<{ account, signer }>
getSessionClient({ sessionAccount, userAddress, worldAddress, paymasterOverride }): Promise<SessionClient>
```

**EOA/Smart Account Distinction:** ❌ No - treats all wallets the same

See: [core/ documentation](./core/)

---

### `/delegation` - MUD Delegation Registration

**Purpose:** Register delegation to authorize session account.

**Key Files:**

- `check.ts` - Check if delegation exists
- `setup.ts` - Register delegation (two paths: EOA & Smart Account)

**Key Functions:**

```typescript
checkDelegation({ client, worldAddress, userAddress, sessionAddress }): Promise<boolean>
setupSession({ client, userClient, sessionClient, worldAddress, onStatus }): Promise<void>
```

**EOA/Smart Account Distinction:** ✅ YES - Critical distinction

- **EOA Path:** CallWithSignature pattern (gasless for user)
- **Smart Account Path:** User operation via bundler (may require deployment)

See: [delegation/README.md](./delegation/README.md) for detailed explanation

---

### `/patterns` - Session-Specific Patterns

**Purpose:** Specialized transaction patterns for sessions.

**Key Files:**

- `call-with-signature.ts` - Gasless transactions for EOAs
- `eip712-signing.ts` - EIP-712 message signing
- `wallet-deployment.ts` - Deploy counterfactual smart wallets

**Key Functions:**

```typescript
callWithSignature({ userClient, sessionClient, worldAddress, systemId, callData }): Promise<Hash>
signCall({ userClient, worldAddress, systemId, callData, nonce }): Promise<Signature>
deployWalletIfNeeded(client, userAddress, factoryAddress, factoryCalldata): Promise<boolean>
```

**EOA/Smart Account Distinction:** ✅ YES

- `call-with-signature` - Primarily for EOAs
- `wallet-deployment` - Only for smart accounts

See: [patterns/ documentation](./patterns/)

---

## When EOA vs Smart Account Matters

### ❌ No Distinction Needed

**Session Creation (core/):**

- Session key generation - same for all wallets
- Session account creation - always creates smart account
- Session client assembly - same structure

**Reason:** Sessions always use smart accounts internally, regardless of user's wallet type.

### ✅ Distinction Required

**Delegation Registration (delegation/):**

- EOAs use CallWithSignature pattern
- Smart Accounts use user operations

**Reason:** EOAs can't use ERC-4337 infrastructure directly, need signature-based workaround.

**Transaction Patterns (patterns/):**

- CallWithSignature for EOA gasless transactions
- Wallet deployment for counterfactual smart accounts

---

## Usage Example

```typescript
import {
  getSessionSigner,
  getSessionAccount,
  getSessionClient,
  checkDelegation,
  setupSession
} from "./session"

// 1. Create session infrastructure
const client = createPublicClient({ chain, transport: http() })
const userAddress = "0x..." // from connected wallet

const sessionSigner = getSessionSigner(userAddress)
const { account: sessionAccount, signer } = await getSessionAccount({
  client,
  userAddress
})

const sessionClient = await getSessionClient({
  sessionAccount,
  sessionSigner: signer,
  userAddress,
  worldAddress: "0x..."
})

// 2. Check and register delegation if needed
const hasDelegation = await checkDelegation({
  client,
  worldAddress,
  userAddress,
  sessionAddress: sessionAccount.address
})

if (!hasDelegation) {
  await setupSession({
    client,
    userClient, // from wagmi/viem
    sessionClient,
    worldAddress,
    onStatus: status => console.log(status.type)
  })
}

// 3. Use session client for transactions
await sessionClient.writeContract({
  address: systemAddress,
  abi: systemAbi,
  functionName: "move",
  args: [x, y]
})
// → Automatically routed through World.callFrom(userAddress, ...)
// → Gas paid by paymaster
// → Executed as user
```

---

## Security Considerations

### Session Key Storage

- **Storage:** localStorage (browser)
- **Lifetime:** Until user clears browser data or disconnects
- **Risk:** XSS attacks could steal session key
- **Mitigation:** Session key should only have delegated permissions, not control user's main wallet

### Delegation Scope

- **Current:** "Unlimited" delegation (all systems)
- **Future:** Granular delegation (specific systems, time limits, rate limits)
- **Revocation:** User can revoke delegation via World contract

### Session Account Funding

- **Gas:** Paid by paymaster (configured in bundler)
- **Assets:** Session account should not hold user assets
- **Purpose:** Purely for signing/submitting transactions

---

## Debugging

### Check Session State

```typescript
// Session key exists?
const signer = sessionStorage.get(userAddress)
console.log("Session key:", signer?.address)

// Session account deployed?
const deployed = await sessionClient.account.isDeployed?.()
console.log("Session deployed:", deployed)

// Delegation registered?
const hasDelegation = await checkDelegation({ ... })
console.log("Has delegation:", hasDelegation)
```

### Common Issues

**Issue:** Session client calls fail with "delegation not found"

- **Check:** `checkDelegation()` returns true
- **Fix:** Call `setupSession()` to register delegation

**Issue:** Transactions revert with insufficient gas

- **Check:** Paymaster is configured correctly
- **Fix:** Verify `chain.contracts.paymaster` or `paymasterOverride`

**Issue:** Session lost after page refresh

- **Check:** localStorage has `drawbridge:session-signers` key
- **Fix:** Don't clear localStorage, or re-run session setup

---

## Related Documentation

- [Bundler Module](../bundler/README.md) - ERC-4337 infrastructure
- [Types Module](../types/README.md) - SessionClient and other types
- [MUD Documentation](https://mud.dev) - World contracts and delegation
