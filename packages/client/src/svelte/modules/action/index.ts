import { addToSequencer } from "./actionSequencer"

const NAMESPACE = "ratroom__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  CreateRat = NAMESPACE + "createRat",
  LiquidateRat = NAMESPACE + "liquidateRat",
  CreateRoom = NAMESPACE + "createRoom",
  // Admin
  CreateRoomAsAdmin = NAMESPACE + "createRoomAsAdmin",
  DestroyRoomAsAdmin = NAMESPACE + "destroyRoomAsAdmin",
  addRoomBalance = NAMESPACE + "addRoomBalance",
  updateLevel = NAMESPACE + "updateLevel",
}

// --- API --------------------------------------------------------------

export function spawn(name: string) {
  return addToSequencer(WorldFunctions.Spawn, [name])
}

export function createRat(name: string) {
  return addToSequencer(WorldFunctions.CreateRat, [name])
}

export function liquidateRat(ratId: string) {
  return addToSequencer(WorldFunctions.LiquidateRat, [ratId])
}

export function createRoom(name: string, prompt: string ) {
  return addToSequencer(WorldFunctions.CreateRoom, [name, prompt])
}

// Admin

export function createRoomAsAdmin(name: string, prompt: string,levelId: string, extraBalance: number) {
  return addToSequencer(WorldFunctions.CreateRoomAsAdmin, [name, prompt, levelId, extraBalance])
}

export function destroyRoomAsAdmin(roomId: string) {
  return addToSequencer(WorldFunctions.DestroyRoomAsAdmin, [roomId])
}

export function addRoomBalance(roomId: string) {
  return addToSequencer(WorldFunctions.addRoomBalance, [roomId])
}

export function updateLevel(levelId: string, levelUpCost: number, roomCreationCost: number) {
  return addToSequencer(WorldFunctions.updateLevel, [levelId, levelUpCost, roomCreationCost])
}