/*
 * ========================================
 * state/stores.ts
 * ========================================
 * Central store for all entities in the game.
 */

import { writable, derived } from "svelte/store"
import { addressToId } from "$lib/modules/utils"
import { staticContent } from "$lib/modules/content"
import { ENTITY_TYPE } from "contracts/enums"
import {
  filterByEntitytype,
  filterByPlayer,
  filterActive,
  filterLiquidated,
  filterDepleted,
  filterNonDepleted,
  convertBigIntsToNumbers,
  getRatTotalValue
} from "./utils"
import { addressToNumber } from "$lib/modules/utils"
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

/**
 * Check if player is whitelisted for restricted trip folders
 */
export const playerIsWhitelisted = derived(
  [playerAddress, staticContent],
  ([$playerAddress, $staticContent]) =>
    $playerAddress &&
    $staticContent.tripFolderWhitelist?.some(
      addr => addr.toLowerCase() === $playerAddress.toLowerCase()
    )
)

export const player = derived(
  [entities, playerId],
  ([$entities, $playerId]) => $entities[$playerId] as Player
)

export const playerTrips = derived(
  [playerId, trips],
  ([$playerId, $trips]) => filterByPlayer($trips, $playerId) as Trips
)

export const nonDepletedTrips = derived([trips], ([$trips]) => {
  return filterNonDepleted($trips) as Trips
})

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
export const playerHasTokens = derived(
  playerERC20Balance,
  $playerERC20Balance => $playerERC20Balance > 0
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

export const playerHasLiveRat = derived([rat], ([$rat]) => !!($rat && !$rat.dead))

export const ratInventory = derived([rat, items], ([$rat, $items]) =>
  convertBigIntsToNumbers($rat?.inventory?.map(item => $items[item]) ?? ([] as Item[]))
)

export const ratTotalValue = derived([rat, ratInventory], ([$rat]) => getRatTotalValue($rat))

export const ratImageUrl = derived([player, staticContent], ([$player, $staticContent]) => {
  if (!$player?.currentRat || !$staticContent?.ratImages?.ratImages?.length) {
    return ""
  }
  const index = addressToNumber($player.currentRat, $staticContent.ratImages.ratImages.length - 1)

  const image = $staticContent.ratImages.ratImages[index]
  if (image) {
    const result = urlFor(image)
    if (result == "") {
      return false
    } else {
      return result.width(400).quality(100).auto("format").url()
    }
  } else {
    return ""
  }
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
  return $b - $i
})

export const portfolioClass = derived([profitLoss], ([$profitLoss]) => {
  if ($profitLoss === 0) return "neutral"
  return $profitLoss < 0 ? "downText" : "upText"
})

export const realisedInvestment = derived(playerDepletedTrips, $playerDepletedTrips =>
  Object.values($playerDepletedTrips).reduce((a, b) => a + Number(b.tripCreationCost), 0)
)

export const realisedBalance = derived(playerDepletedTrips, $playerDepletedTrips =>
  Object.values($playerDepletedTrips).reduce(
    (a, b) => a + (b?.liquidated ? Number(b.liquidationValue) : Number(b.tripCreationCost)),
    0
  )
)

export const realisedProfitLoss = derived(
  [realisedBalance, realisedInvestment],
  ([$rb, $i]) => $rb - $i
)

// * * * * * * * * * * * * * * * * *
// CHALLENGE WINNER
// * * * * * * * * * * * * * * * * *

/**
 * Returns the last challenge winner based on real-time MUD state.
 * Finds challenge trips with winners and returns the most recently won.
 */
export const lastChallengeWinner = derived([trips, players], ([$trips, $players]) => {
  // Find challenge trips with winners
  const completedChallenges = Object.entries($trips)
    .filter(([_, trip]) => trip.challengeTrip && trip.challengeWinner)
    .sort((a, b) => {
      // Sort by lastVisitBlock descending (most recent first)
      const aBlock = Number(a[1].lastVisitBlock ?? 0)
      const bBlock = Number(b[1].lastVisitBlock ?? 0)
      return bBlock - aBlock
    })

  if (completedChallenges.length === 0) return null

  const [tripId, trip] = completedChallenges[0]
  const winnerPlayer = $players[trip.challengeWinner as string]

  return {
    odId: trip.challengeWinner as string,
    tripId,
    winnerName: winnerPlayer?.name || "Unknown",
    lastVisitBlock: Number(trip.lastVisitBlock ?? 0)
  }
})
