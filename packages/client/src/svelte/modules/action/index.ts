import { addToSequencer } from "./actionSequencer"

const NAMESPACE = "ratroom__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  addItemToLoadOut = NAMESPACE + "addItemToLoadOut",
  removeItemFromLoadOut = NAMESPACE + "removeItemFromLoadOut",
  CreateRoom = NAMESPACE + "createRoom"
}

// --- API --------------------------------------------------------------

export function spawn() {
  return addToSequencer(WorldFunctions.Spawn, [])
}

export function createRoom(prompt: string) {
  return addToSequencer(WorldFunctions.CreateRoom, [prompt])
}

export function createRat() {
  return addToSequencer(WorldFunctions.CreateRat, [])
}

export function addItemToLoadOut(itemId: string) {
  return addToSequencer(WorldFunctions.addItemToLoadOut, [itemId])
}

export function removeItemFromLoadOut(itemId: string) {
  return addToSequencer(WorldFunctions.removeItemFromLoadOut, [itemId])
}