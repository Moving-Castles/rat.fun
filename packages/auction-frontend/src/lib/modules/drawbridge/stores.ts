// This file is deprecated - use index.ts exports instead
// Kept for backwards compatibility during migration
import { userAddress } from "./index"

/**
 * @deprecated Use `userAddress` from "./index" instead
 * For wallet-only mode, drawbridgeSession is always null (no session client)
 */
export const drawbridgeSession = { subscribe: () => () => {} }

/**
 * @deprecated No longer needed - drawbridge manages wagmi config internally
 */
export const wagmiConfigStateful = { subscribe: () => () => {} }

/**
 * @deprecated No longer needed - use ConnectButton component instead
 */
export const drawbridgeButton = { subscribe: () => () => {} }

// Export the new userAddress store for compatibility
export { userAddress }
