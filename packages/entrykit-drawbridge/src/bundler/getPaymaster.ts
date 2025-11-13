import { Chain, Hex } from "viem"
import type { PaymasterClient } from "viem/account-abstraction"

/**
 * Paymaster configuration
 *
 * Paymasters sponsor gas for user operations (ERC-4337).
 * Two types supported:
 *
 * - **simple**: Basic paymaster with just an address
 *   Returns paymaster address with empty data
 *
 * - **custom**: Advanced paymaster with client
 *   Uses provided PaymasterClient for dynamic sponsorship logic
 *   (e.g., Coinbase Paymaster, Pimlico, etc.)
 */
export type Paymaster =
  | {
      readonly type: "simple"
      readonly address: Hex
    }
  | {
      readonly type: "custom"
      readonly address?: Hex
      readonly paymasterClient: PaymasterClient
    }

/**
 * Get paymaster configuration for a chain
 *
 * Priority:
 * 1. Use paymasterOverride if provided (custom paymaster client)
 * 2. Check chain.contracts.paymaster for simple paymaster address
 * 3. Return undefined if no paymaster configured (user pays own gas)
 *
 * @param chain Chain configuration
 * @param paymasterOverride Optional custom paymaster client
 * @returns Paymaster config or undefined
 */
export function getPaymaster(
  chain: Chain,
  paymasterOverride?: PaymasterClient
): Paymaster | undefined {
  const contracts = chain.contracts ?? {}

  // Use custom paymaster if provided (e.g., Coinbase Paymaster)
  if (paymasterOverride) {
    return {
      type: "custom",
      paymasterClient: paymasterOverride
    }
  }

  // Check for simple paymaster in chain config
  if ("paymaster" in contracts && contracts.paymaster != null) {
    if ("address" in contracts.paymaster) {
      return {
        type: "simple",
        address: contracts.paymaster.address
      }
    }
  }

  // No paymaster configured - user pays own gas
  return undefined
}
