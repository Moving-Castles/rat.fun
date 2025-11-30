import { Client, Chain, Transport, Account, Address, LocalAccount, PublicActions } from "viem"
import { SmartAccount } from "viem/account-abstraction"

/**
 * A viem public client with chain and public actions.
 * Used for all read operations (getBalance, readContract, etc.)
 */
export type PublicClient = Client<Transport, Chain> & PublicActions

/**
 * A viem client with an account (connected wallet).
 * Used for wallet operations like signing.
 */
export type WalletClient = Client<Transport, Chain, Account>

/**
 * A connected wallet client with account.
 * Generic over chain to support various chain configurations.
 * Used by setupSession for both EOA and Smart Account paths.
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
export type SessionClient = Client<Transport, Chain, SmartAccount> & {
  /** Original user's wallet address (the delegator) */
  readonly userAddress: Address
  /** MUD World contract address - all calls are routed through this */
  readonly worldAddress: Address
  /** Session private key - used for signing messages on behalf of session account */
  readonly internal_signer: LocalAccount
}
