import { ENTITY_TYPE } from "contracts/enums"
import { Hex } from "viem"

declare global {

  type GameConfigObject = {
    adminAddress: Hex,
    adminId: Hex,
    globalRoomIndex: number,
    globalRatIndex: number,
    maxRoomPromptLength: number,
    maxInventorySize: number,
    creatorFee: number,
  }

  type GameConfig = {
    gameConfig: GameConfigObject
    levelList: string[]
  }
  
  // * * * * * * * * * * * * * * * * *
  // DEFAULT ENTITY TYPE
  // * * * * * * * * * * * * * * * * *

  type GameEvent = {
    blockNumber: string
  }

  type Entity = {
    [key: string]: number | ENTITY_TYPE | Hex | boolean | string | string[] | GameConfigObject | undefined,
    entityType?: ENTITY_TYPE,
    name?: string,
    balance?: number,
    creationBlock?: number,
    level?: Hex,
    value?: number,
    dead?: boolean,
    health?: number,
    traits?: string[],
    inventory?: string[],
    ownedRat?: Hex,
    owner?: Hex,
    roomPrompt?: string,
    index?: number,
    levelUpCost: number,
    roomCreationCost: number,
    levelList: string[],
    gameConfig: GameConfigObject,
    visitCount: number,
    killCount: number
  }

  type Player  = {
    [key: string]: number | ENTITY_TYPE | Hex | string[],
    entityType: ENTITY_TYPE.PLAYER,
    balance: number,
    ownedRat: Hex,
    creationBlock: number
  }

  type Rat  = {
    [key: string]: number | string | ENTITY_TYPE | Hex | boolean | string[],
    entityType: ENTITY_TYPE.RAT,
    name: string,
    index: number,
    balance: number,
    level: Hex,
    owner: Hex,
    dead: boolean,
    health: number,
    traits: string[],
    inventory: string[],
    creationBlock: number
  }

  type Room = {
    [key: string]: number | ENTITY_TYPE | string,
    entityType: ENTITY_TYPE.ROOM,
    owner: Hex,
    index: number,
    balance: number,
    level: Hex,
    name: string,
    roomPrompt: string,
    visitCount: number,
    killCount: number,
    creationBlock: number
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

  type Level = {
    [key: string]: ENTITY_TYPE | number,
    entityType: ENTITY_TYPE.LEVEL,
    index: number,
    levelUpCost: number,
    roomCreationCost: number
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

  type Levels = {
    [index: string]: Level
  }
}