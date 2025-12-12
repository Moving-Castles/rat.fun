import { Address, Transport } from "viem"
import type { PaymasterClient } from "viem/account-abstraction"
import { transactionQueue } from "@latticexyz/common/actions"
import { SessionClient, DrawbridgeStatus, PublicClient, ConnectorClient } from "./types"
import { getSessionSigner } from "./session/core/signer"
import { getSessionAccount } from "./session/core/account"
import { getSessionClient } from "./session/core/client"
import { checkDelegation } from "./session/delegation/check"
import { setupSession, type SetupSessionStatus } from "./session/delegation/setup"
import { sessionStorage } from "./session/core/storage"
import { getAccount, getConnectorClient, type Config, type CreateConnectorFn } from "@wagmi/core"
import {
  createWalletConfig,
  setupAccountWatcher,
  attemptReconnect,
  attemptConnectWalletToChain,
  disconnectWallet as walletDisconnect,
  getAvailableConnectors as walletGetAvailableConnectors,
  attemptSwitchChain
} from "./wallet"
import { logger, setLoggingEnabled } from "./logger"

/**
 * Configuration for Drawbridge instance
 */
export type DrawbridgeConfig = {
  /** Public client */
  publicClient: PublicClient
  /** Transport for wallet client */
  transport: Transport
  /** Wallet connectors (injected, walletConnect, etc.) */
  connectors: CreateConnectorFn[]
  /** MUD World contract address (optional if skipSessionSetup is true) */
  worldAddress?: Address
  /** Optional paymaster client for sponsored transactions */
  paymasterClient?: PaymasterClient
  /** Optional polling interval for wagmi (in ms) */
  pollingInterval?: number
  /** Optional app name for wallet connectors */
  appName?: string
  /**
   * Current ETH price in USD for gas cost calculations
   * Used with $500 margin in fee cap: (ethPriceUSD + 500)
   * If not provided, defaults to $3,000
   */
  ethPriceUSD?: number
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
  skipSessionSetup?: boolean
  /**
   * Enable console logging for debugging
   * When false, all console.log and console.warn calls are suppressed.
   * Errors are always logged regardless of this setting.
   * @default false
   */
  logging?: boolean
}

/**
 * Current state of the Drawbridge instance
 * Updated reactively and broadcast to subscribers
 */
export type DrawbridgeState = {
  /** Current status of Drawbridge - single source of truth */
  status: DrawbridgeStatus
  /** Session client with MUD World extensions, null if not connected */
  sessionClient: SessionClient | null
  /** Original user's wallet address, null if not connected */
  userAddress: Address | null
  /** Session smart account address, null if not connected */
  sessionAddress: Address | null
  /** Whether session has delegation registered and is ready to use */
  isReady: boolean
  /** Error that occurred during connection or session setup, null if no error */
  error: Error | null
}

/**
 * Result of checking session prerequisites
 */
export type PrerequisiteStatus = {
  /** Whether delegation is registered in World contract */
  hasDelegation: boolean
  /** Whether session is fully ready (same as hasDelegation) */
  isReady: boolean
}

type StateListener = (state: DrawbridgeState) => void
type Unsubscribe = () => void

/**
 * Connector info for UI display
 */
export type ConnectorInfo = {
  id: string
  name: string
  type: string
}

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
export class Drawbridge {
  private config: DrawbridgeConfig
  private state: DrawbridgeState
  private listeners = new Set<StateListener>()
  private wagmiConfig: Config
  private accountWatcherCleanup: (() => void) | null = null
  private isConnecting = false
  private isDisconnecting = false

  constructor(config: DrawbridgeConfig) {
    // Validate configuration
    this.validateConfig(config)

    // Set logging state before any other operations
    setLoggingEnabled(config.logging ?? false)

    this.config = config
    this.state = {
      status: DrawbridgeStatus.UNINITIALIZED,
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false,
      error: null
    }

    // Get the chain from public client
    const chain = config.publicClient.chain

    logger.log("[drawbridge] Public client created for chain:", chain.name)

    // Create wagmi config for wallet connections
    this.wagmiConfig = createWalletConfig({
      chains: [chain],
      transports: { [chain.id]: config.transport },
      connectors: config.connectors,
      pollingInterval: config.pollingInterval
    })
  }

  /**
   * Validate configuration parameters
   *
   * Throws errors for invalid configuration to help developers catch issues early.
   * @private
   */
  private validateConfig(config: DrawbridgeConfig): void {
    // Warn if worldAddress missing with session setup enabled
    if (!config.skipSessionSetup && !config.worldAddress) {
      logger.warn(
        "[drawbridge] Configuration warning: worldAddress not provided but session setup is enabled. " +
          "Session creation will work, but delegation checks will fail. " +
          "Did you forget to pass worldAddress, or did you mean to set skipSessionSetup: true?"
      )
    }

    // Validate worldAddress if session setup is enabled
    if (!config.skipSessionSetup && config.worldAddress) {
      // Check that worldAddress is a valid hex address
      if (!/^0x[a-fA-F0-9]{40}$/.test(config.worldAddress)) {
        throw new Error(
          `Drawbridge configuration error: worldAddress "${config.worldAddress}" is not a valid Ethereum address. ` +
            `Expected format: 0x followed by 40 hexadecimal characters.`
        )
      }
    }
  }

  /**
   * Initialize Drawbridge (await reconnection and setup account watcher)
   *
   * This should be called once after construction and awaited.
   * It will attempt to reconnect to a previously connected wallet.
   */
  async initialize(): Promise<void> {
    logger.log("[drawbridge] Initializing...")

    // Attempt to reconnect to previously connected wallet
    const result = await attemptReconnect(this.wagmiConfig)

    if (!result.reconnected) {
      // No reconnection - set status to DISCONNECTED
      this.updateState({ status: DrawbridgeStatus.DISCONNECTED })
    }

    // Setup account watcher for future changes
    this.setupAccountWatcher()

    // If reconnection succeeded, manually handle the initial connection
    // (the watcher won't fire for connections that happened before it was set up)
    if (result.reconnected && result.address) {
      logger.log("[drawbridge] Processing reconnected wallet:", result.address)
      await this.handleWalletConnection()
    }

    logger.log("[drawbridge] Initialization complete")
  }

  // ===== Reactive State Management =====

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
  subscribe(listener: StateListener): Unsubscribe {
    this.listeners.add(listener)
    listener(this.state) // Immediate callback with current state
    return () => this.listeners.delete(listener)
  }

  /**
   * Get current state (non-reactive snapshot)
   *
   * For reactive updates, use subscribe() instead.
   */
  getState(): DrawbridgeState {
    return { ...this.state }
  }

  private updateState(updates: Partial<DrawbridgeState>): void {
    this.state = { ...this.state, ...updates }
    this.notify()
  }

  private notify(): void {
    this.listeners.forEach(listener => listener(this.state))
  }

  /**
   * Setup wagmi account watcher to handle connection/disconnection
   * Called automatically by initialize()
   */
  private setupAccountWatcher(): void {
    const unwatch = setupAccountWatcher(this.wagmiConfig, async account => {
      // Handle disconnection
      if (!account.isConnected) {
        logger.log("[drawbridge] Wallet disconnected")
        this.updateState({
          status: DrawbridgeStatus.DISCONNECTED,
          sessionClient: null,
          userAddress: null,
          sessionAddress: null,
          isReady: false,
          error: null
        })
        this.isConnecting = false
        return
      }

      // Ignore connection attempts while disconnecting to prevent deadlock
      if (this.isDisconnecting) {
        logger.log("[drawbridge] Ignoring connection attempt during disconnect")
        return
      }

      // Handle connection
      if (this.isConnecting) {
        logger.log("[drawbridge] Already processing connection")
        return
      }

      if (!account.connector || !account.address) {
        return
      }

      try {
        this.isConnecting = true
        await this.handleWalletConnection()
      } catch (err) {
        logger.error("[drawbridge] Connection handler failed:", {
          error: err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorName: err instanceof Error ? err.name : "Unknown",
          errorStack: err instanceof Error ? err.stack : undefined,
          timestamp: new Date().toISOString()
        })
        // Propagate error through state so UI can handle it
        this.updateState({
          status: DrawbridgeStatus.ERROR,
          error: err instanceof Error ? err : new Error(String(err))
        })
      } finally {
        this.isConnecting = false
      }
    })

    this.accountWatcherCleanup = unwatch
  }

  /**
   * Internal handler for wallet connection
   * Called when wagmi detects a connected account
   */
  private async handleWalletConnection(): Promise<void> {
    // Get wallet client from wagmi
    const account = getAccount(this.wagmiConfig)

    if (!account.isConnected || !account.address || !account.chain) {
      logger.log("[drawbridge] Wallet client missing account or chain")
      return
    }

    const userAddress = account.address
    logger.log("[drawbridge] Wallet connected:", userAddress)

    // TODO chain validation should not be necessary here? (unclear regarding callWithSignatureAlt or smart accounts)
    // Validate wallet is on the correct chain
    const expectedChainId = this.config.publicClient.chain.id
    const currentChainId = await account.connector?.getChainId()
    if (currentChainId !== expectedChainId) {
      const error = new Error(
        `Chain mismatch: wallet on chain ${currentChainId}, expected ${expectedChainId}`
      )
      logger.error("[drawbridge]", error.message)
      throw error
    }

    // If skipSessionSetup is true, just store the user address and mark as READY
    // No session account, no delegation - just wallet connection
    if (this.config.skipSessionSetup) {
      logger.log("[drawbridge] Skipping session setup (wallet-only mode)")
      this.updateState({
        status: DrawbridgeStatus.READY,
        sessionClient: null,
        userAddress,
        sessionAddress: null,
        isReady: true,
        error: null
      })
      return
    }

    // Full session setup flow (MUD delegation)
    logger.log("[drawbridge] Setting up session for address:", userAddress)

    // Get or create persistent session signer from localStorage
    const signer = getSessionSigner(userAddress)

    // DEBUG: Log details before creating session account
    logger.log("[drawbridge] About to create session account with publicClient:", {
      chainId: this.config.publicClient.chain?.id,
      chainName: this.config.publicClient.chain?.name,
      userAddress,
      timestamp: new Date().toISOString()
    })

    // Create ERC-4337 SimpleAccount smart wallet
    // Uses the dedicated publicClient for all chain reads
    const { account: sessionAccount } = await getSessionAccount({
      publicClient: this.config.publicClient,
      userAddress
    })

    // Create session client with MUD World callFrom/sendUserOperationFrom extensions
    // Uses the dedicated publicClient for MUD extension reads
    const sessionClient = await getSessionClient({
      publicClient: this.config.publicClient,
      userAddress,
      sessionAccount,
      sessionSigner: signer,
      worldAddress: this.config.worldAddress!,
      paymasterOverride: this.config.paymasterClient,
      ethPriceUSD: this.config.ethPriceUSD
    })

    // Check if delegation already exists BEFORE notifying listeners
    // This prevents UI flash where sessionClient exists but isReady is unknown
    let hasDelegation = false
    try {
      hasDelegation = await checkDelegation({
        client: this.config.publicClient,
        worldAddress: this.config.worldAddress!,
        userAddress,
        sessionAddress: sessionAccount.address
      })
    } catch (err) {
      logger.error("[drawbridge] Failed to check delegation:", err)
      throw new Error(
        `Failed to check delegation: ${err instanceof Error ? err.message : String(err)}`
      )
    }

    // Update state once with complete information
    // Set status to READY if delegation exists, CONNECTED if not
    // Clear any previous errors on successful connection
    this.updateState({
      status: hasDelegation ? DrawbridgeStatus.READY : DrawbridgeStatus.CONNECTED,
      sessionClient,
      userAddress,
      sessionAddress: account.address,
      isReady: hasDelegation,
      error: null
    })

    logger.log("[drawbridge] Session connection complete, isReady:", hasDelegation)
  }

  // ===== Public API =====

  /**
   * Get available wallet connectors for UI display
   *
   * @returns Array of connector info (id, name, type)
   */
  getAvailableConnectors(): ConnectorInfo[] {
    const connectors = walletGetAvailableConnectors(this.wagmiConfig)
    return connectors.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type
    }))
  }

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
  async connectWallet(connectorId: string): Promise<void> {
    logger.log("[drawbridge] Connecting to wallet:", connectorId)

    // Set status to CONNECTING
    this.updateState({ status: DrawbridgeStatus.CONNECTING })

    try {
      await attemptConnectWalletToChain(
        this.wagmiConfig,
        connectorId,
        this.config.publicClient.chain.id
      )
    } catch (err) {
      // Reset to DISCONNECTED on error
      this.updateState({ status: DrawbridgeStatus.DISCONNECTED })
      throw err
    }

    // Account watcher will handle the rest and set appropriate status
  }

  /**
   * Disconnect wallet and clear session
   *
   * This will:
   * 1. Disconnect via wagmi
   * 2. Account watcher will automatically clear drawbridge state
   */
  async disconnectWallet(): Promise<void> {
    logger.log("[drawbridge] disconnectWallet() called")
    logger.log("[drawbridge] Current state:", this.state)
    logger.log("[drawbridge] Calling wagmi disconnect()...")

    try {
      this.isDisconnecting = true
      await walletDisconnect(this.wagmiConfig)
      logger.log("[drawbridge] Wallet disconnected")
    } catch (err) {
      logger.error("[drawbridge] Disconnect error:", err)
      throw err
    } finally {
      this.isDisconnecting = false
    }

    logger.log("[drawbridge] Disconnect complete")
  }

  async getConnectorClient(): Promise<ConnectorClient> {
    const account = getAccount(this.wagmiConfig)
    if (!account.isConnected) {
      throw new Error("Not connected.")
    }
    // User's wallet may switch between different chains, ensure the current chain is correct
    const expectedChainId = this.config.publicClient.chain.id
    const currentChainId = await account.connector?.getChainId()
    if (currentChainId !== expectedChainId) {
      console.log(
        `[drawbridge] Chain mismatch: current=${currentChainId}, expected=${expectedChainId}, attempting switch`
      )
      await attemptSwitchChain(this.wagmiConfig, expectedChainId)
    }

    // Get connected wallet client from wagmi
    const connectorClient = await getConnectorClient(this.wagmiConfig)
    // Extend with writeContract and sendTransaction via MUD transactionQueue
    // The publicClient will be used in place of the wallet client for making public action calls
    return connectorClient.extend(transactionQueue({ publicClient: this.config.publicClient }))
  }

  /**
   * Check if session is ready to use
   *
   * Queries the MUD World contract to check if delegation is registered
   * between the user's account and the session account.
   *
   * @returns Delegation status
   */
  async checkPrerequisites(): Promise<PrerequisiteStatus> {
    if (!this.state.sessionClient) {
      return { hasDelegation: false, isReady: false }
    }

    const hasDelegation = await checkDelegation({
      client: this.config.publicClient,
      worldAddress: this.config.worldAddress!,
      userAddress: this.state.userAddress!,
      sessionAddress: this.state.sessionAddress!
    })

    this.updateState({ isReady: hasDelegation })

    return { hasDelegation, isReady: hasDelegation }
  }

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
  async setupSession(onStatus?: (status: SetupSessionStatus) => void): Promise<void> {
    if (this.config.skipSessionSetup) {
      throw new Error(
        "Cannot setup session when skipSessionSetup is true. This drawbridge instance is in wallet-only mode."
      )
    }

    if (!this.state.sessionClient) {
      throw new Error("Not connected. Call connectWallet() first.")
    }

    logger.log("[drawbridge] Setting up session (registering delegation)...")

    // Set status to SETTING_UP_SESSION
    this.updateState({ status: DrawbridgeStatus.SETTING_UP_SESSION })

    // Get current wallet client from wagmi
    const userClient = await this.getConnectorClient()

    try {
      await setupSession({
        publicClient: this.config.publicClient,
        userClient,
        sessionClient: this.state.sessionClient,
        worldAddress: this.config.worldAddress!,
        onStatus
      })

      // Session setup complete - set status to READY and clear any errors
      this.updateState({ status: DrawbridgeStatus.READY, isReady: true, error: null })

      logger.log("[drawbridge] Session setup complete")
    } catch (err) {
      // Reset to CONNECTED on error
      this.updateState({ status: DrawbridgeStatus.CONNECTED })
      throw err
    }
  }

  /**
   * Cleanup and destroy drawbridge instance
   *
   * This will:
   * 1. Unwatch account changes
   * 2. Clear session state (but NOT localStorage keys)
   *
   * Call this when unmounting your app.
   */
  destroy(): void {
    logger.log("[drawbridge] Destroying instance")

    // Cleanup account watcher
    if (this.accountWatcherCleanup) {
      this.accountWatcherCleanup()
      this.accountWatcherCleanup = null
    }

    // Clear state
    this.updateState({
      status: DrawbridgeStatus.DISCONNECTED,
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false,
      error: null
    })
  }

  /**
   * Clear stored session keys from localStorage
   *
   * This permanently removes the session private key for the current user.
   * Next time connect() is called, a new session account will be created.
   */
  clearStorage(): void {
    if (this.state.userAddress) {
      sessionStorage.removeSigner(this.state.userAddress)
    }
  }

  // ===== Convenience Getters =====

  /** Get current session client (null if not connected) */
  get sessionClient(): SessionClient | null {
    return this.state.sessionClient
  }

  /** Get current user address (null if not connected) */
  get userAddress(): Address | null {
    return this.state.userAddress
  }

  /** Get current session account address (null if not connected) */
  get sessionAddress(): Address | null {
    return this.state.sessionAddress
  }

  /** Check if session is ready (has delegation) */
  get isReady(): boolean {
    return this.state.isReady
  }

  /** Get wagmi config (for advanced use cases like wallet transactions) */
  getWagmiConfig(): Config {
    return this.wagmiConfig
  }

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
  getPublicClient(): PublicClient {
    return this.config.publicClient
  }
}
