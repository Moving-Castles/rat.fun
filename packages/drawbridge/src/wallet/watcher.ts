import { watchAccount, type Config } from "@wagmi/core"
import type { GetAccountReturnType } from "@wagmi/core"
import { logger } from "../logger"

/**
 * Account change handler callback
 *
 * Called whenever the connected wallet account changes (connect, disconnect, switch).
 */
export type AccountChangeHandler = (account: GetAccountReturnType) => void | Promise<void>

/**
 * Cleanup function returned by setupAccountWatcher
 *
 * Call this to stop watching for account changes.
 */
export type UnwatchAccount = () => void

/**
 * Setup wagmi account watcher
 *
 * Watches for wallet connection state changes and calls the provided handler.
 *
 * Changes detected:
 * - Wallet connected
 * - Wallet disconnected
 * - Account switched
 * - Chain switched
 *
 * @param wagmiConfig Wagmi configuration instance
 * @param onChange Handler called on account changes
 * @returns Cleanup function to stop watching
 *
 * @example
 * ```typescript
 * const unwatch = setupAccountWatcher(wagmiConfig, async (account) => {
 *   if (account.isConnected) {
 *     console.log("Connected:", account.address)
 *     await handleConnection(account)
 *   } else {
 *     console.log("Disconnected")
 *     await handleDisconnection()
 *   }
 * })
 *
 * // Later, stop watching
 * unwatch()
 * ```
 */
export function setupAccountWatcher(
  wagmiConfig: Config,
  onChange: AccountChangeHandler
): UnwatchAccount {
  return watchAccount(wagmiConfig, {
    onChange: account => {
      logger.log("[wallet] Account change:", {
        isConnected: account.isConnected,
        address: account.address
      })

      // Call handler (may be async)
      const result = onChange(account)
      if (result instanceof Promise) {
        result.catch(err => {
          logger.error("[wallet] Account change handler failed:", err)
        })
      }
    }
  })
}
