/**
 * ========================================
 * state/base/types.ts
 * ========================================
 * Types for the on-chain entities of the game.
 */

import { type TableRecord } from "@latticexyz/store-sync"
import { type Hex } from "viem"
import { ENTITY_TYPE } from "contracts/enums"
import mudConfig from "contracts/mud.config"

type mudSchemas = {
  [table in keyof typeof mudConfig.namespaces.ratroom.tables]: TableRecord<
    (typeof mudConfig.namespaces.ratroom.tables)[table]
  >["fields"]
}

type mudComponents = {
  [table in keyof mudSchemas]: mudSchemas[table] extends { value: unknown }
    ? mudSchemas[table]["value"]
    : never
}

declare global {
  type GameConfigObject = mudSchemas["GameConfig"]

  type GameConfig = {
    gameConfig: GameConfigObject
    externalAddressesConfig: mudSchemas["ExternalAddressesConfig"]
    levelList: Hex[]
    worldPrompt: string
  }

  // * * * * * * * * * * * * * * * * *
  // DEFAULT ENTITY TYPE
  // * * * * * * * * * * * * * * * * *

  type GameEvent = {
    blockNumber: string
  }

  type Entity = {
    [key: string]:
      | number
      | bigint
      | ENTITY_TYPE
      | Hex
      | readonly Hex[]
      | boolean
      | string
      | GameConfigObject
      | mudSchemas["ExternalAddressesConfig"]
      | undefined
    entityType?: ENTITY_TYPE
    name?: mudComponents["Name"]
    balance?: mudComponents["Balance"]
    creationBlock?: mudComponents["CreationBlock"]
    lastVisitBlock?: mudComponents["LastVisitBlock"]
    level?: mudComponents["Level"]
    achievedLevels?: mudComponents["AchievedLevels"]
    value?: mudComponents["Value"]
    dead?: mudComponents["Dead"]
    health?: mudComponents["Health"]
    traits?: mudComponents["Traits"]
    inventory?: mudComponents["Inventory"]
    currentRat?: mudComponents["CurrentRat"]
    owner?: mudComponents["Owner"]
    prompt?: mudComponents["Prompt"]
    index?: mudComponents["Index"]
    roomCreationCost?: mudComponents["RoomCreationCost"]
    levelList?: mudComponents["LevelList"]
    levelMinBalance?: mudComponents["LevelMinBalance"]
    levelMaxBalance?: mudComponents["LevelMaxBalance"]
    visitCount?: mudComponents["VisitCount"]
    killCount?: mudComponents["KillCount"]
    masterKey?: mudComponents["MasterKey"]
  }

  type Player = {
    [key: string]: number | bigint | ENTITY_TYPE | Hex | readonly Hex[] | string | boolean
    entityType: ENTITY_TYPE.PLAYER
    name: mudComponents["Name"]
    achievedLevels: mudComponents["AchievedLevels"]
    balance: mudComponents["Balance"]
    currentRat: mudComponents["CurrentRat"]
    pastRats: mudComponents["PastRats"]
    creationBlock: mudComponents["CreationBlock"]
    masterKey: mudComponents["MasterKey"]
  }

  type Rat = {
    [key: string]: number | bigint | string | ENTITY_TYPE | Hex | readonly Hex[] | boolean
    entityType: ENTITY_TYPE.RAT
    name: mudComponents["Name"]
    index: mudComponents["Index"]
    balance: mudComponents["Balance"]
    level: mudComponents["Level"]
    owner: mudComponents["Owner"]
    dead: mudComponents["Dead"]
    health: mudComponents["Health"]
    traits: mudComponents["Traits"]
    inventory: mudComponents["Inventory"]
    creationBlock: mudComponents["CreationBlock"]
  }

  type Room = {
    [key: string]: number | bigint | ENTITY_TYPE | string
    entityType: ENTITY_TYPE.ROOM
    owner: mudComponents["Owner"]
    index: mudComponents["Index"]
    balance: mudComponents["Balance"]
    level: mudComponents["Level"]
    name: mudComponents["Name"]
    prompt: mudComponents["Prompt"]
    visitCount: mudComponents["VisitCount"]
    killCount: mudComponents["KillCount"]
    creationBlock: mudComponents["CreationBlock"]
    lastVisitBlock: mudComponents["LastVisitBlock"]
    roomCreationCost: mudComponents["RoomCreationCost"]
  }

  type Trait = {
    [key: string]: ENTITY_TYPE | string | bigint
    entityType: ENTITY_TYPE.TRAIT
    name: mudComponents["Name"]
    value: mudComponents["Value"]
  }

  type Item = {
    [key: string]: ENTITY_TYPE | string | bigint
    entityType: ENTITY_TYPE.ITEM
    name: mudComponents["Name"]
    value: mudComponents["Value"]
  }

  type Level = {
    [key: string]: ENTITY_TYPE | number | bigint | string
    entityType: ENTITY_TYPE.LEVEL
    index: mudComponents["Index"]
    name: mudComponents["Name"]
    levelMinBalance: mudComponents["LevelMinBalance"]
    levelMaxBalance: mudComponents["LevelMaxBalance"]
    roomCreationCost: mudComponents["RoomCreationCost"]
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
