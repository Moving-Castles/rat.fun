import { Chain, Client, Transport, Address, LocalAccount, Account } from 'viem';
export { Address, Client, Hex } from 'viem';
import { SmartAccount, PaymasterClient } from 'viem/account-abstraction';
import { CreateConnectorFn, Config } from '@wagmi/core';

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

type SetupSessionStatus = {
    type: "checking_wallet";
    message: string;
} | {
    type: "deploying_wallet";
    message: string;
} | {
    type: "wallet_deployed";
    message: string;
} | {
    type: "registering_delegation";
    message: string;
} | {
    type: "deploying_session";
    message: string;
} | {
    type: "complete";
    message: string;
} | {
    type: "error";
    message: string;
    error?: Error;
};

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
    setupSession(onStatus?: (status: SetupSessionStatus) => void): Promise<void>;
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

export { type ConnectedClient, type ConnectorInfo, EntryKit, type EntryKitConfig, type EntryKitState, EntryKitStatus, type PrerequisiteStatus, type SessionClient };
