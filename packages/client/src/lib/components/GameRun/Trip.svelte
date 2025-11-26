<script lang="ts">
  import type { Hex } from "viem"
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { sha256 } from "viem"
  import { onMount, onDestroy } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { sendEnterTrip } from "$lib/modules/action-manager/actions/sendEnterTrip"
  import { NetworkError, APIError } from "$lib/modules/error-handling/errors"
  import { TripError } from "$lib/modules/error-handling/errors"
  import { player } from "$lib/modules/state/stores"
  import { replaceState } from "$app/navigation"
  import {
    TRIP_STATE,
    transitionTo,
    freezeObjects,
    tripResultState,
    resetTripState
  } from "$lib/components/GameRun/state.svelte"
  import { rat, trips } from "$lib/modules/state/stores"
  import { TripSetup, TripProcessing, TripReport } from "$lib/components/GameRun"
  import {
    suppressNotifications,
    unsuppressNotifications
  } from "$lib/modules/ui/notification-settings"

  let {
    tripId
  }: {
    tripId: Hex
  } = $props()

  let result = $state<EnterTripReturnValue | null>(null)

  // Calculate trip hash and seeds for visual consistency
  const tripHash = sha256(tripId)
  const seed1Hex = tripHash.slice(2, 10) // Skip '0x' and take 8 chars
  const seed2Hex = tripHash.slice(10, 18) // Take next 8 chars
  const seed1 = parseInt(seed1Hex, 16) / 0xffffffff // Normalize to 0-1
  const seed2 = parseInt(seed2Hex, 16) / 0xffffffff // Normalize to 0-1

  // Get static trip content from cms
  let staticTripContent = $derived($staticContent.trips.find(r => r._id == (tripId ?? "")))

  // Process the trip
  const processTripEntry = async () => {
    if (!$player?.currentRat) {
      throw new TripError("No rat selected", tripId)
    }

    if (!tripId) {
      throw new TripError("No trip ID", tripId)
    }

    try {
      result = await sendEnterTrip(tripId, $player.currentRat)
      if (!result) {
        throw new TripError("No result returned from trip entry", tripId)
      }
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes("network") || err.message.includes("fetch")) {
          throw new NetworkError(
            "TRIP_ENTRY_NETWORK_ERROR",
            "Network error during trip entry",
            err.message
          )
        } else if (err.message.includes("api") || err.message.includes("server")) {
          throw new APIError("Trip entry API error: " + err.message, err)
        } else {
          console.log(err)
          throw new TripError("Trip entry failed: " + err.message, tripId)
        }
      }
    }
  }

  onMount(() => {
    shaderManager.setShader("black")
    resetTripState()

    // Suppress notifications during game run
    suppressNotifications()

    // Clean the URL
    replaceState(`/${tripId}/tripping`, {})

    const trip = $trips[tripId]

    // Freeze the rat and trip to be able to gradually update their values without reactivity
    // from on-chain changes.
    freezeObjects($rat, trip, tripId)

    // Process the trip entry
    processTripEntry()
  })

  onDestroy(() => {
    // Re-enable notifications when leaving game run
    unsuppressNotifications()
  })
</script>

<div class="trip">
  <!-- ### 1. TRIP SETUP ### -->
  {#if tripResultState.state === TRIP_STATE.SETUP}
    <TripSetup
      {staticTripContent}
      onComplete={() => {
        transitionTo(TRIP_STATE.PROCESSING)
      }}
    />
  {/if}

  <!-- ### 2. TRIP PROCESSING ### -->
  {#if tripResultState.state === TRIP_STATE.PROCESSING}
    <TripProcessing
      {result}
      {seed1}
      {seed2}
      onComplete={() => {
        transitionTo(TRIP_STATE.RESULTS)
      }}
    />
  {/if}

  <!-- ### 3. TRIP RESULTS ### -->
  {#if tripResultState.state === TRIP_STATE.RESULTS && result}
    <TripReport {result} {seed1} />
  {/if}
</div>

<style lang="scss">
  .trip {
    height: 100%;
    width: 100%;
    color: var(--white);
    z-index: var(--z-high);
    font-size: var(--font-size-normal);
    overflow-y: auto;
    top: 32px;
    position: absolute;
    top: 0;
    left: 0;
  }
</style>
