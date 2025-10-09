<script lang="ts">
  import type { Hex } from "viem"
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { onMount } from "svelte"
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

  let {
    tripId
  }: {
    tripId: Hex
  } = $props()

  let result = $state<EnterTripReturnValue | null>(null)

  // Get static trip content from cms
  let staticTripContent = $derived($staticContent.trips.find(r => r._id == (tripId ?? "")))

  // Process the trip
  const processTripEntry = async () => {
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
          throw new TripError("Trip entry failed: " + err.message, tripId)
        }
      }
    }
  }

  onMount(() => {
    shaderManager.setShader("blank")
    resetTripState()

    // Clean the URL
    replaceState(`/${tripId}/tripping`, {})

    const trip = $trips[tripId]

    // Freeze the rat and trip to be able to gradually update their values without reactivity
    // from on-chain changes.
    freezeObjects($rat, trip, tripId, $player.currentRat)

    // Process the trip entry
    processTripEntry()
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
      onComplete={async () => {
        transitionTo(TRIP_STATE.RESULTS)
      }}
    />
  {/if}

  <!-- ### 3. TRIP RESULTS ### -->
  {#if tripResultState.state === TRIP_STATE.RESULTS}
    <TripReport {result} />
  {/if}
</div>

<style lang="scss">
  .trip {
    height: 100%;
    color: var(--white);
    z-index: var(--z-high);
    font-size: var(--font-size-normal);
    overflow-y: auto;
    top: 32px;
  }
</style>
