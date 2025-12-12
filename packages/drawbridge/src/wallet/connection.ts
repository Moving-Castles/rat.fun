import { Address } from "viem"
import {
  reconnect,
  connect,
  disconnect,
  getConnectors,
  getAccount,
  type Config,
  switchChain
} from "@wagmi/core"
import { logger } from "../logger"

/**
 * Result of reconnection attempt
 */
export type ReconnectResult = {
  /** Whether reconnection was successful */
  reconnected: boolean
  /** Connected account address if reconnected */
  address?: Address
}

/**
 * Attempt to reconnect to previously connected wallet
 *
 * Checks localStorage for previous connection state and attempts to restore it.
 * This should be called during initialization.
 *
 * @param wagmiConfig Wagmi configuration instance
 * @returns Reconnection result
 *
 * @example
 * ```typescript
 * const result = await attemptReconnect(wagmiConfig)
 * if (result.reconnected) {
 *   console.log("Reconnected to:", result.address)
 *   // Handle reconnected state
 * } else {
 *   console.log("No previous connection")
 *   // Start in disconnected state
 * }
 * ```
 */
export async function attemptReconnect(wagmiConfig: Config): Promise<ReconnectResult> {
  try {
    await reconnect(wagmiConfig)

    const account = getAccount(wagmiConfig)
    if (account.isConnected && account.address) {
      logger.log("[wallet] Reconnection successful:", account.address)
      return {
        reconnected: true,
        address: account.address
      }
    }

    logger.log("[wallet] Reconnected but no account")
    return { reconnected: false }
  } catch (err) {
    logger.log("[wallet] No previous connection to restore")
    return { reconnected: false }
  }
}

export async function attemptSwitchChain(wagmiConfig: Config, chainId: number): Promise<void> {
  try {
    await switchChain(wagmiConfig, { chainId })
    logger.log("[wallet] Chain switch successful")
  } catch (switchError) {
    // Some wallets (e.g. Farcaster MiniApp) don't support wallet_switchEthereumChain
    // or wallet_addEthereumChain. Log and continue - the transaction may still work
    // if the wallet is already on the correct chain internally.
    const isUnsupportedMethod =
      switchError instanceof Error &&
      (switchError.name === "SwitchChainNotSupportedError" ||
        switchError.name === "UnsupportedProviderMethodError" ||
        switchError.message?.includes("does not support"))
    if (isUnsupportedMethod) {
      logger.warn(
        "[wallet] Chain switch failed - wallet does not support this method:",
        switchError
      )
    } else {
      logger.error("[wallet] Chain switch error:", switchError)
      throw switchError
    }
  }
}

/**
 * Connect to a wallet by connector ID
 *
 * @param wagmiConfig Wagmi configuration instance
 * @param connectorId Connector ID to connect to
 * @param chainId Chain ID to connect on
 * @throws If connector not found or connection fails
 *
 * @example
 * ```typescript
 * await attemptConnectWalletToChain(wagmiConfig, "injected", 8453)
 * console.log("Connected successfully")
 * ```
 */
export async function attemptConnectWalletToChain(
  wagmiConfig: Config,
  connectorId: string,
  chainId: number
): Promise<void> {
  const connectors = getConnectors(wagmiConfig)
  const connector = connectors.find(c => c.id === connectorId)

  if (!connector) {
    throw new Error(`Connector not found: ${connectorId}`)
  }

  logger.log("[wallet] Connecting to wallet:", connectorId)
  try {
    const account = getAccount(wagmiConfig)

    if (account.isConnected && account.connector?.uid === connector.uid) {
      // If already connected with this connector - check chain
      const currentChainId = await connector.getChainId()
      // If already on requested chain, no action needed
      if (currentChainId === chainId) {
        logger.log("[wallet] Already connected to requested chain")
        return
      }
      // Attempt to switch to requested chain
      logger.log("[wallet] Switching connector chain to:", chainId)
      await attemptSwitchChain(wagmiConfig, chainId)
    } else {
      // Not currently connected with this connector — proceed to connect
      await connect(wagmiConfig, { connector, chainId })
      logger.log("[wallet] Connection initiated")
    }
  } catch (err) {
    logger.error("[wallet] Connect error:", err)
    throw err
  }
}

/**
 * Disconnect the currently connected wallet
 *
 * Clears wagmi connection state and localStorage.
 *
 * @param wagmiConfig Wagmi configuration instance
 *
 * @example
 * ```typescript
 * await disconnectWallet(wagmiConfig)
 * console.log("Disconnected")
 * ```
 */
export async function disconnectWallet(wagmiConfig: Config): Promise<void> {
  logger.log("[wallet] Disconnecting...")

  try {
    await disconnect(wagmiConfig)
    logger.log("[wallet] Disconnected successfully")
  } catch (err) {
    logger.error("[wallet] Disconnect error:", err)
    throw err
  }
}

/**
 * Get list of available wallet connectors
 *
 * @param wagmiConfig Wagmi configuration instance
 * @returns Array of available connectors
 *
 * @example
 * ```typescript
 * const connectors = getAvailableConnectors(wagmiConfig)
 * console.log("Available wallets:", connectors.map(c => c.name))
 * ```
 */
export function getAvailableConnectors(wagmiConfig: Config) {
  return getConnectors(wagmiConfig)
}
