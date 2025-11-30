/**
 * drawbridge - Headless wallet connection and session management
 *
 * Based on @latticexyz/drawbridge - a stripped down, headless version.
 *
 * Public API: Use the Drawbridge class for wallet connection and session management.
 */

// ===== Public API =====

export { Drawbridge } from "./Drawbridge"
export type {
  DrawbridgeConfig,
  DrawbridgeState,
  PrerequisiteStatus,
  ConnectorInfo
} from "./Drawbridge"

export type { SessionClient, ConnectedClient, PublicClient } from "./types"
export { DrawbridgeStatus } from "./types"
