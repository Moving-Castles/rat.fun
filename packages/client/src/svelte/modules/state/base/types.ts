import { ENTITY_TYPE } from "contracts/enums"
import { Hex } from "viem"

declare global {

  type GameConfig = {
    adminAddress: string,
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
    dead?: boolean,
    health?: number,
    level?: number,
    traits?: string[],
    ownedRat?: Hex,
    owner?: Hex,
    roomPrompt?: string,
    roomIndex?: number,
  }

  type Player  = {
    [key: string]: number | ENTITY_TYPE | Hex,
    entityType: ENTITY_TYPE.PLAYER,
    balance: number,
    ownedRat: Hex,
  }

  type Rat  = {
    [key: string]: number | ENTITY_TYPE | Hex | boolean | string[],
    entityType: ENTITY_TYPE.RAT,
    owner: Hex,
    dead: boolean,
    health: number,
    level: number,
    traits: string[],
  }

  type Room = {
    [key: string]: number | ENTITY_TYPE | string,
    entityType: ENTITY_TYPE.ROOM,
    roomIndex: number,
    balance: number,
    roomPrompt: string,
  }

  type Trait = {
    [key: string]: ENTITY_TYPE | string,
    entityType: ENTITY_TYPE.TRAIT,
    name: string
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
}