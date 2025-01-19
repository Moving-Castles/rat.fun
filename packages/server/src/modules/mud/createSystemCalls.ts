/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { SetupNetworkResult } from "./setupNetwork";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(
  /*
   * The parameter list informs TypeScript that:
   *
   * - The first parameter is expected to be a
   *   SetupNetworkResult, as defined in setupNetwork.ts
   *
   *   Out of this parameter, we only care about two fields:
   *   - worldContract (which comes from getContract, see
   *     https://github.com/latticexyz/mud/blob/main/templates/vanilla/packages/client/src/mud/setupNetwork.ts#L63-L69).
   *
   *   - waitForTransaction (which comes from syncToRecs, see
   *     https://github.com/latticexyz/mud/blob/main/templates/vanilla/packages/client/src/mud/setupNetwork.ts#L77-L83).
   *
   * - From the second parameter, which is a ClientComponent,
   *   we only care about Counter. This parameter comes to use
   *   through createClientComponents.ts, but it originates in
   *   syncToRecs
   *   (https://github.com/latticexyz/mud/blob/main/templates/vanilla/packages/client/src/mud/setupNetwork.ts#L77-L83).
   */
  { worldContract, waitForTransaction }: SetupNetworkResult
) {
  const addTrait = async (ratId: string, newTrait: string ) => {
    const tx = await worldContract.write.ratroom__addTrait([ratId, newTrait]);
    await waitForTransaction(tx);
  };

  const removeTrait = async (ratId: string, traitId: string ) => {
    const tx = await worldContract.write.ratroom__removeTrait([ratId, traitId]);
    await waitForTransaction(tx);
  };

  const addItemToInventory = async (playerId: string, newTrait: string ) => {
    const tx = await worldContract.write.ratroom__addItemToInventory([playerId, newTrait]);
    await waitForTransaction(tx);
  };

  const clearLoadOut = async (ratId: string ) => {
    const tx = await worldContract.write.ratroom__clearLoadOut([ratId]);
    await waitForTransaction(tx);
  }

  const changeStat = async (ratId: string, statName: string, change: number, negative: boolean ) => {
    const tx = await worldContract.write.ratroom__changeStat([ratId, statName, change, negative]);
    await waitForTransaction(tx);
  };

  const changeRoomBalance = async (roomId: string, change: number, negative: boolean ) => {
    const tx = await worldContract.write.ratroom__changeRoomBalance([roomId, change, negative]);
    await waitForTransaction(tx);
  };

  return {
    addTrait,
    removeTrait,
    changeStat,
    changeRoomBalance,
    addItemToInventory,
    clearLoadOut
  };
}
