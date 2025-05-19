import { addToSequencer } from "./actionSequencer"

const NAMESPACE = "ratroom__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  LiquidateRat = NAMESPACE + "liquidateRat",
  DropItem = NAMESPACE + "dropItem",
  CloseRoom = NAMESPACE + "closeRoom"
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