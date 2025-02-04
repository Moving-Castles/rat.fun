import { ENTITY_TYPE, ROOM_TYPE } from "contracts/enums"
import { Hex } from "viem"

declare global {

  type GameConfig = {
    adminAddress: Hex,
    adminId: Hex,
    globalRoomIndex: number,
    globalRatIndex: number,
    roomCreationCost: number,
    maxRoomPromptLength: number,
    maxInventorySize: number,
    maxLoadOutSize: number
    creatorFee: number
  }
  
  // * * * * * * * * * * * * * * * * *
  // DEFAULT ENTITY TYPE
  // * * * * * * * * * * * * * * * * *

  type GameEvent = {
    blockNumber: string
  }

  type Entity = {
    [key: string]: number | ENTITY_TYPE | Hex | boolean | string | string[] | undefined,
    entityType?: ENTITY_TYPE,
    name?: string,
    balance?: number,
    level?: number,
    value?: number,
    dead?: boolean,
    health?: number,
    traits?: string[],
    inventory?: string[],
    ownedRat?: Hex,
    owner?: Hex,
    roomPrompt?: string,
    roomType?: ROOM_TYPE,
    index?: number,
  }

  type Player  = {
    [key: string]: number | ENTITY_TYPE | Hex | string[],
    entityType: ENTITY_TYPE.PLAYER,
    balance: number,
    ownedRat: Hex,
    inventory: string[],
  }

  type Rat  = {
    [key: string]: number | ENTITY_TYPE | Hex | boolean | string[],
    entityType: ENTITY_TYPE.RAT,
    index: number,
    balance: number,
    level: number,
    owner: Hex,
    dead: boolean,
    health: number,
    traits: string[],
    inventory: string[],
  }

  type Room = {
    [key: string]: number | ENTITY_TYPE | string,
    entityType: ENTITY_TYPE.ROOM,
    owner: Hex,
    index: number,
    balance: number,
    level: number,
    roomPrompt: string,
    roomType: ROOM_TYPE
  }

  type Trait = {
    [key: string]: ENTITY_TYPE | string,
    entityType: ENTITY_TYPE.TRAIT,
    name: string,
    value: number
  }

  type Item = {
    [key: string]: ENTITY_TYPE | string,
    entityType: ENTITY_TYPE.ITEM,
    name: string,
    value: number
  }

  // * * * * * * * * * * * * * * * * *
  // GAME PLAY ENTITY TYPES
  // * * * * * * * * * * * * * * * * *

  type Entities = {
    [index: string]: Entity
  }

  type Players = {
    [index: string]: Player
  }

  type Rats = {
    [index: string]: Rat
  }

  type Rooms = {
    [index: string]: Room
  }

  type Traits = {
    [index: string]: Trait
  }

  type Items = {
    [index: string]: Item
  }
}