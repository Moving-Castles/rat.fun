# EntryKit Fork Feasibility Analysis

**Analysis Date**: 2025-11-10
**Target**: Lean, framework-agnostic TypeScript module for MUD integration
**Network**: Base (with Coinbase Paymaster)
**Framework**: Svelte Kit (but aiming for vanilla JS)

---

## Executive Summary

**Overall Feasibility: HIGH** ✅

**Estimated Effort**: 1-2 weeks for experienced developer
**Risk Level**: MEDIUM (mainly React removal)
**Benefit Level**: HIGH (60% code reduction, full control, framework-agnostic)

**Code Reduction**: 122 files → ~35-40 files (70% reduction)
**Dependency Reduction**: 13 external deps → ~5 external deps

---

## Requirements & Feasibility Assessment

### 1. Remove All UI → Pure TypeScript Module

**Feasibility: VERY HIGH** ✅✅✅
**Effort: LOW (1-2 days)**
**Risk: NONE**

#### Files to Delete (~50 files, ~40% of codebase)

```
ui/
├── Button.tsx
├── Modal.tsx
├── Input.tsx
├── Balance.tsx
├── TruncatedHex.tsx
├── Slot.tsx
├── Shadow.tsx
└── FrameProvider.tsx

icons/ (18 files)
├── ArrowLeftIcon.tsx
├── ChevronDownIcon.tsx
├── CloseIcon.tsx
├── CopyIcon.tsx
├── EthIcon.tsx
└── [13 more icons...]

errors/ (UI components only)
├── ErrorFallback.tsx          # DELETE
├── ErrorOverlay.tsx           # DELETE
├── ErrorsOverlay.tsx          # DELETE
└── store.ts                   # KEEP (convert to vanilla)

AccountButton.tsx              # DELETE
AccountModal.tsx               # DELETE
AccountModalContent.tsx        # DELETE
ConnectWallet.tsx              # DELETE

onboarding/
├── ConnectedSteps.tsx         # DELETE
├── Wallet.tsx                 # DELETE
├── GasBalance.tsx             # DELETE
├── Session.tsx                # DELETE
├── deposit/ (3 UI files)      # DELETE (also part of bridge removal)
└── quarry/ (6 UI files)       # DELETE (also part of Quarry removal)

AppInfo.tsx                    # DELETE
```

#### Dependencies to Remove

```json
{
  "@radix-ui/react-dialog": "^1.0.5", // DELETE
  "@radix-ui/react-select": "^1.0.5", // DELETE
  "connectkit": "^1.9.0", // DELETE
  "react-error-boundary": "5.0.0", // DELETE
  "react-merge-refs": "^2.1.1", // DELETE
  "tailwind-merge": "^1.12.0", // DELETE
  "usehooks-ts": "^3.1.0", // DELETE

  // Keep for bundler/transport configuration:
  "@walletconnect/ethereum-provider": "2.20.2" // MAYBE KEEP
}
```

**Note on WalletConnect**: Keep only if you need WalletConnect connector. If your Svelte app handles all wallet connections, you can remove this too.

#### Why Easy

UI is completely decoupled from core logic. No business logic in components - they're just wrappers around hooks that call core functions. Safe to delete without affecting functionality.

---

### 2. Remove React & Replace Zustand

**Feasibility: HIGH** ✅✅
**Effort: MEDIUM (3-4 days)**
**Risk: MEDIUM**

#### React Dependencies to Remove

**Current React usage:**

- `wagmi` hooks (`useClient`, `useAccount`, `useConnections`, `useConfig`)
- `@tanstack/react-query` (`useQuery`, `useMutation`, `useQueryClient`)
- React component patterns throughout

**Dependencies to remove:**

```json
{
  "react": "18.2.0", // DELETE (currently peer dep)
  "react-dom": "18.2.0", // DELETE (currently peer dep)
  "@tanstack/react-query": "^5.56.2", // DELETE (currently peer dep)
  "wagmi": "2.16.5" // DELETE (currently peer dep)
}
```

**Keep these:**

```json
{
  "viem": "2.35.1" // KEEP - core Ethereum library
  // All other non-React deps
}
```

#### Hook Conversion Examples

##### Example 1: useDelegation → checkDelegation

**BEFORE (React hook):**

```typescript
// onboarding/useDelegation.ts
import { useQuery } from "@tanstack/react-query"
import { useEntryKitConfig } from "../EntryKitConfigProvider"

export function useDelegation({ userAddress, sessionAddress }) {
  const { worldAddress } = useEntryKitConfig()
  const client = useClient()

  return useQuery({
    queryKey: ["getDelegation", userAddress, sessionAddress],
    queryFn: () =>
      getDelegation({
        client: client!,
        worldAddress,
        userAddress,
        sessionAddress,
        blockTag: "pending"
      }),
    enabled: !!client && !!userAddress && !!sessionAddress
  })
}
```

**AFTER (Plain async function):**

```typescript
// core/delegation.ts
import { Client, Address } from "viem"
import { getRecord } from "@latticexyz/store/internal"
import { unlimitedDelegationControlId, worldTables } from "./common"

export type CheckDelegationParams = {
  client: Client
  worldAddress: Address
  userAddress: Address
  sessionAddress: Address
  blockTag?: "pending" | "latest"
}

export async function checkDelegation({
  client,
  worldAddress,
  userAddress,
  sessionAddress,
  blockTag = "pending"
}: CheckDelegationParams): Promise<boolean> {
  const record = await getRecord(client, {
    address: worldAddress,
    table: worldTables.UserDelegationControl,
    key: { delegator: userAddress, delegatee: sessionAddress },
    blockTag
  })
  return record.delegationControlId === unlimitedDelegationControlId
}
```

##### Example 2: useSetupSession → setupSession

**BEFORE (React hook with mutation):**

```typescript
// onboarding/useSetupSession.ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useSetupSession({ connector, userClient }) {
  const queryClient = useQueryClient();
  const { chainId, worldAddress } = useEntryKitConfig();
  const client = useClient({ chainId });

  return useMutation({
    mutationKey: ["setupSession", ...],
    mutationFn: async ({ sessionClient, registerDelegation }) => {
      // Setup logic
      await queryClient.invalidateQueries(...);
    },
  });
}
```

**AFTER (Plain async function):**

```typescript
// core/setup.ts
export type SetupSessionParams = {
  client: Client
  userClient: Client
  sessionClient: Client
  worldAddress: Address
  registerDelegation?: boolean
}

export async function setupSession({
  client,
  userClient,
  sessionClient,
  worldAddress,
  registerDelegation = true
}: SetupSessionParams): Promise<void> {
  const sessionAddress = sessionClient.account.address
  const calls = []

  if (registerDelegation) {
    calls.push(
      defineCall({
        to: worldAddress,
        abi: worldAbi,
        functionName: "registerDelegation",
        args: [sessionAddress, unlimitedDelegationControlId, "0x"]
      })
    )
  }

  // Execute setup
  if (userClient.account.type === "smart") {
    const hash = await sendUserOperation(userClient, { calls })
    await waitForUserOperationReceipt(userClient, { hash })
  } else {
    // EOA flow with callWithSignature
    for (const call of calls) {
      const tx = await callWithSignature({
        client,
        userClient,
        sessionClient,
        worldAddress: call.to,
        systemId: getSystemId(call),
        callData: encodeFunctionData(call)
      })
      await waitForTransactionReceipt(client, { hash: tx })
    }
  }

  // Deploy session account if needed
  if (!(await sessionClient.account.isDeployed?.())) {
    const hash = await sendUserOperation(sessionClient, {
      calls: [{ to: zeroAddress }]
    })
    await waitForUserOperationReceipt(sessionClient, { hash })
  }
}
```

#### Files to Convert (~15 files)

```
useSessionAccount.ts          → getOrCreateSessionAccount()
useDelegation.ts              → checkDelegation()
useSetupSession.ts            → setupSession()
usePrerequisites.ts           → checkPrerequisites()
useFunds.ts                   → checkFunds() / getFunds()
useCallWithSignatureNonce.ts  → getCallWithSignatureNonce()
useSessionClientReady.ts      → getSessionClient() / isSessionReady()
useAccountModal.ts            → DELETE (UI only)
useENS.ts                     → resolveENS() (or DELETE if not needed)
useTheme.ts                   → DELETE (UI only)

EntryKitConfigProvider.tsx    → Pass config explicitly to functions
```

#### Zustand Replacement

**Current Zustand Usage (Minimal):**

```typescript
// store.ts
import { createStore } from "zustand/vanilla"
import { persist } from "zustand/middleware"

type State = {
  signers: Record<Address, Hex> // Session private keys
}

export const store = createStore<State>()(
  persist(() => ({ signers: {} }), { name: "entrykit:session-signer" })
)

// Usage
store.getState().signers[label]
store.setState(state => ({
  signers: { ...state.signers, [label]: privateKey }
}))
```

**Replacement: Plain localStorage + Memory Cache**

```typescript
// storage.ts
type SessionStore = {
  signers: Record<string, string> // lowercase address → private key
}

class SessionStorage {
  private cache: SessionStore
  private readonly STORAGE_KEY = "entrykit:session-signers"

  constructor() {
    this.cache = this.load()
  }

  private load(): SessionStore {
    if (typeof localStorage === "undefined") {
      return { signers: {} }
    }

    const stored = localStorage.getItem(this.STORAGE_KEY)
    if (!stored) {
      return { signers: {} }
    }

    try {
      return JSON.parse(stored)
    } catch {
      return { signers: {} }
    }
  }

  private save(): void {
    if (typeof localStorage === "undefined") return
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache))
  }

  getSigner(address: Address): Hex | undefined {
    const key = address.toLowerCase()
    return this.cache.signers[key] as Hex | undefined
  }

  setSigner(address: Address, privateKey: Hex): void {
    const key = address.toLowerCase()
    this.cache.signers[key] = privateKey
    this.save()
  }

  removeSigner(address: Address): void {
    const key = address.toLowerCase()
    delete this.cache.signers[key]
    this.save()
  }

  clear(): void {
    this.cache = { signers: {} }
    this.save()
  }
}

export const sessionStorage = new SessionStorage()
```

**Update getSessionSigner.ts:**

```typescript
// getSessionSigner.ts
import { Address, isHex, Hex } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { sessionStorage } from "./storage"

export function getSessionSigner(userAddress: Address) {
  let privateKey = sessionStorage.getSigner(userAddress)

  if (!privateKey) {
    // Attempt to migrate from old AccountKit storage
    const deprecatedKey = localStorage
      .getItem(`mud:appSigner:privateKey:${userAddress.toLowerCase()}`)
      ?.replace(/^"(.*)"$/, "$1")

    privateKey = (isHex(deprecatedKey) ? deprecatedKey : generatePrivateKey()) as Hex
    sessionStorage.setSigner(userAddress, privateKey)
  }

  return privateKeyToAccount(privateKey)
}
```

**Why Feasible:**

- Zustand only used for simple key-value storage
- No complex reactive state
- No subscriptions or computed values
- Easy to replace with localStorage + cache

**Dependencies to remove:**

```json
{
  "zustand": "^4.5.2" // DELETE
}
```

---

### 3. Remove Lattice Infrastructure

**Feasibility: VERY HIGH** ✅✅✅
**Effort: LOW (1 day)**
**Risk: NONE**

#### Wiresaw (Fast UserOps)

**Current usage:**

```typescript
// Various files
import { wiresaw } from "@latticexyz/common/internal"

// Used for fast user operation submission on compatible chains
```

**Action:** Simply delete these imports. Wiresaw is an optional optimization for faster confirmation on Lattice chains. Your app will fall back to standard bundler submission.

**Impact:** None - standard bundler works fine on Base.

---

#### Chain-Specific Fee Caching

**File:** `createBundlerClient.ts`

**Current code:**

```typescript
// createBundlerClient.ts:46-63
function createFeeEstimator(client: Client) {
  if (!client.chain) return

  // Anvil hardcoded fees
  if (client.chain.id === 31337) {
    return async () => ({
      maxFeePerGas: 100_000n,
      maxPriorityFeePerGas: 0n
    })
  }

  // Redstone, Garnet, Pyrope fee caching
  if ([690, 17069, 695569].includes(client.chain.id)) {
    return cachedFeesPerGas(client)
  }
}
```

**After removal:**

```typescript
function createFeeEstimator(client: Client) {
  if (!client.chain) return

  // Keep Anvil hardcoding if you test locally, otherwise remove
  if (client.chain.id === 31337) {
    return async () => ({
      maxFeePerGas: 100_000n,
      maxPriorityFeePerGas: 0n
    })
  }

  // Falls back to viem's default fee estimation
  // Works fine for Base
}
```

**Files to delete:**

```
actions/cachedFeesPerGas.ts
```

**Impact:** None for Base. Viem's default fee estimation works well on Base.

---

#### Relay Chain Data

**File:** `data/relayChains.json`

**Current usage:** Cross-chain bridging UI (which you're removing).

**Action:** Delete file.

**Files to delete:**

```
data/relayChains.json
scripts/get-relay-chains.ts
```

---

### 4. Remove Internal Lattice Utilities

**Feasibility: MEDIUM-HIGH** ✅✅
**Effort: MEDIUM (2-3 days)**
**Risk: LOW-MEDIUM**

#### Can Remove (Replace with viem or simple implementations)

##### Common Utilities

```typescript
// REMOVE: @latticexyz/common utilities
import { writeContract } from "@latticexyz/common"
// REPLACE WITH:
import { writeContract } from "viem/actions"

// REMOVE: Simple utilities
import { wait } from "@latticexyz/common/utils"
// REPLACE WITH:
const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

import { isNotNull } from "@latticexyz/common/utils"
// REPLACE WITH:
const isNotNull = <T>(x: T | null | undefined): x is T => x != null

// REMOVE: Error utilities
import { findCause } from "@latticexyz/common"
// REPLACE WITH: Use viem's built-in error handling
import { BaseError } from "viem"
// Or implement simple version:
function findCause<T extends Error>(error: Error, type: new (...args: any[]) => T): T | undefined {
  let e: Error | undefined = error
  while (e) {
    if (e instanceof type) return e
    e = (e as any).cause
  }
}
```

##### Deployment Utilities

If you deploy AA infrastructure differently (or don't deploy it at all), remove:

```typescript
// REMOVE: Deployment utilities
import {
  ensureContractsDeployed,
  ensureDeployer,
  getContractAddress,
  waitForTransactions
} from "@latticexyz/common/internal"

// Either implement yourself or delete bin/deploy.ts entirely
```

**Files to modify:**

- Remove imports from all files
- Replace with viem equivalents or simple implementations

---

#### MUST Keep (Core MUD Integration)

**These are essential for MUD - DO NOT REMOVE:**

##### Store Table Reading

```typescript
// KEEP: Required for reading MUD tables
import { getRecord } from "@latticexyz/store/internal"

// Used for:
// - Checking delegations (UserDelegationControl table)
// - Reading CallWithSignature nonces
// - Paymaster state (if using MUD-based paymaster)
```

**Why essential:** MUD World stores all state in tables. Without this, you can't read delegation status, nonces, or any World state.

##### World Integration

```typescript
// KEEP: Core of EntryKit's value proposition
import { callFrom, sendUserOperationFrom } from "@latticexyz/world/internal"

// These extend the session client with:
// - Automatic routing through World.callFrom()
// - Delegation validation
// - Proper delegator context
```

**Why essential:** This IS the MUD integration. Without this, you're just doing generic AA, not MUD-specific session accounts.

##### Resource ID Utilities

```typescript
// KEEP: Lightweight, essential for MUD resource IDs
import { resourceToHex, hexToResource } from "@latticexyz/common"

// Used for:
// - System IDs (resourceToHex({ type: "system", namespace, name }))
// - Delegation control IDs
// - Table IDs
```

**Why essential:** MUD uses resource IDs everywhere. These are tiny utilities (just bit manipulation), no reason to reimplement.

##### World Configs and ABIs

```typescript
// KEEP: Required for World interaction
import worldConfig from "@latticexyz/world/mud.config"
import IBaseWorldAbi from "@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json"
import CallWithSignatureAbi from "@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json"

// Used for:
// - World table definitions
// - World function calls
// - CallWithSignature integration
```

**Why essential:** You need these ABIs to interact with World and its modules.

---

#### Remaining Dependencies After Cleanup

```json
{
  // MUD Core (REQUIRED)
  "@latticexyz/common": "workspace:*", // Resource utils (resourceToHex, etc)
  "@latticexyz/store": "workspace:*", // getRecord for table reading
  "@latticexyz/world": "workspace:*", // callFrom, configs, ABIs
  "@latticexyz/world-module-callwithsignature": "workspace:*", // If supporting EOAs

  // ERC-4337 Standard
  "@account-abstraction/contracts": "^0.7.0",
  "permissionless": "0.2.30",

  // Ethereum Core
  "viem": "2.35.1",

  // Utilities
  "debug": "^4.3.4",
  "dotenv": "^16.0.3" // Only if keeping bin/deploy.ts
}
```

**Total: ~5-6 core dependencies** (down from 13)

---

### 5. Remove Cross-Chain Bridging

**Feasibility: VERY HIGH** ✅✅✅
**Effort: LOW (1 hour)**
**Risk: NONE**

#### Files to Delete

```
onboarding/deposit/
├── ChainSelect.tsx           # DELETE
├── DepositForm.tsx           # DELETE
├── BridgeStatus.tsx          # DELETE
└── RelayProvider.tsx         # DELETE

data/relayChains.json         # DELETE (already covered above)
scripts/get-relay-chains.ts   # DELETE
```

#### Dependencies to Remove

```json
{
  "@reservoir0x/relay-sdk": "^1.7.0" // DELETE
}
```

#### Logic to Remove

**In onboarding flow:**

- Remove deposit step entirely
- Remove bridge status tracking
- Remove chain selection for deposits

**Users will handle deposits themselves:**

- Bridge to Base via native Base bridge
- Use Coinbase wallet's built-in bridging
- Or fund directly on Base

**Why easy:** Bridging is completely isolated feature. No core logic depends on it.

---

### 6. Replace Quarry with Coinbase Paymaster

**Feasibility: HIGH** ✅✅
**Effort: LOW-MEDIUM (2-3 days)**
**Risk: LOW**

#### Research Required

**Critical unknown:** Coinbase's paymaster implementation on Base.

**Possible architectures:**

**Option A: Standard ERC-4337 (Most likely)**

```typescript
// Simple sponsorship, no registration required
paymaster: {
  getPaymasterData: async (userOp) => ({
    paymaster: "0x...COINBASE_PAYMASTER_ADDRESS",
    paymasterData: "0x",
  }),
}
```

**Option B: API Key Based**

```typescript
// Coinbase Developer Platform (CDP)
paymaster: {
  getPaymasterData: async (userOp) => {
    const response = await fetch("https://api.coinbase.com/paymaster/sponsor", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.COINBASE_API_KEY}`,
      },
      body: JSON.stringify(userOp),
    });
    return response.json();
  },
}
```

**Option C: Smart Contract Registration**

```typescript
// Similar to Quarry, requires registration
// Need to call: paymaster.registerUser(address)
```

**Action items:**

1. Check Coinbase paymaster docs: https://docs.cdp.coinbase.com/
2. Check Base docs: https://docs.base.org/
3. Join Coinbase Developer Discord
4. Test on Base Sepolia testnet first

---

#### Quarry Files to Remove (~15 files)

```
quarry/
├── common.ts                 # DELETE (Quarry config/ABIs)
├── getAllowance.ts           # DELETE
├── getBalance.ts             # DELETE
├── requestAllowance.ts       # DELETE
├── debug.ts                  # DELETE
└── transports/
    └── quarrySponsor.ts      # DELETE

onboarding/quarry/            # DELETE (all UI files - already removed)
onboarding/useSetBalance.ts   # DELETE (Quarry-specific)

getPaymaster.ts               # REPLACE (simplify)
```

---

#### Simplified Paymaster Integration

**New file:** `paymaster.ts`

```typescript
// paymaster.ts
import { Chain, Hex } from "viem"

export type PaymasterConfig = {
  address: Hex
  type: "coinbase"
  apiKey?: string // If needed
}

export function getPaymaster(chain: Chain): PaymasterConfig | undefined {
  // Base mainnet
  if (chain.id === 8453) {
    return {
      type: "coinbase",
      address: "0x..." as Hex // TODO: Replace with actual address
    }
  }

  // Base Sepolia (testnet)
  if (chain.id === 84532) {
    return {
      type: "coinbase",
      address: "0x..." as Hex // TODO: Replace with actual address
    }
  }

  // Local Anvil (if you deploy simple paymaster)
  if (chain.id === 31337) {
    return {
      type: "coinbase", // Or "simple"
      address: "0x..." as Hex
    }
  }

  return undefined
}
```

**Update:** `createBundlerClient.ts`

```typescript
// createBundlerClient.ts
import { getPaymaster } from "./paymaster"

export function createBundlerClient(config) {
  const chain = config.chain ?? config.client?.chain
  const paymaster = chain ? getPaymaster(chain) : undefined

  return viem_createBundlerClient({
    ...defaultClientConfig,
    paymaster: paymaster
      ? {
          getPaymasterData: async userOp => {
            // Simple case: just return paymaster address
            return {
              paymaster: paymaster.address,
              paymasterData: "0x"
            }

            // If Coinbase requires API call:
            // return await getCoinbasePaymasterData(userOp, paymaster);
          }
        }
      : undefined,
    userOperation: {
      estimateFeesPerGas: createFeeEstimator(config.client)
    },
    ...config
  })
}

// If Coinbase requires API calls:
async function getCoinbasePaymasterData(userOp, paymaster) {
  const response = await fetch("https://api.coinbase.com/...", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${paymaster.apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(userOp)
  })

  if (!response.ok) {
    throw new Error(`Coinbase paymaster error: ${response.statusText}`)
  }

  return response.json()
}
```

---

#### Update Session Setup

**Remove Quarry-specific registration:**

```typescript
// setupSession.ts (before)
if (registerSpender && paymaster?.type === "quarry") {
  calls.push(
    defineCall({
      to: paymaster.address,
      abi: paymasterAbi,
      functionName: "registerSpender", // REMOVE
      args: [sessionAddress]
    })
  )
}

// setupSession.ts (after)
// No paymaster registration needed for Coinbase
// (unless research reveals it's required)
```

**Simplified prerequisites:**

```typescript
// checkPrerequisites.ts (before)
- Check Quarry balance
- Check Quarry allowance
- Check spender registration

// checkPrerequisites.ts (after)
// Paymaster checks might not be needed
// Coinbase likely handles sponsorship automatically
// Just check:
- Session account has delegation
- Session account is deployed
```

---

#### Testing on Base

**Step 1: Get Coinbase paymaster address**

- Check Coinbase docs
- Or deploy on Base Sepolia and check transactions

**Step 2: Test user operation sponsorship**

```typescript
// Test script
const sessionClient = await getSessionClient({...});

const hash = await sessionClient.sendUserOperation({
  calls: [{ to: zeroAddress, value: 0n }],
});

console.log("UserOp hash:", hash);

const receipt = await sessionClient.waitForUserOperationReceipt({ hash });
console.log("Sponsored?", receipt.success);
```

**Step 3: Monitor gas payments**

- Check who paid gas in receipt
- Verify paymaster was used
- Ensure no errors

---

## Resulting Architecture

### Final File Structure (~35-40 files)

```
core/
├── config.ts                   # Configuration types & defaults
├── types.ts                    # Shared TypeScript types
├── storage.ts                  # Session storage (replacing zustand)
├── common.ts                   # MUD World constants, ABIs
│
├── session.ts                  # Session account management
│   ├── getSessionSigner()
│   ├── getSessionAccount()
│   └── getSessionClient()
│
├── delegation.ts               # Delegation management
│   ├── checkDelegation()
│   └── registerDelegation()
│
├── setup.ts                    # Session setup flow
│   ├── setupSession()
│   └── checkPrerequisites()
│
├── paymaster.ts                # Paymaster configuration
│   └── getPaymaster()
│
├── bundler.ts                  # Bundler client
│   ├── createBundlerClient()
│   └── getBundlerTransport()
│
└── utils/
    ├── callWithSignature.ts    # EOA signature flow (if needed)
    ├── signCall.ts
    ├── defineCall.ts
    ├── formatBalance.ts        # Formatting utilities
    ├── debug.ts                # Debug logging
    └── errors.ts               # Error types/handling

bin/
└── deploy.ts                   # Optional: Deploy AA contracts

exports/
├── index.ts                    # Main export
└── internal.ts                 # Internal/advanced exports (optional)
```

**Total: ~20-25 core files** (including utilities)

---

### Clean TypeScript API

```typescript
// index.ts - Main export
export class EntryKitCore {
  private config: EntryKitConfig
  private sessionClient: SessionClient | null = null
  private _userAddress: Address | null = null
  private _sessionAddress: Address | null = null

  constructor(config: EntryKitConfig) {
    this.config = config
  }

  /**
   * Connect with user's wallet client
   * Creates session account and session client
   */
  async connect(client: Client): Promise<{
    userAddress: Address
    sessionAddress: Address
  }> {
    const userAddress = client.account.address
    this._userAddress = userAddress

    // Get or create session signer
    const signer = getSessionSigner(userAddress)

    // Create session smart account
    const { account } = await getSessionAccount({
      client,
      userAddress
    })
    this._sessionAddress = account.address

    // Create session client with MUD extensions
    this.sessionClient = await getSessionClient({
      userAddress,
      sessionAccount: account,
      sessionSigner: signer,
      worldAddress: this.config.worldAddress
    })

    return {
      userAddress,
      sessionAddress: account.address
    }
  }

  /**
   * Check if session is ready to use
   * Returns detailed prerequisite status
   */
  async checkPrerequisites(): Promise<PrerequisiteStatus> {
    if (!this.sessionClient) {
      throw new Error("Not connected. Call connect() first.")
    }

    const hasDelegation = await checkDelegation({
      client: this.getPublicClient(),
      worldAddress: this.config.worldAddress,
      userAddress: this.sessionClient.userAddress,
      sessionAddress: this.sessionClient.account.address
    })

    const isDeployed = await this.sessionClient.account.isDeployed?.()

    return {
      hasDelegation,
      isSessionDeployed: !!isDeployed,
      isReady: hasDelegation && !!isDeployed
    }
  }

  /**
   * Setup session (register delegation, deploy account)
   */
  async setupSession(options?: SetupOptions): Promise<void> {
    if (!this.sessionClient) {
      throw new Error("Not connected. Call connect() first.")
    }

    await setupSession({
      client: this.getPublicClient(),
      userClient: options?.userClient, // For signing delegation
      sessionClient: this.sessionClient,
      worldAddress: this.config.worldAddress,
      registerDelegation: options?.registerDelegation ?? true
    })
  }

  /**
   * Get ready session client for application use
   */
  getSessionClient(): SessionClient {
    if (!this.sessionClient) {
      throw new Error("Session not ready. Call connect() and setupSession() first.")
    }
    return this.sessionClient
  }

  /**
   * Get current user address
   */
  get userAddress(): Address | null {
    return this._userAddress
  }

  /**
   * Get session account address
   */
  get sessionAddress(): Address | null {
    return this._sessionAddress
  }

  /**
   * Disconnect and clear session
   */
  disconnect(): void {
    this.sessionClient = null
    this._userAddress = null
    this._sessionAddress = null
  }

  /**
   * Clear stored session keys
   */
  clearSessionStorage(): void {
    if (this._userAddress) {
      sessionStorage.removeSigner(this._userAddress)
    }
  }

  // Private helpers
  private getPublicClient(): Client {
    if (!this.sessionClient) {
      throw new Error("Not connected")
    }
    return this.sessionClient.client
  }
}

// Types
export type EntryKitConfig = {
  chainId: number
  worldAddress: Address
  paymasterAddress?: Address // Optional override
}

export type PrerequisiteStatus = {
  hasDelegation: boolean
  isSessionDeployed: boolean
  isReady: boolean
}

export type SetupOptions = {
  userClient?: Client // Client with user's account
  registerDelegation?: boolean
}

// Re-export important types from viem
export type { SessionClient, ConnectedClient } from "./core/types"
export type { Address, Hex, Client } from "viem"
```

---

### Usage Example (Svelte)

```typescript
// lib/entrykit.ts
import { EntryKitCore } from "@your-org/entrykit-core"
import { createPublicClient, http } from "viem"
import { base } from "viem/chains"

export const entrykit = new EntryKitCore({
  chainId: base.id,
  worldAddress: "0x..."
})

// You'll likely create stores for Svelte
import { writable, derived } from "svelte/store"

export const userAddress = writable<Address | null>(null)
export const sessionAddress = writable<Address | null>(null)
export const isSessionReady = writable(false)

// lib/wallet.ts - Your wallet connection logic
export async function connectWallet() {
  // Your existing wallet connection
  const walletClient = await getWalletClient()

  // Connect EntryKit
  const { userAddress: user, sessionAddress: session } = await entrykit.connect(walletClient)

  userAddress.set(user)
  sessionAddress.set(session)

  return { userAddress: user, sessionAddress: session }
}

export async function setupSession() {
  // Check prerequisites
  const prereqs = await entrykit.checkPrerequisites()

  if (!prereqs.isReady) {
    // Setup session (your UI guides this)
    await entrykit.setupSession()
  }

  isSessionReady.set(true)
}

export function getSessionClient() {
  return entrykit.getSessionClient()
}
```

```svelte
<!-- routes/+page.svelte -->
<script lang="ts">
  import { connectWallet, setupSession, getSessionClient } from "$lib/entrykit"
  import { userAddress, sessionAddress, isSessionReady } from "$lib/entrykit"

  let connecting = false
  let setupStatus = ""

  async function handleConnect() {
    connecting = true
    try {
      await connectWallet()
      setupStatus = "Checking prerequisites..."

      await setupSession()
      setupStatus = "Session ready!"
    } catch (err) {
      setupStatus = `Error: ${err.message}`
    } finally {
      connecting = false
    }
  }

  async function move(x: number, y: number) {
    const client = getSessionClient()

    await client.writeContract({
      address: worldAddress,
      abi: worldAbi,
      functionName: "move",
      args: [x, y]
    })
  }
</script>

{#if !$userAddress}
  <button on:click={handleConnect} disabled={connecting}>
    {connecting ? "Connecting..." : "Connect Wallet"}
  </button>
{:else if !$isSessionReady}
  <div>Setting up session... {setupStatus}</div>
{:else}
  <div>
    <p>User: {$userAddress}</p>
    <p>Session: {$sessionAddress}</p>

    <button on:click={() => move(1, 0)}>Move Right</button>
    <button on:click={() => move(0, 1)}>Move Down</button>
  </div>
{/if}
```

---

## Implementation Roadmap

### Phase 1: Remove UI & React (2-3 days)

#### Day 1: Delete UI

- [ ] Delete `ui/` directory (7 files)
- [ ] Delete `icons/` directory (18 files)
- [ ] Delete UI-related error components
- [ ] Delete `AccountButton.tsx`, `AccountModal.tsx`, etc.
- [ ] Delete onboarding UI components
- [ ] Update `package.json` - remove UI dependencies
- [ ] Update exports to remove UI exports

#### Day 2: Convert Hooks to Functions

- [ ] Create `core/delegation.ts` with `checkDelegation()`
- [ ] Create `core/setup.ts` with `setupSession()`
- [ ] Create `core/session.ts` with session functions
- [ ] Update all imports
- [ ] Test basic flow works

#### Day 3: Replace Zustand

- [ ] Create `core/storage.ts` with localStorage wrapper
- [ ] Update `getSessionSigner.ts` to use new storage
- [ ] Remove zustand dependency
- [ ] Test session persistence

**Checkpoint:** Core functions work without React

---

### Phase 2: Simplify Dependencies (2-3 days)

#### Day 1: Remove Quarry

- [ ] Research Coinbase paymaster (API, addresses, requirements)
- [ ] Delete `quarry/` directory
- [ ] Create simple `paymaster.ts`
- [ ] Update `createBundlerClient.ts`
- [ ] Remove Quarry from setup flow

#### Day 2: Remove Lattice Infrastructure

- [ ] Remove Relay.link bridging
- [ ] Delete `data/relayChains.json`
- [ ] Delete `actions/cachedFeesPerGas.ts`
- [ ] Remove wiresaw imports
- [ ] Remove chain-specific optimizations (except Anvil)

#### Day 3: Replace Common Utilities

- [ ] Replace `wait` with inline implementation
- [ ] Replace `isNotNull` with inline
- [ ] Replace `writeContract` with viem version
- [ ] Replace `findCause` or use viem errors
- [ ] Update all imports
- [ ] Remove unnecessary `@latticexyz/common` imports

**Checkpoint:** Minimal dependencies, MUD core intact

---

### Phase 3: Create Clean API (2-3 days)

#### Day 1: Design API

- [ ] Create `EntryKitCore` class
- [ ] Define public methods
- [ ] Define TypeScript types
- [ ] Write JSDoc comments

#### Day 2: Implement API

- [ ] Implement `connect()`
- [ ] Implement `checkPrerequisites()`
- [ ] Implement `setupSession()`
- [ ] Implement `getSessionClient()`
- [ ] Add error handling

#### Day 3: Documentation

- [ ] Write README
- [ ] Write usage examples
- [ ] Document configuration options
- [ ] Document migration from original EntryKit

**Checkpoint:** Clean API, well documented

---

### Phase 4: Integration & Testing (3-4 days)

#### Day 1-2: Svelte Integration

- [ ] Create Svelte stores
- [ ] Create wallet connection flow
- [ ] Create setup flow UI (your own)
- [ ] Test connect → setup → use flow

#### Day 3: Base Network Testing

- [ ] Deploy test app to Base Sepolia
- [ ] Test with Coinbase paymaster
- [ ] Verify delegation works
- [ ] Test session persistence

#### Day 4: Edge Cases & Polish

- [ ] Test error scenarios
- [ ] Test network switching
- [ ] Test session expiry/revival
- [ ] Performance testing
- [ ] Fix any bugs

**Checkpoint:** Production ready

---

### Total Timeline: 9-13 days

**Best case:** 9 days (experienced dev, no blockers)
**Realistic:** 11 days (some research needed)
**Worst case:** 13 days (unexpected issues with Coinbase paymaster)

---

## Risk Analysis & Mitigation

### Risk 1: Wallet Connection State Management

**Severity:** MEDIUM
**Probability:** MEDIUM

**Problem:**

- wagmi hooks manage complex wallet state
- Auto-reconnection on page refresh
- Chain switching detection
- Account switching detection

**Mitigation:**

1. Let user's Svelte app manage wallet state
2. Provide clear API for passing connected client
3. Document wallet connection requirements
4. User calls `entrykit.connect(client)` after their wallet connection
5. Use viem's built-in wallet client features

**Example:**

```typescript
// User's responsibility
const walletClient = await connectWallet() // Their code

// EntryKit just receives it
await entrykit.connect(walletClient)
```

---

### Risk 2: Coinbase Paymaster Unknown Implementation

**Severity:** MEDIUM
**Probability:** MEDIUM

**Problem:**

- Don't know Coinbase paymaster specifics yet
- May require API keys
- May require registration
- May have rate limits

**Mitigation:**

1. **Research first** (before coding):
   - Check https://docs.cdp.coinbase.com/
   - Check https://docs.base.org/
   - Join Coinbase Developer Discord
   - Ask in Base Discord

2. **Test early:**
   - Deploy simple test on Base Sepolia
   - Test user operation sponsorship
   - Verify no registration needed

3. **Plan for variations:**
   - Design paymaster interface to support multiple implementations
   - Make it easy to swap implementations

4. **Fallback option:**
   - If Coinbase paymaster is complex, consider using a simple ERC-4337 paymaster
   - Or deploy your own GenerousPaymaster on Base

**Action items before starting:**

- [ ] Research Coinbase paymaster API
- [ ] Get paymaster contract address for Base
- [ ] Test on Base Sepolia
- [ ] Confirm no surprises

---

### Risk 3: Missing MUD Utility Edge Cases

**Severity:** LOW
**Probability:** MEDIUM

**Problem:**

- Some `@latticexyz/common` utilities may handle edge cases you're not aware of
- Errors in transaction handling
- Nonce management edge cases
- Race conditions

**Mitigation:**

1. **Keep MUD utilities you're unsure about:**
   - `resourceToHex`, `hexToResource` - Keep (tiny, well-tested)
   - `getRecord` - Keep (essential)
   - `callFrom`, `sendUserOperationFrom` - Keep (core MUD)

2. **Only replace simple ones:**
   - `wait` - Safe to replace
   - `isNotNull` - Safe to replace
   - `writeContract` - Use viem's version (same interface)

3. **Test thoroughly:**
   - Test all flows
   - Test error cases
   - Test race conditions
   - Monitor transactions

4. **Keep dependencies if needed:**
   - It's okay to keep `@latticexyz/common` if you need utilities
   - Focus on removing unnecessary parts, not everything

---

### Risk 4: Breaking MUD Integration

**Severity:** HIGH
**Probability:** LOW

**Problem:**

- Accidentally break `callFrom` or delegation logic
- Session client doesn't route through World correctly
- Delegation checks fail

**Mitigation:**

1. **DON'T touch these files (or be very careful):**
   - `getSessionClient.ts` - MUD extensions
   - `common.ts` - World constants
   - `delegation.ts` - Delegation logic
   - `utils/callWithSignature.ts` - EOA flow

2. **Test delegation thoroughly:**
   - Check delegation registered correctly
   - Verify calls route through World
   - Test with World systems
   - Monitor World transactions

3. **Keep MUD dependencies:**
   - `@latticexyz/world` - Don't remove
   - `@latticexyz/store` - Don't remove
   - `@latticexyz/common` - Keep partially

4. **Reference tests:**
   - Look at EntryKit's original tests (if any)
   - Look at MUD example apps
   - Copy test patterns

---

### Risk 5: Session Storage Issues

**Severity:** LOW
**Probability:** LOW

**Problem:**

- Session keys lost
- localStorage quota exceeded
- Browser privacy mode breaks storage

**Mitigation:**

1. **Implement carefully:**
   - Always check localStorage exists
   - Handle JSON parse errors
   - Validate stored data

2. **Add recovery:**
   - Let users export/import session keys
   - Provide clear error messages
   - Allow manual session clearing

3. **Document limitations:**
   - Private browsing won't persist
   - Incognito mode needs re-setup
   - Clearing browser data clears sessions

---

## Maintenance Considerations

### Pros of Forking

✅ **Full control over code**

- Fix bugs immediately
- Add features you need
- Remove bloat

✅ **No unnecessary dependencies**

- Smaller bundle size
- Fewer security concerns
- Faster builds

✅ **Framework-agnostic**

- Use with Svelte, Vue, vanilla JS
- Not tied to React ecosystem
- Easier to integrate

✅ **Easier debugging**

- Less code to understand
- No React debugging needed
- Clear data flow

✅ **Performance**

- Smaller runtime
- No React overhead
- Faster initialization

---

### Cons of Forking

❌ **Miss upstream bug fixes**

- Have to monitor original repo
- Manually port fixes
- May miss security patches

❌ **Miss new features**

- No automatic updates
- Have to implement features yourself
- May diverge significantly

❌ **Maintenance burden**

- You're responsible for bugs
- Need to understand MUD deeply
- Need to keep up with MUD updates

❌ **Breaking MUD changes**

- If MUD World changes, you must adapt
- If delegation system changes, you must update
- If Store changes, you must migrate

❌ **Community support**

- Can't easily get help in MUD Discord
- Your fork isn't "official"
- Harder to share solutions

---

### Recommended Maintenance Strategy

#### 1. Track Upstream

```bash
# Add original EntryKit as remote
git remote add upstream https://github.com/latticexyz/mud.git

# Regularly check for updates
git fetch upstream

# Review changes in EntryKit
git log upstream/main -- packages/entrykit/

# Cherry-pick important fixes
git cherry-pick <commit-hash>
```

#### 2. Document Your Changes

Create `FORK_CHANGES.md`:

```markdown
# Fork Changes

## Removed

- All React/UI components
- Quarry paymaster (replaced with Coinbase)
- Relay.link bridging
- Lattice chain optimizations

## Modified

- Converted hooks to async functions
- Replaced zustand with localStorage
- Simplified paymaster integration
- Created EntryKitCore class API

## Kept Intact

- MUD World integration (callFrom)
- Delegation system
- CallWithSignature module
- Session account creation
- ERC-4337 infrastructure

## Reasons

1. Need framework-agnostic solution for Svelte
2. Using Coinbase paymaster on Base
3. Want full control for debugging
4. Prefer lean, focused codebase
```

#### 3. Version Carefully

```json
{
  "name": "@your-org/entrykit-core",
  "version": "1.0.0-fork.0",
  "description": "Lean, framework-agnostic fork of @latticexyz/entrykit",
  "private": true, // Until ready to publish

  "repository": {
    "type": "git",
    "url": "https://github.com/your-org/entrykit-core"
  },

  "keywords": ["mud", "account-abstraction", "erc-4337", "session-keys", "base", "coinbase"]
}
```

#### 4. Monitor MUD Releases

- Watch MUD releases: https://github.com/latticexyz/mud/releases
- Check changelog for EntryKit changes
- Review PRs to EntryKit package
- Join MUD Discord for announcements
- Test your fork against MUD updates

#### 5. Contribute Back (If Possible)

Consider submitting improvements upstream:

- Framework-agnostic option
- Simplified paymaster interface
- Better TypeScript types
- Bug fixes you discover

This helps community and keeps you aligned with MUD.

---

## Alternative: Contribute Instead of Fork

### Consider This Path

Instead of forking, you could:

1. **Create EntryKit plugin system:**
   - PR to add paymaster plugin interface
   - PR to make UI optional
   - PR to export core functions

2. **Add framework adapters:**
   - Create `@latticexyz/entrykit-svelte`
   - Wraps React version with Svelte stores
   - Shares core logic

3. **Create "headless" mode:**
   - PR to expose headless API
   - Keep React UI as optional
   - Let users BYO UI

**Pros:**

- Stay aligned with upstream
- Community benefits
- Shared maintenance
- Official support

**Cons:**

- Slower (PR review process)
- May not align with Lattice priorities
- Still have dependencies on React packages
- Less control

**Recommendation:**
Fork first (get it working), then contribute back later if it proves valuable.

---

## Decision Matrix

### Should You Fork?

| Factor                      | Score     | Notes                   |
| --------------------------- | --------- | ----------------------- |
| **Need framework-agnostic** | ✅ High   | Critical for Svelte     |
| **Want full control**       | ✅ High   | Debugging issues        |
| **Time to maintain**        | ⚠️ Medium | Do you have time?       |
| **Team expertise**          | ✅ High   | You understand AA + MUD |
| **Upstream stability**      | ✅ High   | MUD is mature           |
| **Custom paymaster**        | ✅ High   | Coinbase specific       |
| **Breaking changes risk**   | ⚠️ Medium | MUD could change        |

**Score: 7/7 factors favor forking**

---

## Final Recommendation

### **GO FOR IT** ✅

#### Why Fork Is Right For You

1. **You have specific requirements:**
   - Svelte Kit framework
   - Coinbase paymaster on Base
   - Need full control
   - Want to understand the code

2. **High feasibility:**
   - Most changes are straightforward
   - Clear understanding of architecture
   - Good technical skills

3. **Clear benefits:**
   - 70% code reduction (122 → 35 files)
   - Framework-agnostic
   - Easier to debug
   - Perfect fit for your needs

4. **Manageable risks:**
   - Core MUD logic stays intact
   - Main unknown (Coinbase) is researchable
   - Can always fall back to original

5. **Learning value:**
   - Deep understanding of AA
   - Deep understanding of MUD integration
   - Valuable knowledge for future

#### Success Factors You Have

✅ You understand the architecture (evidenced by your questions)
✅ You have specific needs (Svelte, Coinbase, Base)
✅ You're willing to maintain it
✅ You need full control for debugging
✅ You're experiencing bugs in original (motivation to understand)

---

## Next Steps

### Immediate Actions

1. **Research Coinbase Paymaster (Critical)**
   - [ ] Read: https://docs.cdp.coinbase.com/
   - [ ] Read: https://docs.base.org/
   - [ ] Find paymaster contract address
   - [ ] Understand sponsorship model
   - [ ] Join Coinbase Developer Discord

2. **Clone and Setup**
   - [ ] Fork MUD repo or extract entrykit
   - [ ] Create new repo: `entrykit-core`
   - [ ] Set up build system
   - [ ] Create `FORK_CHANGES.md`

3. **Start with Phase 1**
   - [ ] Delete UI files (quick win)
   - [ ] Remove UI dependencies
   - [ ] Test that core functions still work

4. **Test Early**
   - [ ] Set up test environment
   - [ ] Test on Base Sepolia
   - [ ] Verify delegation works
   - [ ] Verify Coinbase paymaster works

### Timeline

**Week 1:**

- Days 1-3: Phase 1 (Remove UI & React)
- Days 4-6: Phase 2 (Simplify dependencies)
- Day 7: Testing & debugging

**Week 2:**

- Days 8-10: Phase 3 (Create clean API)
- Days 11-14: Phase 4 (Integration & testing)

**Total: 2 weeks to production-ready fork**

---

## Support

If you need help during implementation:

### Questions to Ask in MUD Discord

- "How does callFrom work internally?"
- "What happens if delegation is missing?"
- "Best practices for session key storage?"

### Questions to Ask in Coinbase Developer Discord

- "How to integrate Coinbase paymaster on Base?"
- "Do I need API keys for paymaster sponsorship?"
- "What's the paymaster contract address on Base Sepolia?"

### Code Review Checkpoints

1. After Phase 1: Does basic flow still work?
2. After Phase 2: Is Coinbase paymaster working?
3. After Phase 3: Is API intuitive?
4. After Phase 4: Production ready?

---

## Conclusion

You have:

- ✅ Clear requirements
- ✅ Good understanding of EntryKit
- ✅ Technical capability
- ✅ Valid reasons to fork
- ✅ Manageable scope

**Fork it. You'll learn a ton and get exactly what you need.**

The 2-week investment will pay off in:

- Full control over your auth flow
- Deep understanding of AA + MUD
- Easier debugging
- Better performance
- Perfect fit for Svelte

**Start with Coinbase paymaster research, then dive in.**

Good luck! 🚀

---

**Document End**
