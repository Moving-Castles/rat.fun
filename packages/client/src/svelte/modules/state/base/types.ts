import { ENTITY_TYPE } from "contracts/enums"
import { Hex } from "viem"

declare global {
  // * * * * * * * * * * * * * * * * *
  // DEFAULT ENTITY TYPE
  // * * * * * * * * * * * * * * * * *

  type GameEvent = {
    blockNumber: string
  }

  type Entity = {
    [key: string]: any,
    entityType?: ENTITY_TYPE,
    name?: string,
    currency?: number,
    dead?: boolean,
    // Stats
    health?: number,
    level?: number,
    traits?: string[],
    ownedRat?: Hex,
    owner?: Hex,
    roomPrompt?: string,
    roomIndex?: number,
  }

  type Player  = {
    [key: string]: any,
    entityType: ENTITY_TYPE.PLAYER,
    currency: number,
    ownedRat: Hex,
  }

  type Rat  = {
    [key: string]: any,
    entityType: ENTITY_TYPE.RAT,
    owner: Hex,
    dead: boolean,
    health: number,
    level: number,
    traits: string[],
  }

  type Room = {
    [key: string]: any,
    entityType: ENTITY_TYPE.ROOM,
    roomIndex: number,
    roomPrompt: string
  }

  type Trait = {
    [key: string]: any,
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