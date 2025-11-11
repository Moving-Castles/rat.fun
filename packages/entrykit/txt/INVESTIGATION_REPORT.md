# EntryKit Package Investigation Report

**Generated**: 2025-11-10
**Package**: @latticexyz/entrykit
**Version**: 2.2.23
**Location**: packages/entrykit

---

## Executive Summary

EntryKit is a comprehensive user onboarding toolkit for MUD (Multi-User Dungeon) applications. It provides a complete solution for wallet connection, account abstraction, session management, and gasless transactions using ERC-4337 account abstraction standard. The package streamlines the complex process of getting users started with blockchain-based MUD applications by handling wallet connections, creating session accounts, managing gas payments through paymasters, and providing a polished UI experience.

**Key Statistics**:
- 122 source files (TypeScript/TSX)
- ~5,819 total lines of code
- 17 subdirectories in src
- 520KB compiled distribution size
- 9 internal monorepo dependencies
- 13 external npm dependencies (excluding dev/peer dependencies)

---

## 1. Package Purpose and Functionality

### Core Mission
EntryKit serves as a "UI kit to streamline signing in to MUD apps" by providing:

1. **Wallet Connection Management**: Integration with multiple wallet providers (MetaMask, Coinbase Wallet, WalletConnect, Safe, id.place)
2. **Session Account Creation**: Automatic creation and management of session-based smart accounts using ERC-4337
3. **Gasless Transactions**: Integration with paymasters (both simple and Quarry-based) for sponsored transactions
4. **Delegation System**: Automatic setup of delegations between user accounts and session accounts
5. **User Onboarding Flow**: Step-by-step guided onboarding process with gas balance management
6. **Cross-chain Bridging**: Integration with Relay.link for cross-chain fund deposits

### Key Features

#### Account Abstraction
- Uses ERC-4337 (EntryPoint v0.7) for account abstraction
- Creates SimpleAccount smart wallets for users
- Session-based signing using local signers stored in browser
- Delegation-based transaction routing through MUD World contracts

#### Paymaster Support
- **Simple Paymaster**: Basic generous paymaster for local development
- **Quarry Paymaster**: Production-ready paymaster with allowance/balance system
  - Allowance grants (non-withdrawable sponsored gas)
  - Balance deposits (withdrawable user funds)
  - Sponsor-based allowance management
  - Spender registration system

#### UI Components
- `EntryKitProvider`: Root provider component
- `AccountButton`: Pre-built account connection button
- `AccountModal`: Full-featured onboarding modal with multi-step flow
- `ConnectWallet`: Wallet connection interface
- Theme support (light/dark mode)
- Error boundaries and overlay system

#### Onboarding Flow
The onboarding process includes these steps:
1. **Wallet Connection**: Connect to external wallet (MetaMask, etc.)
2. **Gas Balance Check**: Verify user has sufficient gas funds
3. **Deposit/Top-up**: If needed, guide user to deposit funds via Relay.link bridge
4. **Session Setup**: Create session account and establish delegation
5. **Ready State**: Session client ready for gasless transactions

---

## 2. External Dependencies Analysis

### Production Dependencies (13 packages)

#### Ethereum & Account Abstraction
1. **@account-abstraction/contracts** (^0.7.0)
   - Purpose: ERC-4337 EntryPoint and account contracts
   - Usage: Contract ABIs and bytecode for deployment
   - Key imports: EntryPoint.json, SimpleAccountFactory.json

2. **permissionless** (0.2.30)
   - Purpose: Account abstraction tooling for viem
   - Usage: Creating smart accounts (`toSimpleSmartAccount`)
   - Key features: Smart account utilities, bundler client extensions

3. **webauthn-p256** (0.0.10)
   - Purpose: WebAuthn/passkey support for authentication
   - Usage: Passkey-based wallet authentication (experimental)

#### UI Libraries
4. **@radix-ui/react-dialog** (^1.0.5)
   - Purpose: Accessible modal/dialog components
   - Usage: Account modal, onboarding flow modals
   - Integration: Used in AccountModal.tsx, Modal.tsx

5. **@radix-ui/react-select** (^1.0.5)
   - Purpose: Accessible select/dropdown components
   - Usage: Chain selection, wallet selection dropdowns

6. **connectkit** (^1.9.0)
   - Purpose: Wallet connection UI kit
   - Usage: Wallet connection flows, default config generation
   - Note: Recently migrated from RainbowKit (v2.2.22)

7. **tailwind-merge** (^1.12.0)
   - Purpose: Merge Tailwind CSS classes intelligently
   - Usage: Dynamic styling in UI components

8. **react-error-boundary** (5.0.0)
   - Purpose: React error boundary components
   - Usage: Error handling in UI (ErrorFallback.tsx, ErrorOverlay.tsx)

#### Wallet & Blockchain Integration
9. **@walletconnect/ethereum-provider** (2.20.2)
   - Purpose: WalletConnect protocol implementation
   - Usage: Custom WalletConnect connector
   - Note: Using internal fork to resolve chain switching issues

10. **@reservoir0x/relay-sdk** (^1.7.0)
    - Purpose: Cross-chain bridging via Relay.link
    - Usage: Deposit flow, chain bridging for gas funds
    - Features: Bridge URL generation, supported chains data

#### State Management & Utilities
11. **zustand** (^4.5.2)
    - Purpose: Lightweight state management
    - Usage: Modal state, error state, session state
    - Files: store.ts, errors/store.ts
    - Pattern: Vanilla stores with React hooks

12. **react-merge-refs** (^2.1.1)
    - Purpose: Merge multiple React refs
    - Usage: Component ref management in UI components

13. **usehooks-ts** (^3.1.0)
    - Purpose: TypeScript-ready React hooks
    - Usage: useLocalStorage and other utility hooks

#### Developer Tools
14. **debug** (^4.3.4)
    - Purpose: Debug logging utility
    - Usage: Debug namespaces throughout codebase
    - Pattern: `debug('entrykit:*')` namespace structure

15. **dotenv** (^16.0.3)
    - Purpose: Environment variable loading
    - Usage: CLI deploy script configuration

16. **@ark/util** (0.2.2)
    - Purpose: Utility functions (likely for validation)
    - Usage: Not heavily used, possibly for future features

### Peer Dependencies (Required by consumers)
- **react** (18.x || 19.x)
- **react-dom** (18.x || 19.x)
- **viem** (2.x) - Ethereum interaction library
- **wagmi** (2.x) - React hooks for Ethereum
- **@tanstack/react-query** (5.x) - Async state management

### Dev Dependencies (Build tooling)
- TypeScript compilation tools
- Vite for playground
- Tailwind CSS for styling
- Testing: vitest
- Build: tsup for library bundling

---

## 3. Internal Monorepo Dependencies

EntryKit depends on **9 internal packages** from the MUD monorepo:

### Core Infrastructure (4 packages)

#### 1. @latticexyz/common (workspace:*)
**Purpose**: Shared utilities and common functionality
**Usage Intensity**: HEAVY (most frequently imported)
**Key Imports**:
- `resourceToHex`, `hexToResource` - Resource ID conversions
- `writeContract` - Contract write operations
- `transactionQueue` - Transaction management
- `findCause` - Error handling utilities
- `wait`, `isNotNull` - Utility functions
- `getRpcUrl` (from /foundry) - RPC configuration
- `ensureContractsDeployed`, `ensureDeployer`, `getContractAddress`, `waitForTransactions` (from /internal) - Deployment utilities
- `getUserOperationReceipt` (from /internal) - User operation tracking
- `wiresaw` (from /internal) - Fast user operation support

**Files using it**: ~20+ files across the codebase

#### 2. @latticexyz/store (workspace:*)
**Purpose**: MUD Store protocol for on-chain state management
**Usage Intensity**: MEDIUM
**Key Imports**:
- `defineStore` - Store configuration
- `getRecord` (from /internal) - Reading store records
- `storeEventsAbi` - Store event definitions

**Primary Use Cases**:
- Quarry paymaster table definitions (quarry/common.ts)
- Reading delegation and system state from World

#### 3. @latticexyz/config (workspace:*)
**Purpose**: Configuration utilities and types
**Usage Intensity**: LOW
**Usage**: Type definitions and configuration helpers

#### 4. @latticexyz/protocol-parser (workspace:*)
**Purpose**: Protocol data parsing utilities
**Usage Intensity**: LOW
**Usage**: Parsing on-chain protocol data

### World-Specific Packages (3 packages)

#### 5. @latticexyz/world (workspace:*)
**Purpose**: MUD World framework - core smart contract system
**Usage Intensity**: HEAVY
**Key Imports**:
- `worldConfig` (from mud.config) - World table definitions
- `IBaseWorld.abi.json` - World contract ABI
- `callFrom`, `sendUserOperationFrom` (from /internal) - Delegated call execution
- `systemsConfig` - World systems configuration

**Primary Use Cases**:
- Delegation setup and management
- World table access (ResourceIds, FunctionSelectors, etc.)
- Routing transactions through World contract
- Session-based contract calls

#### 6. @latticexyz/world-module-callwithsignature (workspace:*)
**Purpose**: Call-with-signature functionality for delegated calls
**Usage Intensity**: MEDIUM
**Key Imports**:
- `CallWithSignatureSystem.abi.json` - System ABI
- `callWithSignatureTypes` (from /internal) - TypedData definitions
- `moduleConfig` - Module configuration

**Primary Use Cases**:
- Signature-based transaction execution
- Session account delegation
- Nonce management for signed calls

**Files**: utils/callWithSignature.ts, useCallWithSignatureNonce.ts

### Specialized Services (3 packages)

#### 7. @latticexyz/paymaster (workspace:*)
**Purpose**: Paymaster contracts for gasless transactions
**Usage Intensity**: MEDIUM
**Key Imports**:
- `GenerousPaymaster.json` - Paymaster contract artifact

**Primary Use Cases**:
- Local development paymaster deployment (bin/deploy.ts)
- Quarry paymaster integration (parallel implementation)

#### 8. @latticexyz/id.place (workspace:*)
**Purpose**: Passkey-based wallet service integration
**Usage Intensity**: LOW (experimental feature)
**Key Imports**:
- `IdPlaceConnector`, `isIdPlaceConnector` (from /internal)

**Primary Use Cases**:
- Experimental passkey authentication (v2.2.23+)
- Alternative to traditional wallet connections

**Usage Pattern**: Conditional imports, feature-flagged

#### 9. @latticexyz/world-consumer (NOT USED)
**Purpose**: N/A
**Note**: Listed in git status but not actually a dependency

### Dependency Summary Table

| Package | Type | Usage | Primary Function |
|---------|------|-------|------------------|
| common | Core | Heavy | Utilities, deployment, transactions |
| store | Core | Medium | State management, table access |
| config | Core | Light | Configuration types |
| protocol-parser | Core | Light | Data parsing |
| world | World | Heavy | Smart contract framework, delegation |
| world-module-callwithsignature | World | Medium | Signature-based calls |
| paymaster | Service | Medium | Gas sponsorship |
| id.place | Service | Light | Passkey authentication |

---

## 4. Architecture and Code Structure

### Directory Structure

```
src/
├── exports/              # Public API surface
│   ├── index.ts         # External exports (empty, future use)
│   └── internal.ts      # Internal exports (main API)
├── config/              # Configuration system
│   ├── defineConfig.ts
│   ├── input.ts
│   └── output.ts
├── onboarding/          # User onboarding flow
│   ├── ConnectedSteps.tsx
│   ├── GasBalance.tsx
│   ├── Session.tsx
│   ├── Wallet.tsx
│   ├── deposit/         # Deposit flow components
│   ├── quarry/          # Quarry-specific onboarding
│   └── [hooks]
├── quarry/              # Quarry paymaster integration
│   ├── common.ts        # Paymaster config & ABIs
│   ├── transports/      # Custom transports
│   └── [utilities]
├── ui/                  # UI primitives
│   ├── Button.tsx
│   ├── Modal.tsx
│   ├── Input.tsx
│   └── [other components]
├── icons/               # SVG icon components
├── errors/              # Error handling system
│   ├── ErrorFallback.tsx
│   ├── ErrorOverlay.tsx
│   ├── store.ts
│   └── [hooks]
├── utils/               # Utility functions
│   ├── callWithSignature.ts
│   ├── signCall.ts
│   ├── defineCall.ts
│   └── withFeeCache.ts
├── actions/             # Custom viem actions
├── connectors/          # Wallet connectors
├── data/                # Static data files
│   └── relayChains.json
├── bin/                 # CLI tools
│   └── deploy.ts
└── [core files]         # Account management, clients, hooks
```

### Key Architectural Patterns

#### 1. Client Architecture
```
User Wallet (EOA)
    ↓ (connects via wagmi)
ConnectedClient
    ↓ (creates)
Session Account (Smart Account)
    ↓ (with delegation to)
SessionClient
    ↓ (interacts with)
MUD World Contract
```

**SessionClient Type**:
```typescript
type SessionClient = Client<Transport, Chain, SmartAccount> & {
  userAddress: Address;        // Original user's EOA
  worldAddress: Address;       // MUD World contract
  internal_signer: LocalAccount; // Session keypair
}
```

#### 2. Delegation Pattern
- User delegates to session account in World contract
- Session account can call World functions on behalf of user
- Uses "unlimited" delegation control by default
- Enables gasless transactions for user

#### 3. Provider Pattern
```
EntryKitProvider (config wrapper)
  └─ EntryKitConfigProvider (config context)
      └─ WagmiProvider (from wagmi)
          └─ ConnectKitProvider (wallet UI)
              └─ QueryClientProvider (react-query)
                  └─ App components
```

#### 4. State Management
- **Zustand stores**: Modal state, error state, session persistence
- **React Query**: Async data fetching (balances, allowances, ENS)
- **Wagmi hooks**: Wallet connection, blockchain state
- **Local Storage**: Session persistence, user preferences

#### 5. Hook-Based API
Primary hooks for consumers:
- `useSessionClient()` - Get ready session client
- `useAccountModal()` - Control onboarding modal
- `useFunds()` - Check gas balance/allowance
- `useCallWithSignatureNonce()` - Get nonce for signed calls

---

## 5. Key Features Deep Dive

### Session Account Management

**Location**: `getSessionAccount.ts`, `getSessionSigner.ts`, `getSessionClient.ts`

**Flow**:
1. Generate or retrieve session keypair from localStorage
2. Create SimpleAccount with session signer as owner
3. Configure with EntryPoint v0.7 and bundler
4. Attach paymaster middleware
5. Add custom actions for MUD World integration
6. Return SessionClient with delegation context

**Storage Key**: `entrykit:session-signer:${userAddress.toLowerCase()}`

### Paymaster Integration

#### Simple Paymaster (Development)
- Deployed via `entrykit-deploy` CLI command
- Only for chainId 31337 (Anvil/local)
- Pre-funded with 100 ETH
- Sponsors all transactions unconditionally

#### Quarry Paymaster (Production)
**Tables**:
- `Balance`: User deposits (withdrawable)
- `Allowance`: Sponsor grants (non-withdrawable)
- `AllowanceList`: Linked list of allowances
- `Spender`: Spender registration
- `SystemConfig`: EntryPoint configuration

**Operations**:
- `depositTo()` - Add to balance
- `grantAllowance()` - Sponsor allocates allowance
- `getAllowance()` - Check available allowance
- `withdrawTo()` - Withdraw balance
- `registerSpender()` - Register smart account

**Spending Priority**: Allowances spent first (smallest to largest), then balance

### Transaction Routing

**User Operations** (via session client):
```
sessionClient.sendUserOperation()
    ↓
bundlerClient (with paymaster middleware)
    ↓
EntryPoint v0.7
    ↓
Paymaster validation
    ↓
SimpleAccount.execute()
    ↓
World.callFrom(delegator, systemId, callData)
    ↓
System execution
```

**Direct Writes** (via write contract):
```
sessionClient.writeContract()
    ↓
intercepted by userOpExecutor
    ↓
converted to user operation
    ↓
(same flow as above)
```

### Cross-Chain Bridging

**Integration**: Relay.link SDK
**Data Source**: `src/data/relayChains.json` (40+ chains)
**Features**:
- Chain selection modal
- Balance checking
- Bridge URL generation
- Deposit tracking
- Return to onboarding after deposit

**Supported Chains**: Ethereum, Optimism, Arbitrum, Base, Polygon, BNB, Avalanche, and 30+ more

### Wiresaw Support

**Purpose**: Fast user operation execution for supported chains
**Location**: Uses `@latticexyz/common/internal` wiresaw utilities
**Status**: Experimental (v2.2.22+)
**Benefit**: Faster transaction confirmation on compatible chains

---

## 6. Build and Deployment

### Build Configuration

**Tool**: tsup (esbuild-based bundler)
**Config**: `tsup.config.ts`

**Entry Points**:
1. `src/exports/index.ts` → `dist/tsup/exports/index.js`
2. `src/exports/internal.ts` → `dist/tsup/exports/internal.js`
3. `src/bin/deploy.ts` → `dist/tsup/bin/deploy.js`

**Special Configuration**:
- CSS injection disabled (shadow DOM usage)
- CSS loaded as base64 text strings
- React JSX transform
- Type declarations generated

**Output Format**: ESM modules

### Package Exports

```json
{
  ".": "./dist/tsup/exports/index.js",
  "./internal": "./dist/tsup/exports/internal.js"
}
```

**CLI Binary**: `entrykit-deploy` → `bin/deploy.js`

### Deployment Script (`entrykit-deploy`)

**Purpose**: Deploy ERC-4337 infrastructure
**Contracts Deployed**:
1. EntryPoint v0.7 (deterministic via CREATE2)
2. SimpleAccountFactory
3. GenerousPaymaster (local only)

**Environment Variables**:
- `PRIVATE_KEY`: Deployer private key
- Auto-detects RPC URL via MUD tooling

**Usage**:
```bash
PRIVATE_KEY=0x... pnpm entrykit-deploy
# or for local:
pnpm deploy
```

---

## 7. Usage Patterns

### Basic Setup

```typescript
// 1. Create wagmi config
const wagmiConfig = createWagmiConfig({
  chainId: 31337,
  chains: [foundry],
  transports: { [foundry.id]: http() },
  walletConnectProjectId: "YOUR_PROJECT_ID",
  appName: "My MUD App",
});

// 2. Define EntryKit config
const entryKitConfig = defineConfig({
  chainId: 31337,
  worldAddress: "0x...",
  appName: "My MUD App",
  appIcon: "/icon.png",
  theme: "dark",
});

// 3. Wrap app
<WagmiProvider config={wagmiConfig}>
  <QueryClientProvider client={queryClient}>
    <EntryKitProvider config={entryKitConfig}>
      <App />
    </EntryKitProvider>
  </QueryClientProvider>
</WagmiProvider>
```

### Using Session Client

```typescript
function MyComponent() {
  const sessionClient = useSessionClient();

  if (!sessionClient) {
    return <div>Loading or not ready...</div>;
  }

  // Write to World contract
  await sessionClient.writeContract({
    address: worldAddress,
    abi: worldAbi,
    functionName: "mySystemCall",
    args: [...],
  });

  // Or send user operation directly
  await sessionClient.sendUserOperation({
    calls: [{
      to: worldAddress,
      data: encodeFunctionData({...}),
    }],
  });
}
```

### Using Account Button

```typescript
import { AccountButton } from "@latticexyz/entrykit/internal";

function Header() {
  return (
    <header>
      <AccountButton />
    </header>
  );
}
```

---

## 8. Testing and Development

### Playground

**Location**: `playground/`
**Purpose**: Development testing environment
**Features**:
- Live testing of onboarding flow
- User vs session write testing
- Connection status display
- Modal state testing

**Run**:
```bash
pnpm playground        # Start dev server
pnpm playground:setup  # Setup sequence
```

### Test Commands

```bash
pnpm test      # Run vitest in watch mode
pnpm test:ci   # Run tests once with type checking
```

**Note**: No test files found in current codebase (integration/manual testing focused)

---

## 9. Notable Implementation Details

### Fee Caching
**Feature**: `withFeeCache()` utility (v2.2.23)
**Purpose**: Cache gas fee estimates for 10 seconds
**Chains**: Redstone, Pyrope, Garnet
**Benefit**: Reduce RPC calls, faster UX

### Error Handling
**System**: Comprehensive error overlay system
**Components**:
- `ErrorFallback` - Boundary fallback UI
- `ErrorOverlay` - Modal error display
- `ErrorsOverlay` - Multiple error aggregation
- Zustand store for error state
- Query/mutation error hooks

### Signature Validation
**Function**: `validateSigner()` (exported internal)
**Purpose**: Validate session signatures against user delegations
**Use Case**: Login flows with session signer on behalf of users

### Theme Support
**Hook**: `useTheme()`
**Values**: "light" | "dark" | undefined
**Default**: OS preference
**Override**: Config or manual selection

---

## 10. Dependencies on Other Monorepo Packages

### Critical Path Dependencies

```
entrykit
├─ @latticexyz/common (CRITICAL)
│  └─ Used in: deployment, transactions, utilities
├─ @latticexyz/world (CRITICAL)
│  └─ Used in: delegation, world interaction, system calls
├─ @latticexyz/world-module-callwithsignature (HIGH)
│  └─ Used in: signature-based calls, session management
├─ @latticexyz/store (HIGH)
│  └─ Used in: paymaster tables, world state
├─ @latticexyz/paymaster (MEDIUM)
│  └─ Used in: contract deployment only
├─ @latticexyz/id.place (LOW)
│  └─ Used in: optional passkey feature
├─ @latticexyz/config (LOW)
│  └─ Used in: type definitions
└─ @latticexyz/protocol-parser (LOW)
   └─ Used in: data parsing utilities
```

### Dependency Change Risk Assessment

**High Risk** (breaks EntryKit if changed):
- `@latticexyz/common` - Breaking changes would impact many files
- `@latticexyz/world` - Core to delegation and World interaction

**Medium Risk**:
- `@latticexyz/world-module-callwithsignature` - Signature system changes
- `@latticexyz/store` - Table definition changes

**Low Risk**:
- Other packages have limited surface area in EntryKit

---

## 11. Recent Changes and Evolution

### Version 2.2.23 (Current)
- Fee caching for improved performance
- id.place passkey support (experimental)
- Viem 2.35.1, wagmi 2.16.5 updates

### Version 2.2.22
- **Major**: Migrated from RainbowKit to ConnectKit
- Quarry paymaster top-up via Relay.link
- Wiresaw fast user operations support
- Gas balance withdrawal feature
- Improved error states in `useSessionClient`

### Version 2.2.21
- Session client world address exposed
- React 19 peer dependency support
- Signature validation export

### Historical Notes
- Originally used RainbowKit (replaced in 2.2.22)
- Custom WalletConnect connector to fix chain switching
- Continuous refinement of onboarding UX

---

## 12. Known Limitations and TODOs

### From Code Comments

1. **ERC-6492 Support**: Not yet supported in CallWithSignature module
   - Currently throws readable error instead of silent failure

2. **WalletConnect Project ID**: Required but marked for optional in future
   - Consider hiding wallet options if not provided

3. **External Exports**: Main export (`exports/index.ts`) is empty
   - All exports currently in `internal` namespace
   - Plan to promote stable APIs to main export

4. **Configuration Validation**: TODO to use arktype instead of zod
   - Avoid additional dependency

5. **Quarry Imports**: TODOs to import from dedicated quarry-paymaster package
   - Currently inlined in `quarry/common.ts`

6. **Anvil Detection**: TODO to automatically configure PRIVATE_KEY for Anvil
   - Manual env var setup currently required

---

## 13. Security Considerations

### Session Key Management
- **Storage**: localStorage (browser-based)
- **Scope**: Per-user address
- **Lifetime**: Persistent until manually cleared
- **Risk**: XSS attacks could compromise session keys
- **Mitigation**: Delegation limits blast radius, keys are rotatable

### Delegation Security
- **Control**: Uses "unlimited" delegation by default
- **Scope**: Session account can call any system in World on behalf of user
- **Consideration**: Apps should implement custom delegation controls if needed
- **Recovery**: User can revoke delegation from EOA

### Paymaster Security
- **Balance**: User-owned, withdrawable
- **Allowance**: Sponsor-granted, non-withdrawable
- **Spending**: Automatic based on user operations
- **Protection**: EntryPoint validation, paymaster validation logic

---

## 14. Recommendations

### For Maintainers

1. **Consider Graduating APIs**: Move stable APIs from `internal` to main export
2. **Improve Testing**: Add unit/integration tests for critical flows
3. **Document Quarry**: Create dedicated docs for Quarry paymaster integration
4. **Enhance Type Safety**: Consider stricter TypeScript configurations
5. **Bundle Size**: Monitor and optimize (currently 520KB dist)

### For Consumers

1. **Start with Defaults**: Use `createWagmiConfig` and `getDefaultConnectors`
2. **Test Onboarding**: Thoroughly test the full onboarding flow in your app
3. **Handle Errors**: Implement proper error boundaries around EntryKit
4. **Monitor Session State**: Track `useSessionClient` loading/error states
5. **Consider Delegation**: Evaluate if "unlimited" delegation fits your security model

### For Integration

1. **Chain Configuration**: Ensure chain has EntryPoint v0.7 deployed
2. **Paymaster Setup**: Deploy paymaster or use Quarry service
3. **World Integration**: Ensure World has CallWithSignature module installed
4. **RPC Requirements**: Need bundler RPC endpoint for user operations
5. **Testing**: Test on target chain before production launch

---

## 15. Conclusion

EntryKit is a sophisticated, production-ready package that abstracts away the complexity of onboarding users to blockchain-based MUD applications. It successfully bridges the gap between traditional wallet connections and gasless, session-based interactions required for smooth gameplay experiences.

**Strengths**:
- Comprehensive feature set for user onboarding
- Deep integration with MUD ecosystem
- Well-structured codebase with clear separation of concerns
- Active development with regular improvements
- Production-tested with real deployments

**Dependencies Summary**:
- **External**: 13 production dependencies (mostly well-established libraries)
- **Internal**: 9 monorepo packages (tight MUD integration)
- **Peer**: Standard React + Ethereum stack (viem, wagmi)

**Ecosystem Position**:
EntryKit sits at the user-facing edge of the MUD stack, depending on most core MUD packages (common, world, store) while providing the UX layer that makes MUD accessible to end users.

---

## Appendix A: Complete Dependency Graph

```
@latticexyz/entrykit
│
├─ External Dependencies
│  ├─ Ethereum/AA
│  │  ├─ @account-abstraction/contracts@^0.7.0
│  │  ├─ permissionless@0.2.30
│  │  └─ webauthn-p256@0.0.10
│  │
│  ├─ UI/UX
│  │  ├─ @radix-ui/react-dialog@^1.0.5
│  │  ├─ @radix-ui/react-select@^1.0.5
│  │  ├─ connectkit@^1.9.0
│  │  ├─ tailwind-merge@^1.12.0
│  │  └─ react-error-boundary@5.0.0
│  │
│  ├─ Blockchain/Wallets
│  │  ├─ @walletconnect/ethereum-provider@2.20.2
│  │  └─ @reservoir0x/relay-sdk@^1.7.0
│  │
│  └─ Utilities
│     ├─ zustand@^4.5.2
│     ├─ usehooks-ts@^3.1.0
│     ├─ react-merge-refs@^2.1.1
│     ├─ debug@^4.3.4
│     ├─ dotenv@^16.0.3
│     └─ @ark/util@0.2.2
│
├─ Internal Dependencies
│  ├─ Core (Heavy Use)
│  │  ├─ @latticexyz/common
│  │  ├─ @latticexyz/store
│  │  └─ @latticexyz/world
│  │
│  ├─ Modules (Medium Use)
│  │  └─ @latticexyz/world-module-callwithsignature
│  │
│  ├─ Services (Varied Use)
│  │  ├─ @latticexyz/paymaster
│  │  └─ @latticexyz/id.place
│  │
│  └─ Utilities (Light Use)
│     ├─ @latticexyz/config
│     └─ @latticexyz/protocol-parser
│
└─ Peer Dependencies (Required by User)
   ├─ react@18.x || 19.x
   ├─ react-dom@18.x || 19.x
   ├─ viem@2.x
   ├─ wagmi@2.x
   └─ @tanstack/react-query@5.x
```

---

## Appendix B: File Count by Category

| Category | Count | Purpose |
|----------|-------|---------|
| UI Components | 25 | Buttons, modals, inputs, icons |
| Hooks | 18 | React hooks for state/data |
| Utilities | 12 | Helper functions |
| Config | 8 | Configuration system |
| Onboarding | 14 | User onboarding flow |
| Quarry Integration | 8 | Paymaster integration |
| Error Handling | 6 | Error boundaries/overlays |
| Client Management | 10 | Account/session clients |
| Types/Exports | 5 | Type definitions, exports |
| Other | 16 | Misc files |
| **Total** | **122** | |

---

**Report End**
