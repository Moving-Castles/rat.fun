import { Address, Client } from "viem";
import { getRecord } from "@latticexyz/store/internal";
import { unlimitedDelegationControlId, worldTables } from "../common";

export type CheckDelegationParams = {
  client: Client;
  worldAddress: Address;
  userAddress: Address;
  sessionAddress: Address;
  blockTag?: "pending" | "latest";
};

export async function checkDelegation({
  client,
  worldAddress,
  userAddress,
  sessionAddress,
  blockTag = "pending",
}: CheckDelegationParams): Promise<boolean> {
  const record = await getRecord(client, {
    address: worldAddress,
    table: worldTables.UserDelegationControl,
    key: { delegator: userAddress, delegatee: sessionAddress },
    blockTag,
  });

  return record.delegationControlId === unlimitedDelegationControlId;
}
