import { Address } from "viem"
import { reconnect, connect, disconnect, getConnectors, getAccount, type Config } from "@wagmi/core"
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

/**
 * Connect to a wallet by connector ID
 *
 * @param wagmiConfig Wagmi configuration instance
 * @param connectorId Connector ID to connect to
 * @param chainId Optional chain ID to connect on
 * @throws If connector not found or connection fails
 *
 * @example
 * ```typescript
 * try {
 *   await connectWallet(wagmiConfig, "injected", 8453)
 *   console.log("Connected successfully")
 * } catch (err) {
 *   if (err.name === "ConnectorAlreadyConnectedError") {
 *     console.log("Already connected")
 *   } else {
 *     console.error("Connection failed:", err)
 *   }
 * }
 * ```
 */
export async function connectWallet(
  wagmiConfig: Config,
  connectorId: string,
  chainId?: number
): Promise<void> {
  const connectors = getConnectors(wagmiConfig)
  logger.log(
    "[wallet] Available connectors:",
    connectors.map(c => ({ id: c.id, name: c.name }))
  )

  const connector = connectors.find(c => c.id === connectorId)

  if (!connector) {
    throw new Error(`Connector not found: ${connectorId}`)
  }

  logger.log("[wallet] Connecting to wallet:", connectorId)
  logger.log("[wallet] Connector details:", {
    id: connector.id,
    name: connector.name,
    type: connector.type
  })
  logger.log("[wallet] Chain ID:", chainId)

  try {
    const result = await connect(wagmiConfig, {
      connector,
      chainId
    })
    logger.log("[wallet] Connection result:", result)
    logger.log("[wallet] Connection initiated")
  } catch (err) {
    logger.error("[wallet] Connection error:", err)
    logger.error("[wallet] Error name:", (err as Error)?.name)
    logger.error("[wallet] Error message:", (err as Error)?.message)
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
 * Get current account information
 *
 * @param wagmiConfig Wagmi configuration instance
 * @returns Current account state
 *
 * @example
 * ```typescript
 * const account = getCurrentAccount(wagmiConfig)
 * if (account.isConnected) {
 *   console.log("Connected:", account.address)
 * }
 * ```
 */
export function getCurrentAccount(wagmiConfig: Config) {
  return getAccount(wagmiConfig)
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
