import { resourceToHex } from "@latticexyz/common"
import {
  Client,
  Chain,
  Transport,
  Account,
  parseAbi,
  ClientConfig,
  Address,
  LocalAccount
} from "viem"
import worldConfig from "@latticexyz/world/mud.config"
import { SmartAccount } from "viem/account-abstraction"

/**
 * A viem client with an account (connected wallet)
 */
export type ConnectedClient<chain extends Chain = Chain> = Client<Transport, chain, Account>

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
export type SessionClient<chain extends Chain = Chain> = Client<Transport, chain, SmartAccount> & {
  /** Original user's wallet address (the delegator) */
  readonly userAddress: Address
  /** MUD World contract address - all calls are routed through this */
  readonly worldAddress: Address
  /** Session private key - used for signing messages on behalf of session account */
  readonly internal_signer: LocalAccount
}

/**
 * EntryKit connection and setup status
 *
 * Provides a single source of truth for the current state of EntryKit.
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
export enum EntryKitStatus {
  /** EntryKit not yet initialized - call initializeEntryKit() */
  UNINITIALIZED = "uninitialized",

  /** EntryKit initialized but no wallet connected */
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
 * Default viem client configuration
 * Polling interval for watching blockchain state
 */
export const defaultClientConfig = {
  pollingInterval: 250
} as const satisfies Pick<ClientConfig, "pollingInterval">

/**
 * MUD delegation control ID for "unlimited" delegation
 *
 * This is a resource ID that identifies the unlimited delegation control system.
 * When a user delegates to a session account with this ID, the session account
 * can call any system in the World on behalf of the user.
 *
 * Format: system resource with namespace="" and name="unlimited"
 */
export const unlimitedDelegationControlId = resourceToHex({
  type: "system",
  namespace: "",
  name: "unlimited"
})

/**
 * MUD World table definitions from world config
 * Used to query World state (e.g., UserDelegationControl table)
 */
export const worldTables = worldConfig.namespaces.world.tables

/**
 * Minimal World ABI for delegation registration
 * Full ABI is large, we only need this one function
 */
export const worldAbi = parseAbi([
  "function registerDelegation(address delegatee, bytes32 delegationControlId, bytes initCallData)"
])
