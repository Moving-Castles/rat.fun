import { addToSequencer } from "./actionSequencer"

const NAMESPACE = "ratroom__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  LiquidateRat = NAMESPACE + "liquidateRat",
  DropItem = NAMESPACE + "dropItem",
  CloseRoom = NAMESPACE + "closeRoom",
  Approve = "ERC20-approve"
}

// --- API --------------------------------------------------------------

export function spawn(name: string) {
  return addToSequencer(WorldFunctions.Spawn, [name])
}

export function createRat(name: string) {
  return addToSequencer(WorldFunctions.CreateRat, [name])
}

export function liquidateRat() {
  return addToSequencer(WorldFunctions.LiquidateRat, [])
}

export function dropItem(itemId: string) {
  return addToSequencer(WorldFunctions.DropItem, [itemId])
}

export function closeRoom(roomId: string) {
  return addToSequencer(WorldFunctions.CloseRoom, [roomId])
}

export function approve(address: string, value: bigint) {
  const scaledValue = value * 10n ** 18n
  return addToSequencer(WorldFunctions.Approve, [address, scaledValue])
}