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
    health?: number,
    mass?: number,
    cooldown?: number,
    event?: GameEvent
  }

  type Player  = {
    [key: string]: any,
    entityType: ENTITY_TYPE.PLAYER,
    name?: string,
    health?: number,
    mass?: number,
    cooldown?: number,
    event?: GameEvent
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
}
