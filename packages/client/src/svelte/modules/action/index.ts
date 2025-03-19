import { ROOM_TYPE } from "contracts/enums"
import { addToSequencer } from "./actionSequencer"

const NAMESPACE = "ratroom__"

export enum WorldFunctions {
  Spawn = NAMESPACE + "spawn",
  LevelUp = NAMESPACE + "levelUp",
  CreateRat = NAMESPACE + "createRat",
  CreateRoom = NAMESPACE + "createRoom",
  CreateRoomAsAdmin = NAMESPACE + "createRoomAsAdmin",
  DestroyRoomAsAdmin = NAMESPACE + "destroyRoomAsAdmin",
  transferItemToInventory = NAMESPACE + "transferItemToInventory",
  transferItemToLoadOut = NAMESPACE + "transferItemToLoadOut",
  transferBalanceToPlayer = NAMESPACE + "transferBalanceToPlayer",
  transferBalanceToRat = NAMESPACE + "transferBalanceToRat",
  updateLevel = NAMESPACE + "updateLevel",
  addRoomBalance = NAMESPACE + "addRoomBalance",
}

// --- API --------------------------------------------------------------

export function spawn(name: string) {
  return addToSequencer(WorldFunctions.Spawn, [name])
}

export function levelUp() {
  return addToSequencer(WorldFunctions.LevelUp, [])
}

export function updateLevel(levelId: string, levelUpCost: number, roomCreationCost: number) {
  return addToSequencer(WorldFunctions.updateLevel, [levelId, levelUpCost, roomCreationCost])
}

export function createRoom(name: string, prompt: string, roomType: ROOM_TYPE) {
  return addToSequencer(WorldFunctions.CreateRoom, [name,prompt, roomType])
}

export function createRoomAsAdmin(name: string, prompt: string, roomType: ROOM_TYPE, levelId: string, extraBalance: number) {
  return addToSequencer(WorldFunctions.CreateRoomAsAdmin, [name,prompt, roomType, levelId, extraBalance])
}

export function destroyRoomAsAdmin(roomId: string) {
  return addToSequencer(WorldFunctions.DestroyRoomAsAdmin, [roomId])
}

export function addRoomBalance(roomId: string) {
  return addToSequencer(WorldFunctions.addRoomBalance, [roomId])
}

export function createRat(name: string) {
  return addToSequencer(WorldFunctions.CreateRat, [name])
}

export function transferItemToInventory(itemId: string) {
  return addToSequencer(WorldFunctions.transferItemToInventory, [itemId])
}

export function transferItemToLoadOut(itemId: string) {
  return addToSequencer(WorldFunctions.transferItemToLoadOut, [itemId])
}

export function transferBalanceToPlayer(amount: number) {
  return addToSequencer(WorldFunctions.transferBalanceToPlayer, [amount])
}

export function transferBalanceToRat(amount: number) {
  return addToSequencer(WorldFunctions.transferBalanceToRat, [amount])
}