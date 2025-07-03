import { Hex } from "viem"
import { resourceToHex } from "@latticexyz/common"
import { getRecord } from "@latticexyz/store/internal"
import worldMudConfig from "@latticexyz/world/mud.config"
import { network } from "@modules/mud/initMud"

/**
 * Check for unlimited delegation, similar to `world/src/Delegation.sol`.
 * Does not check for more specific delegation controls, as they are not expected to be used.
 */
export async function hasDelegation(delegator: Hex, delegatee: Hex): Promise<boolean> {
  const unlimitedDelegationControlId = resourceToHex({
    type: "system",
    namespace: "",
    name: "unlimited"
  })

  const result = await getRecord(network.publicClient, {
    address: network.worldContract.address,
    table: worldMudConfig.tables.world__UserDelegationControl,
    key: {
      delegator,
      delegatee
    }
  })
  return result.delegationControlId === unlimitedDelegationControlId
}
