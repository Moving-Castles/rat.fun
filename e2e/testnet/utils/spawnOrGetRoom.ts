import { Hex } from "viem"
import { getComponentValue, runQuery, HasValue, Entity } from "@latticexyz/recs"
import { addressToId, generateRandomBytes32, SetupNetworkReturnType } from "server/internal"
import { ENTITY_TYPE } from "contracts/enums"

export async function spawnOrGetRoom(network: SetupNetworkReturnType) {
  const adminId = addressToId(network.walletClient.account.address) as Hex

  // Get all room ids owned by admin
  const ownedRoomIds = runQuery([
    HasValue(network.components.Owner, { value: adminId }),
    HasValue(network.components.EntityType, { value: ENTITY_TYPE.ROOM })
  ]) as Set<Entity>
  // Return the first room with a positive balance
  for (const roomId of ownedRoomIds) {
    const balance = getComponentValue(network.components.Balance, roomId)?.value ?? 0n
    console.log("room balance", balance)
    if (balance > 0n) {
      return roomId
    }
  }
  // Create a room if none found
  const roomId = generateRandomBytes32()
  await network.waitForTransaction(
    await network.worldContract.write.ratfun__createRoom([adminId, roomId, 500n, "test room"])
  )
  return roomId
}
