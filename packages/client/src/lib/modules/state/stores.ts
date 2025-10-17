/*
 * ========================================
 * state/stores.ts
 * ========================================
 * Central store for all entities in the game.
 */

import { writable, derived, get } from "svelte/store"
import { addressToId } from "$lib/modules/utils"
import { blockNumber } from "$lib/modules/network"
import { ENTITY_TYPE } from "contracts/enums"
import {
  filterByEntitytype,
  filterByPlayer,
  filterByOthers,
  filterActive,
  filterLiquidated,
  filterDepleted,
  filterNonDepleted
} from "./utils"
import { addressToNumber } from "$lib/modules/utils"
import { staticContent } from "$lib/modules/content"
import { urlFor } from "$lib/modules/content/sanity"
import { playerERC20Balance, playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
import { WORLD_OBJECT_ID } from "./constants"

// * * * * * * * * * * * * * * * * *
// DEFAULT ENTITY TYPES
// * * * * * * * * * * * * * * * * *

/**
 * Mirror of the full on chain state.
 * Only ever written to via the update systems in module/ssystems
 */
export const entities = writable({} as Entities)

// * * * * * * * * * * * * * * * * *
// WORLD OBJECT ENTITIES
// * * * * * * * * * * * * * * * * *

export const worldObject = derived(
  entities,
  $entities => ($entities[WORLD_OBJECT_ID] || {}) as WorldObject
)

// GAME CONFIG
export const gameConfig = derived(worldObject, $worldObject => $worldObject.gameConfig)

// GAME PERCENTAGES CONFIG
export const gamePercentagesConfig = derived(
  worldObject,
  $worldObject => $worldObject.gamePercentagesConfig
)

// WORLD STATS
export const worldStats = derived(worldObject, $worldObject => $worldObject.worldStats)

// EXTERNAL ADDRESSES CONFIG
export const externalAddressesConfig = derived(
  worldObject,
  $worldObject => $worldObject.externalAddressesConfig
)

// WORLD EVENT
export const worldEvent = derived(worldObject, $worldObject => $worldObject.worldEvent)
export const activeWorldEvent = derived(
  [worldEvent, blockNumber],
  ([$worldEvent, $blockNumber]) => {
    if (!$worldEvent) {
      return undefined
    }
    if ($worldEvent.expirationBlock < $blockNumber) {
      return undefined
    }
    return $worldEvent
  }
)
export const activeWorldEventContent = derived(
  [staticContent, activeWorldEvent],
  ([$staticContent, $activeWorldEvent]) => {
    if (!$activeWorldEvent || !$staticContent.worldEvents) return undefined

    const event = $staticContent?.worldEvents.find(e => e._id === $activeWorldEvent.cmsId)

    if (event) {
      return event
    }

    return undefined
  }
)

// * * * * * * * * * * * * * * * * *
// GAME ELEMENT STORES
// * * * * * * * * * * * * * * * * *

export const players = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.PLAYER) as Players
)
export const rats = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.RAT) as Rats
)
export const trips = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.TRIP) as Trips
)
export const items = derived(
  entities,
  $entities => filterByEntitytype($entities, ENTITY_TYPE.ITEM) as Items
)

// * * * * * * * * * * * * * * * * *
// PLAYER
// * * * * * * * * * * * * * * * * *

export const playerAddress = writable("0x0" as string)

/**
 * Address in padded format
 */
export const playerId = derived(playerAddress, $playerAddress => addressToId($playerAddress))

export const player = derived(
  [entities, playerId],
  ([$entities, $playerId]) => $entities[$playerId] as Player
)

export const othersTrips = derived(
  [playerId, trips],
  ([$playerId, $trips]) => filterByOthers($trips, $playerId) as Trips
)

export const playerTrips = derived(
  [playerId, trips],
  ([$playerId, $trips]) => filterByPlayer($trips, $playerId) as Trips
)

export const playerActiveTrips = derived([playerTrips], ([$playerTrips]) => {
  return filterActive($playerTrips) as Trips
})

export const playerLiquidatedTrips = derived([playerTrips], ([$playerTrips]) => {
  return filterLiquidated($playerTrips) as Trips
})

export const playerDepletedTrips = derived([playerTrips], ([$playerTrips]) => {
  return filterDepleted($playerTrips) as Trips
})

export const playerNonDepletedTrips = derived([playerTrips], ([$playerTrips]) => {
  return filterNonDepleted($playerTrips) as Trips
})

// Player does not and have never had a rat
export const playerIsNew = derived(
  player,
  $player => $player?.currentRat === undefined && ($player?.pastRats?.length ?? 0) === 0
)

// Player has few tokens
export const playerIsBroke = derived(
  playerERC20Balance,
  $playerERC20Balance => $playerERC20Balance < 100
)

// export const playerHasNotGivenTokenAllowance
export const tokenAllowanceApproved = derived(
  playerERC20Allowance,
  $playerERC20Allowance => $playerERC20Allowance > 0
)

// * * * * * * * * * * * * * * * * *
// PLAYER RAT
// * * * * * * * * * * * * * * * * *

export const rat = derived([player, rats], ([$player, $rats]) => $rats[$player?.currentRat] as Rat)

export const ratInventory = derived(
  [rat, items],
  ([$rat, $items]) => $rat?.inventory?.map(item => $items[item]) ?? ([] as Item[])
)

export const ratImageUrl = derived([player, staticContent], ([$player, $staticContent]) => {
  if (!$player?.currentRat || !$staticContent?.ratImages?.ratImages?.length) {
    return ""
  }
  const index = addressToNumber($player.currentRat, $staticContent.ratImages.ratImages.length - 1)

  const url = urlFor($staticContent.ratImages.ratImages[index])
    ?.width(400)
    ?.quality(100)
    ?.auto("format")
    ?.url() as string

  return url ?? ""
})

/**
 * Calculated by adding up the balance and inventory value
 */
export const ratTotalValue = derived([rat, ratInventory], ([$rat, $ratInventory]) => {
  const totalValue = !$rat
    ? 0
    : Number($rat.balance ?? 0) + // Balance
      $ratInventory.reduce((acc, item) => acc + (item?.value ? Number(item.value) : 0), 0) // Inventory
  return totalValue
})

// * * * * * * * * * * * * * * * * *
// ADMIN STORES
// * * * * * * * * * * * * * * * * *

export const investment = derived(playerNonDepletedTrips, $playerNonDepletedTrips =>
  Object.values($playerNonDepletedTrips).reduce((a, b) => a + Number(b.tripCreationCost ?? 0), 0)
)

export const balance = derived(playerNonDepletedTrips, $playerNonDepletedTrips =>
  Object.values($playerNonDepletedTrips).reduce((a, b) => a + Number(b.balance ?? 0), 0)
)

export const profitLoss = derived([balance, investment], ([$b, $i]) => {
  // console.log("P L calculation", $b, $i)
  return $b - $i
})

export const portfolioClass = derived([profitLoss], ([$profitLoss]) => {
  if ($profitLoss === 0) return "neutral"
  return $profitLoss < 0 ? "downText" : "upText"
})

const untaxed = (value: number) =>
  Math.floor((Number(value) * 100) / (100 - Number(get(gamePercentagesConfig).taxationCloseTrip)))

export const realisedInvestment = derived(playerLiquidatedTrips, $playerLiquidatedTrips =>
  Object.values($playerLiquidatedTrips).reduce((a, b) => a + Number(b.tripCreationCost), 0)
)

export const realisedBalance = derived(playerLiquidatedTrips, $playerLiquidatedTrips =>
  Object.values($playerLiquidatedTrips).reduce((a, b) => a + Number(b.liquidationValue), 0)
)

export const realisedProfitLoss = derived(
  [realisedBalance, realisedInvestment],
  ([$rb, $i]) => $rb - $i
)
