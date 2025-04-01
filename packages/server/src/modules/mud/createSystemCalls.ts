/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { OutcomeReturnValue } from "@modules/llm/types"
import { SetupNetworkResult } from "./setupNetwork"
import { Rat, Room } from "@routes/room/enter/types"
import { getOnchainData } from "./getOnchainData"
import { createOutcomeCallArgs, updateOutcome } from "./outcome"

export type SystemCalls = ReturnType<typeof createSystemCalls>

export function createSystemCalls(network: SetupNetworkResult) {
  const applyOutcome = async (
    rat: Rat,
    room: Room,
    outcome: OutcomeReturnValue
  ) => {
    const args = createOutcomeCallArgs(rat, room, outcome);
    const tx = await network.worldContract.write.ratroom__applyOutcome(args)
    await network.waitForTransaction(tx)

    // Suggested outcomes were sent to the chain
    // We get the new onchain state 
    // and update the outcome with the actual changes
    const newOnChainData = getOnchainData(
      network,
      network.components,
      rat.id,
      room.id
    )
    return updateOutcome(outcome, rat, newOnChainData.rat)
  }

  const createRoom = async (
    playerId: string,
    roomName: string,
    roomPrompt: string,
  ) => {
    const tx = await network.worldContract.write.ratroom__createRoom([
      playerId,
      roomName, 
      roomPrompt
    ])

    await network.waitForTransaction(tx)

    return true
  }

  return {
    applyOutcome,
    createRoom,
  }
}