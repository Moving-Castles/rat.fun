// This file is deprecated - use index.ts exports instead
// Kept for backwards compatibility during migration
import { userAddress } from "./index"

/**
 * @deprecated Use `userAddress` from "./index" instead
 * For wallet-only mode, entryKitSession is always null (no session client)
 */
export const entryKitSession = { subscribe: () => () => {} }

/**
 * @deprecated No longer needed - EntryKit manages wagmi config internally
 */
export const wagmiConfigStateful = { subscribe: () => () => {} }

/**
 * @deprecated No longer needed - use ConnectButton component instead
 */
export const entryKitButton = { subscribe: () => () => {} }

// Export the new userAddress store for compatibility
export { userAddress }
