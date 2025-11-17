import { Address, Client } from "viem"
import { getRecord } from "@latticexyz/store/internal"
import { unlimitedDelegationControlId, worldTables } from "../core/types"

export type CheckDelegationParams = {
  client: Client
  worldAddress: Address
  userAddress: Address
  sessionAddress: Address
  blockTag?: "pending" | "latest"
}

/**
 * Check if delegation exists in MUD World contract
 *
 * MUD World stores delegations in the UserDelegationControl table.
 * A delegation allows the session account (delegatee) to call World systems
 * on behalf of the user account (delegator).
 *
 * This function queries that table and checks if "unlimited" delegation exists,
 * which grants the session account full access to all systems.
 *
 * @param params Delegation check parameters
 * @returns true if unlimited delegation is registered, false otherwise
 */
export async function checkDelegation({
  client,
  worldAddress,
  userAddress,
  sessionAddress,
  blockTag = "pending"
}: CheckDelegationParams): Promise<boolean> {
  // Query MUD Store table: UserDelegationControl[delegator][delegatee]
  const record = await getRecord(client, {
    address: worldAddress,
    table: worldTables.UserDelegationControl,
    key: { delegator: userAddress, delegatee: sessionAddress },
    blockTag
  })

  // Check if the delegation type is "unlimited" (full system access)
  return record.delegationControlId === unlimitedDelegationControlId
}
