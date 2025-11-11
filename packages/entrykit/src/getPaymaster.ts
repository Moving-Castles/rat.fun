import { Chain, Hex } from "viem"
import { BundlerClientConfig } from "viem/account-abstraction"
import { EntryKitConfig } from "./config/output"

export type Paymaster =
  | {
      readonly type: "simple"
      readonly address: Hex
    }
  | {
      readonly type: "custom"
      readonly address?: Hex
      readonly paymasterClient: BundlerClientConfig["paymaster"]
    }

export function getPaymaster(
  chain: Chain,
  paymasterOverride: EntryKitConfig["paymasterOverride"]
): Paymaster | undefined {
  const contracts = chain.contracts ?? {}

  if (paymasterOverride) {
    return {
      type: "custom",
      paymasterClient: paymasterOverride
    }
  }

  if ("paymaster" in contracts && contracts.paymaster != null) {
    if ("address" in contracts.paymaster) {
      return {
        type: "simple",
        address: contracts.paymaster.address
      }
    }
  }
}
