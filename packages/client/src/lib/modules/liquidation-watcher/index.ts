/**
 * Liquidation Watcher Module
 *
 * Watches for trips becoming liquidated via onchain state changes
 * and adds corresponding feed messages to the operator feed.
 */

import { get, type Unsubscriber } from "svelte/store"
import { trips, players } from "$lib/modules/state/stores"
import { addFeedMessage } from "$lib/components/OperatorFeed/state.svelte"
import { FEED_MESSAGE_TYPE } from "$lib/components/OperatorFeed/Feed/types"
import { createLogger } from "$lib/modules/logger"

const logger = createLogger("[LiquidationWatcher]")

// Track liquidated trip IDs to avoid duplicate messages
const knownLiquidatedTrips = new Set<string>()

// Store the subscription for cleanup
let tripsUnsubscribe: Unsubscriber | null = null

// Flag to skip initial state (don't create messages for already-liquidated trips on load)
let isInitialized = false

/**
 * Initialize the liquidation watcher.
 * Should be called after entities are initialized.
 */
export function initLiquidationWatcher(): void {
  if (tripsUnsubscribe) {
    logger.log("Already initialized, skipping")
    return
  }

  // First, populate known liquidated trips from current state (skip these on initial load)
  const currentTrips = get(trips)
  for (const [tripId, trip] of Object.entries(currentTrips)) {
    if (trip.liquidated) {
      knownLiquidatedTrips.add(tripId)
    }
  }

  logger.log("Initialized with", knownLiquidatedTrips.size, "existing liquidated trips")

  // Mark as initialized after first tick
  setTimeout(() => {
    isInitialized = true
    logger.log("Now watching for new liquidations")
  }, 0)

  // Subscribe to trips store to detect liquidation changes
  tripsUnsubscribe = trips.subscribe($trips => {
    if (!isInitialized) return

    for (const [tripId, trip] of Object.entries($trips)) {
      // Check if this trip just became liquidated
      if (trip.liquidated && !knownLiquidatedTrips.has(tripId)) {
        knownLiquidatedTrips.add(tripId)
        handleTripLiquidated(tripId, trip)
      }
    }
  })
}

/**
 * Handle a trip being liquidated - create and add the feed message.
 */
function handleTripLiquidated(tripId: string, trip: Trip): void {
  const $players = get(players)
  const owner = $players[trip.owner as string]
  const ownerName = owner?.name ?? "Unknown"

  logger.log("Trip liquidated:", {
    tripId,
    index: Number(trip.index),
    owner: ownerName,
    value: Number(trip.liquidationValue ?? 0)
  })

  addFeedMessage({
    id: `liquidated-${tripId}`,
    type: FEED_MESSAGE_TYPE.TRIP_LIQUIDATED,
    timestamp: Date.now(),
    tripId,
    tripIndex: Number(trip.index ?? 0),
    tripPrompt: trip.prompt ?? "",
    ownerName,
    liquidationValue: Number(trip.liquidationValue ?? 0)
  })
}

/**
 * Clean up the liquidation watcher.
 * Should be called on app/module cleanup.
 */
export function cleanupLiquidationWatcher(): void {
  if (tripsUnsubscribe) {
    tripsUnsubscribe()
    tripsUnsubscribe = null
  }
  knownLiquidatedTrips.clear()
  isInitialized = false
  logger.log("Cleaned up")
}
