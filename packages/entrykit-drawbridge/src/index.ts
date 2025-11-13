/**
 * entrykit-drawbridge - Stripped down headless version of @latticexyz/entrykit
 */

// ===== Main API =====

export { EntryKit } from "./EntryKit"
export type { EntryKitConfig, EntryKitState, PrerequisiteStatus, ConnectorInfo } from "./EntryKit"

// ===== Core Types =====

export type { SessionClient, ConnectedClient } from "./core/types"
export type { Address, Hex, Client } from "viem"

// ===== Session Management (Advanced) =====

export { getSessionClient } from "./session/getSessionClient"
export { getSessionAccount } from "./session/getSessionAccount"
export { getSessionSigner } from "./session/getSessionSigner"
export { sessionStorage } from "./session/storage"

// ===== Delegation (Advanced) =====

export { checkDelegation } from "./delegation/checkDelegation"
export { setupSession } from "./delegation/setupSession"

// ===== Bundler (Advanced) =====

export { createBundlerClient } from "./bundler/createBundlerClient"
export { getBundlerTransport } from "./bundler/getBundlerTransport"
export { getPaymaster } from "./bundler/getPaymaster"
export type { Paymaster } from "./bundler/getPaymaster"

// ===== Utilities (Advanced - for EOA support) =====

export { defineCall } from "./utils/defineCall"
export { callWithSignature } from "./utils/callWithSignature"
export { signCall } from "./utils/signCall"
