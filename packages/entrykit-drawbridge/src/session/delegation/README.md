# Delegation Module

MUD World delegation registration for session accounts.

## Overview

This module handles registering delegation in the MUD World contract, which authorizes the session account to call World systems on behalf of the user's wallet.

**Key Concept:** Delegation is what makes sessions work. Once registered, the session account can execute transactions on the user's behalf without requiring signatures for each transaction.

## Two Registration Paths

The delegation registration process differs significantly based on the user's wallet type:

### Path 1: EOA (Externally Owned Account)

**Used when:** `userClient.account.type !== "smart"`

**Wallets:** MetaMask, WalletConnect, Rainbow, hardware wallets, etc.

**Flow:**

```
1. User signs EIP-712 message off-chain (free, no gas)
   ↓
2. Session account submits signature + call to World
   ↓
3. World.callWithSignature() validates signature
   ↓
4. If valid, World registers delegation as the user
```

**Key Features:**

- **Gasless for user** - No gas payment required
- **Off-chain signing** - User only signs a message, not a transaction
- **CallWithSignature pattern** - See `../patterns/call-with-signature.ts`
- **EIP-712** - Structured, human-readable message signing

**Code Location:** `setup.ts` lines 182-214

**Why this approach?**
EOAs can't use paymasters directly (they're not smart accounts), so we use the CallWithSignature pattern to enable gasless transactions. The user signs a message, and the session account submits it with gas sponsorship.

---

### Path 2: Smart Account (ERC-4337 Smart Wallet)

**Used when:** `userClient.account.type === "smart"`

**Wallets:** Coinbase Smart Wallet, Safe, Argent, etc.

**Flow:**

```
1. Check if smart wallet is deployed on-chain
   ↓
2. Deploy wallet via factory if needed
   ↓
3. Remove factory data from account (wallet now deployed)
   ↓
4. Submit user operation for delegation registration
   ↓
5. Bundler processes and includes in transaction
   ↓
6. World registers delegation
```

**Key Features:**

- **Uses bundler + paymaster** - Full ERC-4337 infrastructure
- **May require deployment** - Counterfactual wallets need on-chain deployment first
- **Factory data handling** - Complex logic for CREATE2 wallets
- **User operation** - Not a standard transaction

**Code Location:** `setup.ts` lines 66-180

**Why this approach?**
Smart accounts can use user operations with paymaster sponsorship, which is the native ERC-4337 flow. However, they may be counterfactual (not yet deployed), requiring deployment before use.

---

## Files

### `check.ts`

Check if delegation already exists in the World contract.

**Function:** `checkDelegation()`

**What it does:**

- Queries `UserDelegationControl` table in World
- Checks if `[delegator: userAddress][delegatee: sessionAddress]` exists
- Verifies delegation type is "unlimited"

**Returns:** `boolean` - true if delegation registered, false otherwise

**Usage:**

```typescript
import { checkDelegation } from "./check"

const hasDelegate = await checkDelegation({
  client,
  worldAddress,
  userAddress,
  sessionAddress
})

if (!hasDelegation) {
  await setupSession(...)
}
```

### `setup.ts`

Register delegation and deploy session account.

**Function:** `setupSession()`

**What it does:**

1. Detects wallet type (EOA vs Smart Account)
2. Routes to appropriate registration path
3. Deploys session account if needed
4. Provides status updates via callback

**Parameters:**

```typescript
{
  client: Client              // Public client for queries
  userClient: ConnectedClient // User's wallet client
  sessionClient: SessionClient // Session account client
  worldAddress: Address       // MUD World contract
  registerDelegation?: boolean // Default: true
  onStatus?: (status) => void // Progress callback
}
```

**Usage:**

```typescript
import { setupSession } from "./setup"

await setupSession({
  client,
  userClient,
  sessionClient,
  worldAddress,
  onStatus: status => {
    console.log(status.type, status.message)
  }
})
```

---

## Comparison Table

| Aspect            | EOA Path                        | Smart Account Path                   |
| ----------------- | ------------------------------- | ------------------------------------ |
| **User Action**   | Sign message                    | Approve user operation               |
| **Gas Payment**   | Session account (via paymaster) | User or paymaster                    |
| **On-chain Cost** | 1 transaction                   | 1-2 transactions (deploy + register) |
| **Complexity**    | Low                             | High (deployment logic)              |
| **Speed**         | Fast (~5 sec)                   | Slower (~10-15 sec with deploy)      |
| **Pattern**       | CallWithSignature               | User Operation                       |
| **Dependencies**  | EIP-712 signing                 | Bundler, factory, paymaster          |

---

## Architecture Diagram

```
User Wallet (EOA or Smart Account)
    ↓
  setupSession()
    ↓
┌───────────────┴─────────────────┐
│                                 │
│  EOA Path              Smart Account Path
│  (182-214)             (66-180)
│      ↓                      ↓
│  signCall()           isWalletDeployed()
│  (EIP-712)                  ↓
│      ↓                 deployWallet() [if needed]
│  callWithSignature()         ↓
│      ↓                 sendUserOperation()
│  Session account             ↓
│  submits to World      Bundler + Paymaster
│                              ↓
└───────────────┬─────────────────┘
                ↓
         World Contract
                ↓
      Delegation Registered
                ↓
         Session Ready
```

---

## Common Issues

### Issue: "Smart wallet was just deployed. Please try again."

**Cause:** Smart wallet deployment and signature validation in same transaction
**Solution:** Automatic - setup.ts waits 2s after deployment for bundler cache update

### Issue: Delegation check returns false after setup

**Cause:** Transaction not yet confirmed or bundler delay
**Solution:** Check blockTag parameter (`"pending"` vs `"latest"`)

### Issue: User rejects in wallet

**Cause:** User declined signature or transaction
**Solution:** Catch error, show user-friendly message, allow retry

---

## Related Patterns

- [CallWithSignature Pattern](../patterns/call-with-signature.ts) - EOA gasless transactions
- [EIP-712 Signing](../patterns/eip712-signing.ts) - Message signature creation
- [Wallet Deployment](../patterns/wallet-deployment.ts) - Smart wallet factory deployment

---

## Testing

**EOA Testing:**

```typescript
// Use MetaMask or injected wallet
const userClient = await getConnectorClient(wagmiConfig)
expect(userClient.account.type).not.toBe("smart")
```

**Smart Account Testing:**

```typescript
// Use Coinbase Smart Wallet
const userClient = await getConnectorClient(wagmiConfig)
expect(userClient.account.type).toBe("smart")
```
