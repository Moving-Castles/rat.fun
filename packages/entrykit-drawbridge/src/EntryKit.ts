import { Address, Chain, Client, Transport } from "viem"
import type { PaymasterClient } from "viem/account-abstraction"
import { SessionClient, EntryKitStatus } from "./core/types"
import { getSessionSigner } from "./session/getSessionSigner"
import { getSessionAccount } from "./session/getSessionAccount"
import { getSessionClient } from "./session/getSessionClient"
import { checkDelegation } from "./delegation/checkDelegation"
import { setupSession, type SetupSessionStatus } from "./delegation/setupSession"
import { sessionStorage } from "./session/storage"
import {
  createConfig,
  createStorage,
  reconnect,
  watchAccount,
  connect,
  disconnect,
  getConnectorClient,
  getConnectors,
  getAccount,
  type Config,
  type CreateConnectorFn
} from "@wagmi/core"

/**
 * Configuration for EntryKit instance
 */
export type EntryKitConfig = {
  /** Chain ID to operate on */
  chainId: number
  /** Supported chains */
  chains: readonly [Chain, ...Chain[]]
  /** Transport configuration per chain */
  transports: Record<number, Transport>
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
}

/**
 * Current state of the EntryKit instance
 * Updated reactively and broadcast to subscribers
 */
export type EntryKitState = {
  /** Current status of EntryKit - single source of truth */
  status: EntryKitStatus
  /** Session client with MUD World extensions, null if not connected */
  sessionClient: SessionClient | null
  /** Original user's wallet address, null if not connected */
  userAddress: Address | null
  /** Session smart account address, null if not connected */
  sessionAddress: Address | null
  /** Whether session has delegation registered and is ready to use */
  isReady: boolean
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

type StateListener = (state: EntryKitState) => void
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
export class EntryKit {
  private config: EntryKitConfig
  private state: EntryKitState
  private listeners = new Set<StateListener>()
  private wagmiConfig: Config
  private accountWatcherCleanup: (() => void) | null = null
  private isConnecting = false
  private isDisconnecting = false

  constructor(config: EntryKitConfig) {
    this.config = config
    this.state = {
      status: EntryKitStatus.UNINITIALIZED,
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false
    }

    // Create wagmi config
    this.wagmiConfig = createConfig({
      chains: config.chains,
      transports: config.transports,
      connectors: config.connectors,
      pollingInterval: config.pollingInterval,
      storage: createStorage({
        storage: typeof window !== "undefined" ? window.localStorage : undefined
      })
    })
  }

  /**
   * Initialize EntryKit (await reconnection and setup account watcher)
   *
   * This should be called once after construction and awaited.
   * It will attempt to reconnect to a previously connected wallet.
   */
  async initialize(): Promise<void> {
    console.log("[entrykit-drawbridge] Initializing...")

    // Attempt to reconnect to previously connected wallet
    let reconnected = false
    try {
      await reconnect(this.wagmiConfig)
      reconnected = true
      console.log("[entrykit-drawbridge] Reconnection successful")
    } catch (err) {
      console.log("[entrykit-drawbridge] No previous connection to restore")
      // No reconnection - set status to DISCONNECTED
      this.updateState({ status: EntryKitStatus.DISCONNECTED })
    }

    // Setup account watcher for future changes
    this.setupAccountWatcher()

    // If reconnection succeeded, manually handle the initial connection
    // (the watcher won't fire for connections that happened before it was set up)
    if (reconnected) {
      const account = getAccount(this.wagmiConfig)
      if (account.isConnected && account.address) {
        console.log("[entrykit-drawbridge] Processing reconnected wallet:", account.address)
        await this.handleWalletConnection()
      }
    }

    console.log("[entrykit-drawbridge] Initialization complete")
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
  getState(): EntryKitState {
    return { ...this.state }
  }

  private updateState(updates: Partial<EntryKitState>): void {
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
    const unwatch = watchAccount(this.wagmiConfig, {
      onChange: async account => {
        console.log("[entrykit-drawbridge] Account change:", {
          isConnected: account.isConnected,
          address: account.address
        })

        // Handle disconnection
        if (!account.isConnected) {
          console.log("[entrykit-drawbridge] Wallet disconnected")
          this.updateState({
            status: EntryKitStatus.DISCONNECTED,
            sessionClient: null,
            userAddress: null,
            sessionAddress: null,
            isReady: false
          })
          this.isConnecting = false
          return
        }

        // Ignore connection attempts while disconnecting to prevent deadlock
        if (this.isDisconnecting) {
          console.log("[entrykit-drawbridge] Ignoring connection attempt during disconnect")
          return
        }

        // Handle connection
        if (this.isConnecting) {
          console.log("[entrykit-drawbridge] Already processing connection")
          return
        }

        if (!account.connector || !account.address) {
          return
        }

        try {
          this.isConnecting = true
          await this.handleWalletConnection()
        } catch (err) {
          console.error("[entrykit-drawbridge] Connection handler failed:", err)
        } finally {
          this.isConnecting = false
        }
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
    let userClient: Client
    try {
      userClient = await getConnectorClient(this.wagmiConfig)
    } catch (err) {
      console.log("[entrykit-drawbridge] Could not get connector client")
      return
    }

    if (!userClient.account || !userClient.chain) {
      console.log("[entrykit-drawbridge] Wallet client missing account or chain")
      return
    }

    const userAddress = userClient.account.address
    console.log("[entrykit-drawbridge] Wallet connected:", userAddress)

    // If skipSessionSetup is true, just store the user address and mark as READY
    // No session account, no delegation - just wallet connection
    if (this.config.skipSessionSetup) {
      console.log("[entrykit-drawbridge] Skipping session setup (wallet-only mode)")
      this.updateState({
        status: EntryKitStatus.READY,
        sessionClient: null,
        userAddress,
        sessionAddress: null,
        isReady: true
      })
      return
    }

    // Full session setup flow (MUD delegation)
    console.log("[entrykit-drawbridge] Setting up session for address:", userAddress)

    // Get or create persistent session signer from localStorage
    const signer = getSessionSigner(userAddress)

    // Create ERC-4337 SimpleAccount smart wallet
    const { account } = await getSessionAccount({
      client: userClient as any,
      userAddress
    })

    // Create session client with MUD World callFrom/sendUserOperationFrom extensions
    const sessionClient = await getSessionClient({
      userAddress,
      sessionAccount: account,
      sessionSigner: signer,
      worldAddress: this.config.worldAddress!,
      paymasterOverride: this.config.paymasterClient
    })

    // Check if delegation already exists BEFORE notifying listeners
    // This prevents UI flash where sessionClient exists but isReady is unknown
    const hasDelegation = await checkDelegation({
      client: sessionClient,
      worldAddress: this.config.worldAddress!,
      userAddress,
      sessionAddress: account.address
    })

    // Update state once with complete information
    // Set status to READY if delegation exists, CONNECTED if not
    this.updateState({
      status: hasDelegation ? EntryKitStatus.READY : EntryKitStatus.CONNECTED,
      sessionClient,
      userAddress,
      sessionAddress: account.address,
      isReady: hasDelegation
    })

    console.log("[entrykit-drawbridge] Session connection complete, isReady:", hasDelegation)
  }

  // ===== Public API =====

  /**
   * Get available wallet connectors for UI display
   *
   * @returns Array of connector info (id, name, type)
   */
  getAvailableConnectors(): ConnectorInfo[] {
    const connectors = getConnectors(this.wagmiConfig)
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
   * 2. Account watcher will automatically handle EntryKit session creation
   *
   * @param connectorId Connector ID (from getAvailableConnectors())
   * @throws If connector not found or connection fails
   */
  async connectWallet(connectorId: string): Promise<void> {
    const connectors = getConnectors(this.wagmiConfig)
    const connector = connectors.find(c => c.id === connectorId)

    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`)
    }

    console.log("[entrykit-drawbridge] Connecting to wallet:", connectorId)

    // Set status to CONNECTING
    this.updateState({ status: EntryKitStatus.CONNECTING })

    try {
      await connect(this.wagmiConfig, {
        connector,
        chainId: this.config.chainId
      })
    } catch (err) {
      // If already connected, that's fine
      if (err instanceof Error && err.name === "ConnectorAlreadyConnectedError") {
        console.log("[entrykit-drawbridge] Already connected")
        return
      }
      // Reset to DISCONNECTED on error
      this.updateState({ status: EntryKitStatus.DISCONNECTED })
      throw err
    }

    // Account watcher will handle the rest and set appropriate status
  }

  /**
   * Disconnect wallet and clear session
   *
   * This will:
   * 1. Disconnect via wagmi
   * 2. Account watcher will automatically clear EntryKit state
   */
  async disconnectWallet(): Promise<void> {
    console.log("[entrykit-drawbridge] disconnectWallet() called")
    console.log("[entrykit-drawbridge] Current state:", this.state)
    console.log("[entrykit-drawbridge] Calling wagmi disconnect()...")

    try {
      this.isDisconnecting = true
      await disconnect(this.wagmiConfig)
      console.log("[entrykit-drawbridge] wagmi disconnect() returned")
    } catch (err) {
      console.error("[entrykit-drawbridge] wagmi disconnect() threw error:", err)
      throw err
    } finally {
      this.isDisconnecting = false
    }

    console.log("[entrykit-drawbridge] Disconnect complete")
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
      client: this.state.sessionClient,
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
        "Cannot setup session when skipSessionSetup is true. This EntryKit instance is in wallet-only mode."
      )
    }

    if (!this.state.sessionClient) {
      throw new Error("Not connected. Call connectWallet() first.")
    }

    console.log("[entrykit-drawbridge] Setting up session (registering delegation)...")

    // Set status to SETTING_UP_SESSION
    this.updateState({ status: EntryKitStatus.SETTING_UP_SESSION })

    // Get current wallet client from wagmi
    const userClient = await getConnectorClient(this.wagmiConfig)

    try {
      await setupSession({
        client: userClient,
        userClient,
        sessionClient: this.state.sessionClient,
        worldAddress: this.config.worldAddress!,
        onStatus
      })

      // Session setup complete - set status to READY
      this.updateState({ status: EntryKitStatus.READY, isReady: true })

      console.log("[entrykit-drawbridge] Session setup complete")
    } catch (err) {
      // Reset to CONNECTED on error
      this.updateState({ status: EntryKitStatus.CONNECTED })
      throw err
    }
  }

  /**
   * Cleanup and destroy EntryKit instance
   *
   * This will:
   * 1. Unwatch account changes
   * 2. Clear session state (but NOT localStorage keys)
   *
   * Call this when unmounting your app.
   */
  destroy(): void {
    console.log("[entrykit-drawbridge] Destroying instance")

    // Cleanup account watcher
    if (this.accountWatcherCleanup) {
      this.accountWatcherCleanup()
      this.accountWatcherCleanup = null
    }

    // Clear state
    this.updateState({
      status: EntryKitStatus.DISCONNECTED,
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false
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

  /** Get wagmi config (for advanced use cases like transactions) */
  getWagmiConfig(): Config {
    return this.wagmiConfig
  }
}
