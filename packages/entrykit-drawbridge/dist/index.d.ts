import * as viem from 'viem';
import { Chain, Client, Transport, Address, LocalAccount, Account, Hex, RpcSchema, Abi, ContractFunctionParameters, OneOf } from 'viem';
export { Address, Client, Hex } from 'viem';
import { SmartAccount, PaymasterClient, BundlerClientConfig, BundlerClient } from 'viem/account-abstraction';
import { CreateConnectorFn, Config } from '@wagmi/core';
import * as viem_accounts from 'viem/accounts';

/**
 * A viem client with an account (connected wallet)
 */
type ConnectedClient<chain extends Chain = Chain> = Client<Transport, chain, Account>;
/**
 * Session client - ERC-4337 smart account extended with MUD World functionality
 *
 * This is a standard viem client with:
 * - SmartAccount (ERC-4337 account abstraction)
 * - MUD World extensions (callFrom, sendUserOperationFrom)
 * - Context properties (userAddress, worldAddress, internal_signer)
 *
 * Use this to call World systems on behalf of the user via delegation.
 */
type SessionClient<chain extends Chain = Chain> = Client<Transport, chain, SmartAccount> & {
    /** Original user's wallet address (the delegator) */
    readonly userAddress: Address;
    /** MUD World contract address - all calls are routed through this */
    readonly worldAddress: Address;
    /** Session private key - used for signing messages on behalf of session account */
    readonly internal_signer: LocalAccount;
};
/**
 * EntryKit connection and setup status
 *
 * Provides a single source of truth for the current state of EntryKit.
 * Transitions follow this flow:
 *
 * UNINITIALIZED → initialize() → DISCONNECTED
 *                                      ↓
 *                      connectWallet() ↓
 *                                      ↓
 *                                 CONNECTED
 *                                      ↓
 *                      setupSession()  ↓
 *                                      ↓
 *                             SETTING_UP_SESSION
 *                                      ↓
 *                                   READY
 *
 * Note: READY state can be reached directly from DISCONNECTED if reconnection succeeds.
 */
declare enum EntryKitStatus {
    /** EntryKit not yet initialized - call initializeEntryKit() */
    UNINITIALIZED = "uninitialized",
    /** EntryKit initialized but no wallet connected */
    DISCONNECTED = "disconnected",
    /** Wallet connection in progress */
    CONNECTING = "connecting",
    /** Wallet connected, but session setup needed (delegation not registered) */
    CONNECTED = "connected",
    /** Session setup in progress (registering delegation) */
    SETTING_UP_SESSION = "setting_up_session",
    /** Fully ready - session client available and delegation registered */
    READY = "ready",
    /** An error occurred */
    ERROR = "error"
}

/**
 * Configuration for EntryKit instance
 */
type EntryKitConfig = {
    /** Chain ID to operate on */
    chainId: number;
    /** Supported chains */
    chains: readonly [Chain, ...Chain[]];
    /** Transport configuration per chain */
    transports: Record<number, Transport>;
    /** Wallet connectors (injected, walletConnect, etc.) */
    connectors: CreateConnectorFn[];
    /** MUD World contract address (optional if skipSessionSetup is true) */
    worldAddress?: Address;
    /** Optional paymaster client for sponsored transactions */
    paymasterClient?: PaymasterClient;
    /** Optional polling interval for wagmi (in ms) */
    pollingInterval?: number;
    /** Optional app name for wallet connectors */
    appName?: string;
    /**
     * Skip session setup entirely - wallet connection only mode
     * Use this for apps that don't need MUD delegation/session accounts.
     * When true:
     * - No session account created
     * - No delegation registration
     * - Only provides connected wallet client via wagmi
     * - worldAddress is optional
     * @default false
     */
    skipSessionSetup?: boolean;
};
/**
 * Current state of the EntryKit instance
 * Updated reactively and broadcast to subscribers
 */
type EntryKitState = {
    /** Current status of EntryKit - single source of truth */
    status: EntryKitStatus;
    /** Session client with MUD World extensions, null if not connected */
    sessionClient: SessionClient | null;
    /** Original user's wallet address, null if not connected */
    userAddress: Address | null;
    /** Session smart account address, null if not connected */
    sessionAddress: Address | null;
    /** Whether session has delegation registered and is ready to use */
    isReady: boolean;
};
/**
 * Result of checking session prerequisites
 */
type PrerequisiteStatus = {
    /** Whether delegation is registered in World contract */
    hasDelegation: boolean;
    /** Whether session is fully ready (same as hasDelegation) */
    isReady: boolean;
};
type StateListener = (state: EntryKitState) => void;
type Unsubscribe = () => void;
/**
 * Connector info for UI display
 */
type ConnectorInfo = {
    id: string;
    name: string;
    type: string;
};
/**
 * entrykit-drawbridge - Stripped down headless version of @latticexyz/entrykit
 *
 * Provides complete wallet connection and session management:
 * - Wagmi integration (connectors, account watching, reconnection)
 * - ERC-4337 session account creation
 * - MUD World delegation registration
 * - Reactive state management (framework-agnostic)
 * - Gasless transaction support via paymaster
 *
 * Usage:
 * ```typescript
 * const entrykit = new EntryKit({
 *   chainId: 8453,
 *   chains: [baseChain],
 *   transports: { 8453: http() },
 *   connectors: [injected()],
 *   worldAddress: "0x..."
 * });
 *
 * // Initialize (await reconnection, setup watchers)
 * await entrykit.initialize();
 *
 * // Get available wallets
 * const wallets = entrykit.getAvailableConnectors();
 *
 * // Connect to wallet
 * await entrykit.connectWallet(wallets[0].id);
 *
 * // Setup delegation if needed
 * if (!entrykit.isReady) {
 *   await entrykit.setupSession();
 * }
 *
 * // Disconnect
 * await entrykit.disconnectWallet();
 * ```
 */
declare class EntryKit {
    private config;
    private state;
    private listeners;
    private wagmiConfig;
    private accountWatcherCleanup;
    private isConnecting;
    private isDisconnecting;
    constructor(config: EntryKitConfig);
    /**
     * Initialize EntryKit (await reconnection and setup account watcher)
     *
     * This should be called once after construction and awaited.
     * It will attempt to reconnect to a previously connected wallet.
     */
    initialize(): Promise<void>;
    /**
     * Subscribe to state changes
     *
     * The listener will be called immediately with the current state,
     * and again whenever the state changes.
     *
     * @param listener Function to call on state changes
     * @returns Unsubscribe function
     *
     * @example
     * ```typescript
     * const unsubscribe = entrykit.subscribe((state) => {
     *   if (state.sessionClient) {
     *     console.log("Session ready:", state.sessionClient.account.address);
     *   }
     * });
     *
     * // Later, stop listening
     * unsubscribe();
     * ```
     */
    subscribe(listener: StateListener): Unsubscribe;
    /**
     * Get current state (non-reactive snapshot)
     *
     * For reactive updates, use subscribe() instead.
     */
    getState(): EntryKitState;
    private updateState;
    private notify;
    /**
     * Setup wagmi account watcher to handle connection/disconnection
     * Called automatically by initialize()
     */
    private setupAccountWatcher;
    /**
     * Internal handler for wallet connection
     * Called when wagmi detects a connected account
     */
    private handleWalletConnection;
    /**
     * Get available wallet connectors for UI display
     *
     * @returns Array of connector info (id, name, type)
     */
    getAvailableConnectors(): ConnectorInfo[];
    /**
     * Connect to a wallet by connector ID
     *
     * This will:
     * 1. Connect via wagmi
     * 2. Account watcher will automatically handle EntryKit session creation
     *
     * @param connectorId Connector ID (from getAvailableConnectors())
     * @throws If connector not found or connection fails
     */
    connectWallet(connectorId: string): Promise<void>;
    /**
     * Disconnect wallet and clear session
     *
     * This will:
     * 1. Disconnect via wagmi
     * 2. Account watcher will automatically clear EntryKit state
     */
    disconnectWallet(): Promise<void>;
    /**
     * Check if session is ready to use
     *
     * Queries the MUD World contract to check if delegation is registered
     * between the user's account and the session account.
     *
     * @returns Delegation status
     */
    checkPrerequisites(): Promise<PrerequisiteStatus>;
    /**
     * Setup session by registering delegation and deploying account
     *
     * This will:
     * 1. Get current wallet client from wagmi
     * 2. Register delegation in MUD World contract (user delegates to session)
     * 3. Deploy session smart account if not already deployed
     *
     * User will need to sign a transaction (EOA) or user operation (smart account).
     *
     * @throws If not connected (call connectWallet() first)
     */
    setupSession(): Promise<void>;
    /**
     * Cleanup and destroy EntryKit instance
     *
     * This will:
     * 1. Unwatch account changes
     * 2. Clear session state (but NOT localStorage keys)
     *
     * Call this when unmounting your app.
     */
    destroy(): void;
    /**
     * Clear stored session keys from localStorage
     *
     * This permanently removes the session private key for the current user.
     * Next time connect() is called, a new session account will be created.
     */
    clearStorage(): void;
    /** Get current session client (null if not connected) */
    get sessionClient(): SessionClient | null;
    /** Get current user address (null if not connected) */
    get userAddress(): Address | null;
    /** Get current session account address (null if not connected) */
    get sessionAddress(): Address | null;
    /** Check if session is ready (has delegation) */
    get isReady(): boolean;
    /** Get wagmi config (for advanced use cases like transactions) */
    getWagmiConfig(): Config;
}

/**
 * Create session client with MUD World extensions
 *
 * Takes a standard ERC-4337 smart account and extends it with MUD-specific functionality:
 *
 * 1. **smartAccountActions** - Standard AA operations (sendUserOperation, etc.)
 * 2. **callFrom** - Routes writeContract calls through World.callFrom()
 *    - Automatically adds delegator context
 *    - World validates delegation before executing
 * 3. **sendUserOperationFrom** - Routes user operations through World
 * 4. **Context properties** - Adds userAddress, worldAddress, internal_signer
 *
 * The resulting SessionClient can call World systems on behalf of the user,
 * as long as delegation is registered.
 *
 * @param params Session client parameters
 * @returns SessionClient with MUD World extensions
 */
declare function getSessionClient({ userAddress, sessionAccount, sessionSigner, worldAddress, paymasterOverride }: {
    userAddress: Address;
    sessionAccount: SmartAccount;
    sessionSigner: LocalAccount;
    worldAddress: Address;
    paymasterOverride?: PaymasterClient;
}): Promise<SessionClient>;

type GetSessionAccountReturnType = {
    readonly account: SmartAccount;
    readonly signer: LocalAccount;
};
declare function getSessionAccount<chain extends Chain>({ client, userAddress }: {
    client: Client<Transport, chain>;
    userAddress: Address;
}): Promise<GetSessionAccountReturnType>;

/**
 * Get or create session signer for a user address
 *
 * Session signers are persistent private keys stored in localStorage.
 * They're used as the owner of the session smart account.
 *
 * If no signer exists for this user:
 * - Attempts to migrate from old MUD AccountKit storage format
 * - Otherwise generates a fresh random private key
 * - Stores the key for future use
 *
 * @param userAddress User's wallet address
 * @returns LocalAccount (viem account from private key)
 */
declare function getSessionSigner(userAddress: Address): {
    address: Address;
    nonceManager?: viem.NonceManager | undefined;
    sign: (parameters: {
        hash: viem.Hash;
    }) => Promise<Hex>;
    signAuthorization: (parameters: viem.AuthorizationRequest) => Promise<viem_accounts.SignAuthorizationReturnType>;
    signMessage: ({ message }: {
        message: viem.SignableMessage;
    }) => Promise<Hex>;
    signTransaction: <serializer extends viem.SerializeTransactionFn<viem.TransactionSerializable> = viem.SerializeTransactionFn<viem.TransactionSerializable>, transaction extends Parameters<serializer>[0] = Parameters<serializer>[0]>(transaction: transaction, options?: {
        serializer?: serializer | undefined;
    } | undefined) => Promise<Hex>;
    signTypedData: <const typedData extends viem.TypedData | Record<string, unknown>, primaryType extends keyof typedData | "EIP712Domain" = keyof typedData>(parameters: viem.TypedDataDefinition<typedData, primaryType>) => Promise<Hex>;
    publicKey: Hex;
    source: "privateKey";
    type: "local";
};

/**
 * Session key storage using localStorage
 *
 * Manages persistent session private keys for each user address.
 * Keys are stored in localStorage and survive page refreshes.
 *
 * Storage format: { signers: { "0xabc...": "0x123..." } }
 * Storage key: "entrykit:session-signers"
 */
declare class SessionStorage {
    private cache;
    private readonly STORAGE_KEY;
    constructor();
    /**
     * Load session store from localStorage
     */
    private load;
    /**
     * Save session store to localStorage
     */
    private save;
    /**
     * Get session signer private key for a user address
     *
     * @param address User's wallet address
     * @returns Private key if exists, undefined otherwise
     */
    getSigner(address: Address): Hex | undefined;
    /**
     * Store session signer private key for a user address
     *
     * @param address User's wallet address
     * @param privateKey Session private key to store
     */
    setSigner(address: Address, privateKey: Hex): void;
    /**
     * Remove session signer for a user address
     *
     * @param address User's wallet address
     */
    removeSigner(address: Address): void;
    /**
     * Clear all session signers
     */
    clear(): void;
}
/**
 * Singleton session storage instance
 */
declare const sessionStorage: SessionStorage;

type CheckDelegationParams = {
    client: Client;
    worldAddress: Address;
    userAddress: Address;
    sessionAddress: Address;
    blockTag?: "pending" | "latest";
};
/**
 * Check if delegation exists in MUD World contract
 *
 * MUD World stores delegations in the UserDelegationControl table.
 * A delegation allows the session account (delegatee) to call World systems
 * on behalf of the user account (delegator).
 *
 * This function queries that table and checks if "unlimited" delegation exists,
 * which grants the session account full access to all systems.
 *
 * @param params Delegation check parameters
 * @returns true if unlimited delegation is registered, false otherwise
 */
declare function checkDelegation({ client, worldAddress, userAddress, sessionAddress, blockTag }: CheckDelegationParams): Promise<boolean>;

type SetupSessionParams = {
    client: any;
    userClient: any;
    sessionClient: SessionClient;
    worldAddress: Hex;
    registerDelegation?: boolean;
};
/**
 * Setup session by registering delegation and deploying session account
 *
 * Flow differs based on wallet type:
 *
 * **Smart Account Wallet:**
 * - Sends user operation to register delegation
 * - User's smart account submits the operation
 *
 * **EOA (Externally Owned Account):**
 * - Uses CallWithSignature pattern (gasless for user)
 * - User signs a message (EIP-712)
 * - Session account submits the signature + call
 * - World validates signature and executes as user
 *
 * **Finally:**
 * - Deploys session account if not yet deployed (via empty user operation)
 *
 * @param params Setup parameters
 */
declare function setupSession({ client, userClient, sessionClient, worldAddress, registerDelegation }: SetupSessionParams): Promise<void>;

/**
 * Create a bundler client for submitting ERC-4337 user operations
 *
 * A bundler client is a specialized viem client that:
 * - Submits user operations to the bundler RPC
 * - Handles gas estimation for user operations
 * - Integrates paymaster for gas sponsorship
 * - Manages smart account interactions
 *
 * This function wraps viem's createBundlerClient with:
 * - Automatic paymaster configuration from chain or override
 * - Custom fee estimation for Anvil (local dev)
 * - Default polling interval
 *
 * @param config Bundler client configuration
 * @returns Configured bundler client
 */
declare function createBundlerClient<transport extends Transport, chain extends Chain = Chain, account extends SmartAccount = SmartAccount, client extends Client = Client, rpcSchema extends RpcSchema | undefined = undefined>(config: BundlerClientConfig<transport, chain, account, client, rpcSchema>): BundlerClient<transport, chain, account, client, rpcSchema>;

/**
 * Get bundler RPC transport for a chain
 *
 * Bundlers are special RPC endpoints that handle ERC-4337 user operations.
 * They submit user operations to the EntryPoint contract and handle gas sponsorship.
 *
 * The bundler URL must be configured in the chain's rpcUrls.bundler.http array.
 *
 * @param chain Chain configuration with bundler RPC URL
 * @returns HTTP transport for the bundler
 * @throws If chain doesn't have a bundler RPC URL configured
 */
declare function getBundlerTransport(chain: Chain): viem.HttpTransport<undefined, false>;

/**
 * Paymaster configuration
 *
 * Paymasters sponsor gas for user operations (ERC-4337).
 * Two types supported:
 *
 * - **simple**: Basic paymaster with just an address
 *   Returns paymaster address with empty data
 *
 * - **custom**: Advanced paymaster with client
 *   Uses provided PaymasterClient for dynamic sponsorship logic
 *   (e.g., Coinbase Paymaster, Pimlico, etc.)
 */
type Paymaster = {
    readonly type: "simple";
    readonly address: Hex;
} | {
    readonly type: "custom";
    readonly address?: Hex;
    readonly paymasterClient: PaymasterClient;
};
/**
 * Get paymaster configuration for a chain
 *
 * Priority:
 * 1. Use paymasterOverride if provided (custom paymaster client)
 * 2. Check chain.contracts.paymaster for simple paymaster address
 * 3. Return undefined if no paymaster configured (user pays own gas)
 *
 * @param chain Chain configuration
 * @param paymasterOverride Optional custom paymaster client
 * @returns Paymaster config or undefined
 */
declare function getPaymaster(chain: Chain, paymasterOverride?: PaymasterClient): Paymaster | undefined;

declare function defineCall<abi extends Abi | readonly unknown[]>(call: Omit<ContractFunctionParameters<abi>, "address"> & {
    to: Address;
    value?: bigint | undefined;
}): Omit<ContractFunctionParameters<abi>, "address"> & {
    to: Address;
    value?: bigint | undefined;
};

type SignCallOptions<chain extends Chain = Chain> = {
    userClient: ConnectedClient<chain>;
    worldAddress: Address;
    systemId: Hex;
    callData: Hex;
} & OneOf<{
    nonce: bigint;
} | {
    client: Client<Transport, chain>;
}>;
/**
 * Sign a World system call using EIP-712 (for CallWithSignature pattern)
 *
 * This creates a signature that can be submitted by the session account to execute
 * a call on behalf of the user (EOA).
 *
 * Flow:
 * 1. **Fetch or use nonce** - Each user has a nonce in CallWithSignatureNonces table
 *    Prevents replay attacks
 *
 * 2. **Parse systemId** - MUD system IDs are resource IDs with namespace + name
 *    e.g., "world:PlayerSystem" → { namespace: "world", name: "PlayerSystem" }
 *
 * 3. **Sign EIP-712 message** - User signs typed data with:
 *    - Domain: World contract + chain ID
 *    - Message: signer, system, callData, nonce
 *
 * The resulting signature can be submitted to World.callWithSignature()
 * by the session account, which will validate and execute as the user.
 *
 * **Why this pattern?**
 * - EOAs can't pay gas via paymaster directly (not smart accounts)
 * - User signs message (free, no gas)
 * - Session account submits + pays gas via paymaster
 * - User gets gasless experience!
 *
 * @param options Sign options including user client and call details
 * @returns EIP-712 signature
 */
declare function signCall<chain extends Chain = Chain>({ userClient, worldAddress, systemId, callData, nonce: initialNonce, client }: SignCallOptions<chain>): Promise<`0x${string}`>;

type CallWithSignatureOptions<chain extends Chain = Chain> = SignCallOptions<chain> & {
    sessionClient: ConnectedClient;
};
/**
 * Call a World system using signature-based execution (for EOAs and smart wallets)
 *
 * MUD's CallWithSignature pattern allows EOAs and smart wallets to execute gasless transactions:
 *
 * 1. User signs an EIP-712 message (free, off-chain)
 * 2. Session account submits the signature + call to World
 * 3. World's CallWithSignatureSystem validates the signature
 * 4. If valid, executes the call as the user (with user's identity)
 *
 * This enables gasless transactions - the session account pays gas via paymaster,
 * but the call executes with the user's permissions/identity.
 *
 * For undeployed smart wallets (e.g., new Coinbase Smart Wallet), this function
 * automatically detects ERC-6492 wrapped signatures and deploys the wallet using
 * the session account before submitting the call.
 *
 * Flow:
 *   User → signs message → Session Account → (deploys wallet if needed) → submits to World
 *   → World validates signature → executes as User
 *
 * @param options Call parameters including user client and session client
 * @returns Transaction hash
 */
declare function callWithSignature<chain extends Chain = Chain>({ sessionClient, ...opts }: CallWithSignatureOptions<chain>): Promise<`0x${string}`>;

export { type ConnectedClient, type ConnectorInfo, EntryKit, type EntryKitConfig, type EntryKitState, EntryKitStatus, type Paymaster, type PrerequisiteStatus, type SessionClient, callWithSignature, checkDelegation, createBundlerClient, defineCall, getBundlerTransport, getPaymaster, getSessionAccount, getSessionClient, getSessionSigner, sessionStorage, setupSession, signCall };
