import { Client, Transport, Chain, PublicActions, Address, LocalAccount, Account, WalletActions } from 'viem';
import { SmartAccount, PaymasterClient } from 'viem/account-abstraction';
import { CreateConnectorFn, Config } from '@wagmi/core';

/**
 * A viem public client with chain and public actions.
 * Used for all read operations (getBalance, readContract, etc.)
 */
type PublicClient = Client<Transport, Chain, undefined, undefined, PublicActions<Transport, Chain>>;
/**
 * A viem client with an account (connected wallet).
 * Used for wallet operations like signing.
 */
type ConnectorClient = Client<Transport, Chain, Account, undefined, Pick<WalletActions<Chain, Account>, "writeContract" | "sendTransaction">>;
/**
 * A connected wallet client with account.
 * Generic over chain to support various chain configurations.
 * Used by setupSession for both EOA and Smart Account paths.
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
type SessionClient = Client<Transport, Chain, SmartAccount> & {
    /** Original user's wallet address (the delegator) */
    readonly userAddress: Address;
    /** MUD World contract address - all calls are routed through this */
    readonly worldAddress: Address;
    /** Session private key - used for signing messages on behalf of session account */
    readonly internal_signer: LocalAccount;
};

/**
 * Drawbridge connection and setup status
 *
 * Provides a single source of truth for the current state of Drawbridge.
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
declare enum DrawbridgeStatus {
    /** Drawbridge not yet initialized - call initialize() */
    UNINITIALIZED = "uninitialized",
    /** Drawbridge initialized but no wallet connected */
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
 * Setup session status updates for progress tracking
 */
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
 * Configuration for Drawbridge instance
 */
type DrawbridgeConfig = {
    /** Public client */
    publicClient: PublicClient;
    /** Transport for wallet client */
    transport: Transport;
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
     * Current ETH price in USD for gas cost calculations
     * Used with $500 margin in fee cap: (ethPriceUSD + 500)
     * If not provided, defaults to $3,000
     */
    ethPriceUSD?: number;
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
    /**
     * Enable console logging for debugging
     * When false, all console.log and console.warn calls are suppressed.
     * Errors are always logged regardless of this setting.
     * @default false
     */
    logging?: boolean;
};
/**
 * Current state of the Drawbridge instance
 * Updated reactively and broadcast to subscribers
 */
type DrawbridgeState = {
    /** Current status of Drawbridge - single source of truth */
    status: DrawbridgeStatus;
    /** Session client with MUD World extensions, null if not connected */
    sessionClient: SessionClient | null;
    /** Original user's wallet address, null if not connected */
    userAddress: Address | null;
    /** Session smart account address, null if not connected */
    sessionAddress: Address | null;
    /** Whether session has delegation registered and is ready to use */
    isReady: boolean;
    /** Error that occurred during connection or session setup, null if no error */
    error: Error | null;
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
type StateListener = (state: DrawbridgeState) => void;
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
 * Drawbridge - Headless wallet connection and session management
 *
 * Based on @latticexyz/drawbridge - a stripped down, headless version.
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
 * const drawbridge = new Drawbridge({
 *   chainId: 8453,
 *   chains: [baseChain],
 *   transports: { 8453: http() },
 *   connectors: [injected()],
 *   worldAddress: "0x..."
 * });
 *
 * // Initialize (await reconnection, setup watchers)
 * await drawbridge.initialize();
 *
 * // Get available wallets
 * const wallets = drawbridge.getAvailableConnectors();
 *
 * // Connect to wallet
 * await drawbridge.connectWallet(wallets[0].id);
 *
 * // Setup delegation if needed
 * if (!drawbridge.isReady) {
 *   await drawbridge.setupSession();
 * }
 *
 * // Disconnect
 * await drawbridge.disconnectWallet();
 * ```
 */
declare class Drawbridge {
    private config;
    private state;
    private listeners;
    private wagmiConfig;
    private accountWatcherCleanup;
    private isConnecting;
    private isDisconnecting;
    constructor(config: DrawbridgeConfig);
    /**
     * Validate configuration parameters
     *
     * Throws errors for invalid configuration to help developers catch issues early.
     * @private
     */
    private validateConfig;
    /**
     * Initialize Drawbridge (await reconnection and setup account watcher)
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
     * const unsubscribe = drawbridge.subscribe((state) => {
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
    getState(): DrawbridgeState;
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
     * 2. Account watcher will automatically handle drawbridge session creation
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
     * 2. Account watcher will automatically clear drawbridge state
     */
    disconnectWallet(): Promise<void>;
    getConnectorClient(): Promise<ConnectorClient>;
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
     * Cleanup and destroy drawbridge instance
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
    /** Get wagmi config (for advanced use cases like wallet transactions) */
    getWagmiConfig(): Config;
    /**
     * Get the public client for read operations.
     *
     * This is the single source of truth for all chain reads.
     * Use this client for:
     * - Reading contract state
     * - Checking balances
     * - Waiting for transaction receipts
     * - Any other read-only operations
     *
     * The client is set once in the constructor from the config.
     */
    getPublicClient(): PublicClient;
}

export { type ConnectedClient, type ConnectorClient, type ConnectorInfo, Drawbridge, type DrawbridgeConfig, type DrawbridgeState, DrawbridgeStatus, type PrerequisiteStatus, type PublicClient, type SessionClient };
