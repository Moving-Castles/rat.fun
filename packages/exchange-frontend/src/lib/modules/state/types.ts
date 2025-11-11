/**
 * ========================================
 * state/types.ts
 * ========================================
 * Types for the on-chain entities of the game.
 */

import { type TableRecord } from "@latticexyz/store-sync"
import { type Hex } from "viem"
import { ENTITY_TYPE } from "contracts/enums"
import mudConfig from "contracts/mud.config"

type mudSchemas = {
  [table in keyof typeof mudConfig.namespaces.ratfun.tables]: TableRecord<
    (typeof mudConfig.namespaces.ratfun.tables)[table]
  >["fields"]
}

type mudComponents = {
  [table in keyof mudSchemas]: mudSchemas[table] extends { value: unknown }
    ? mudSchemas[table]["value"]
    : never
}

declare global {
  type GameConfigObject = mudSchemas["GameConfig"]
  type GamePercentagesConfigObject = mudSchemas["GamePercentagesConfig"]
  type WorldEventObject = mudSchemas["WorldEvent"]
  type WorldStatsObject = mudSchemas["WorldStats"]
  type ExternalAddressesConfigObject = mudSchemas["ExternalAddressesConfig"]

  type WorldObject = {
    gameConfig: GameConfigObject
    gamePercentagesConfig: GamePercentagesConfigObject
    worldStats: WorldStatsObject
    externalAddressesConfig: ExternalAddressesConfigObject
    worldEvent: WorldEventObject
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
      | GamePercentagesConfigObject
      | ExternalAddressesConfigObject
      | WorldEventObject
      | WorldStatsObject
      | undefined
    entityType?: ENTITY_TYPE
    name?: mudComponents["Name"]
    balance?: mudComponents["Balance"]
    creationBlock?: mudComponents["CreationBlock"]
    lastVisitBlock?: mudComponents["LastVisitBlock"]
    value?: mudComponents["Value"]
    dead?: mudComponents["Dead"]
    inventory?: mudComponents["Inventory"]
    currentRat?: mudComponents["CurrentRat"]
    pastRats: mudComponents["PastRats"]
    owner?: mudComponents["Owner"]
    prompt?: mudComponents["Prompt"]
    index?: mudComponents["Index"]
    tripCreationCost?: mudComponents["TripCreationCost"]
    visitCount?: mudComponents["VisitCount"]
    killCount?: mudComponents["KillCount"]
    tripCount?: mudComponents["TripCount"]
    liquidated?: mudComponents["Liquidated"]
    liquidationValue?: mudComponents["LiquidationValue"]
    liquidationTaxPercentage?: mudComponents["LiquidationTaxPercentage"]
    liquidationBlock?: mudComponents["LiquidationBlock"]
    masterKey?: mudComponents["MasterKey"]
    // Gameconfig related fields
    gameConfig: GameConfigObject
    gamePercentagesConfig: GamePercentagesConfigObject
    externalAddressesConfig: ExternalAddressesConfigObject
    worldEvent: WorldEventObject
    worldStats: WorldStatsObject
  }

  type Player = {
    [key: string]: number | bigint | ENTITY_TYPE | Hex | readonly Hex[] | string | boolean
    entityType: ENTITY_TYPE.PLAYER
    name: mudComponents["Name"]
    balance: mudComponents["Balance"]
    currentRat: mudComponents["CurrentRat"]
    pastRats: mudComponents["PastRats"]
    creationBlock: mudComponents["CreationBlock"]
    masterKey: mudComponents["MasterKey"]
  }

  type Rat = {
    [key: string]:
      | number
      | bigint
      | string
      | ENTITY_TYPE
      | Hex
      | readonly Hex[]
      | boolean
      | undefined
    entityType: ENTITY_TYPE.RAT
    name: mudComponents["Name"]
    index: mudComponents["Index"]
    balance: mudComponents["Balance"]
    owner: mudComponents["Owner"]
    dead: mudComponents["Dead"]
    inventory: mudComponents["Inventory"]
    creationBlock: mudComponents["CreationBlock"]
    liquidated?: mudComponents["Liquidated"]
    liquidationValue?: mudComponents["LiquidationValue"]
    liquidationBlock?: mudComponents["LiquidationBlock"]
    liquidationTaxPercentage?: mudComponents["LiquidationTaxPercentage"]
  }

  type Trip = {
    [key: string]: number | bigint | ENTITY_TYPE | string | boolean | undefined
    entityType: ENTITY_TYPE.TRIP
    owner: mudComponents["Owner"]
    index: mudComponents["Index"]
    balance: mudComponents["Balance"]
    name: mudComponents["Name"]
    prompt: mudComponents["Prompt"]
    visitCount: mudComponents["VisitCount"]
    killCount: mudComponents["KillCount"]
    creationBlock: mudComponents["CreationBlock"]
    lastVisitBlock: mudComponents["LastVisitBlock"]
    tripCreationCost: mudComponents["TripCreationCost"]
    liquidated?: mudComponents["Liquidated"]
    liquidationValue?: mudComponents["LiquidationValue"]
    liquidationBlock?: mudComponents["LiquidationBlock"]
    liquidationTaxPercentage?: mudComponents["LiquidationTaxPercentage"]
  }

  type Item = {
    [key: string]: ENTITY_TYPE | string | bigint
    entityType: ENTITY_TYPE.ITEM
    name: mudComponents["Name"]
    value: mudComponents["Value"]
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

  type Trips = {
    [index: string]: Trip
  }

  type Items = {
    [index: string]: Item
  }
}
