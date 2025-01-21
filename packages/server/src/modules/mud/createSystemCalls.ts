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

  // Traits

  const addTrait = async (ratId: string, newTrait: string, value: number ) => {
    const tx = await worldContract.write.ratroom__addTrait([ratId, newTrait, value]);
    await waitForTransaction(tx);
  };

  const removeTrait = async (ratId: string, traitId: string ) => {
    const tx = await worldContract.write.ratroom__removeTrait([ratId, traitId]);
    await waitForTransaction(tx);
  };

  // Health

  const increaseHealth = async (ratId: string, change: number) => {
    const tx = await worldContract.write.ratroom__increaseHealth([ratId, change]);
    await waitForTransaction(tx);
  }

  const decreaseHealth = async (ratId: string, change: number) => {
    const tx = await worldContract.write.ratroom__decreaseHealth([ratId, change]);
    await waitForTransaction(tx);
  }

  // Room balance

  const increaseRoomBalance = async (roomId: string, change: number) => {
    const tx = await worldContract.write.ratroom__increaseRoomBalance([roomId, change]);
    await waitForTransaction(tx);
  };

  const decreaseRoomBalance = async (roomId: string, change: number) => {
    const tx = await worldContract.write.ratroom__decreaseRoomBalance([roomId, change]);
    await waitForTransaction(tx);
  };

  // ...

  const addItemToInventory = async (playerId: string, newTrait: string, value: number ) => {
    const tx = await worldContract.write.ratroom__addItemToInventory([playerId, newTrait, value]);
    await waitForTransaction(tx);
  };

  const clearLoadOut = async (ratId: string, roomId: string ) => {
    const tx = await worldContract.write.ratroom__clearLoadOut([ratId, roomId]);
    await waitForTransaction(tx);
  };

  const transferBalanceToPlayer = async (roomId: string, playerId: string, amount: number ) => {
    const tx = await worldContract.write.ratroom__transferBalanceToPlayer([roomId, playerId, amount]);
    await waitForTransaction(tx);
  };

  return {
    // Traits
    addTrait,
    removeTrait,
    // Health
    increaseHealth,
    decreaseHealth,
    // Room balance
    increaseRoomBalance,
    decreaseRoomBalance,
    // ...
    addItemToInventory,
    clearLoadOut,
    transferBalanceToPlayer
  };
}
