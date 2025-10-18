<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Trip as SanityTrip } from "@sanity-types"
  import { goto } from "$app/navigation"

  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { rat, ratTotalValue } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"

  import {
    TripPreviewHeader,
    TripPreviewPrompt,
    EnterTripButton,
    NoRatWarning
  } from "$lib/components/Trip"

  import { BackButton } from "$lib/components/Shared"

  let {
    tripId,
    trip,
    sanityTripContent
  }: { tripId: Hex; trip: Trip; sanityTripContent: SanityTrip } = $props()

  let minRatValueToEnter = getTripMinRatValueToEnter(trip.tripCreationCost)

  let tripOutcomes = $state<Outcome[]>()

  //  Show enter button if:
  //  * - Trip is not depleted
  //  * - Rat exists and is alive
  //  * - TODO: rat has min value to enter
  let showEnterButton = $derived((trip?.balance ?? 0) > 0 && !$rat?.dead)

  // Show no rat warning if:
  //  * - Rat does not exist or is dead
  let showNoRatWarning = $derived($rat?.dead)

  const onBackButtonClick = () => {
    goto("/")
  }

  onMount(() => {
    const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []

    // Sort the outcomes in order of creation
    tripOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<div class="game-trip-preview">
  <!-- Back Button -->
  <div class="back-button-container">
    <BackButton onclick={onBackButtonClick} />
  </div>

  <!-- Header -->
  <div class="trip-header">
    <TripPreviewHeader {trip} {sanityTripContent} {tripId} />
  </div>

  <!-- Prompt -->
  <div class="trip-prompt">
    <TripPreviewPrompt {trip} />
  </div>

  <!-- Bottom section -->
  <div class="trip-bottom">
    {#if showNoRatWarning}
      <NoRatWarning />
    {/if}

    {#if showEnterButton}
      <EnterTripButton
        {trip}
        disabled={busy.LiquidateRat.current != 0 || ($ratTotalValue || 0) < $minRatValueToEnter}
        {tripId}
      />
    {/if}
  </div>
</div>

<style lang="scss">
  .game-trip-preview {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    width: 100%;
    max-height: 100%;
    overflow: hidden;

    .trip-header {
      width: 100%;
      border-bottom: var(--default-border-style);
      flex-shrink: 0;
      overflow: hidden;
      height: 300px;
    }

    .trip-prompt {
      flex: 1; /* Take remaining space */
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    .trip-bottom {
      height: 200px;
      width: 100%;
      border-top: var(--default-border-style);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .back-button-container {
    display: block;
    border-bottom: 1px solid var(--color-grey-mid);
    position: sticky;
    height: 60px;
    top: 0;
    z-index: 10;
    background: red;
  }
</style>
