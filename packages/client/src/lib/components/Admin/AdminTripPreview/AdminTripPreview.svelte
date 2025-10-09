<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Trip as SanityTrip } from "@sanity-types"

  import { gameConfig } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { goto } from "$app/navigation"

  import {
    TripPreviewHeader,
    TripPreviewPrompt,
    TripPreviewGraph,
    TripPreviewEventLog,
    TripConfirmLiquidation,
    LiquidateTrip
  } from "$lib/components/Trip"

  let {
    tripId,
    trip,
    sanityTripContent
  }: { tripId: Hex; trip: Trip; sanityTripContent: SanityTrip } = $props()

  let tripOutcomes = $state<Outcome[]>()

  // Show liquidate button if:
  //  * - Trip is not depleted
  let showLiquidateButton = $derived(trip.balance > 0)

  let liquidating = $state(false)
  let blockUntilUnlock = $derived(
    Number(trip.creationBlock) + $gameConfig.cooldownCloseTrip - Number($blockNumber)
  )

  onMount(() => {
    liquidating = page.url.searchParams.has("liquidate") && blockUntilUnlock <= 0
    const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []

    // Sort the outcomes in order of creation
    tripOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<a class="back-button" href="/admin">Back</a>
{#if !liquidating}
  <div class="trip-inner-container" class:depleted={!showLiquidateButton}>
    <TripPreviewGraph {trip} {tripOutcomes} {sanityTripContent} />
    <TripPreviewPrompt {trip} />

    {#if showLiquidateButton}
      <LiquidateTrip onclick={() => (liquidating = true)} {tripId} {trip} isOwnTripListing={true} />
    {/if}

    <TripPreviewEventLog {tripId} {tripOutcomes} />
  </div>
{:else}
  <TripConfirmLiquidation
    {trip}
    tripContent={sanityTripContent}
    onDone={async () => {
      await goto("/admin")
      liquidating = false
    }}
    onAbort={() => {
      liquidating = false
    }}
  />
{/if}

<style lang="scss">
  .trip-inner-container {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    padding-bottom: calc(var(--pane-switch-height) + var(--world-prompt-box-height) + 20px);
    overflow-x: hidden;

    &.depleted {
      filter: grayscale(0.8) contrast(0.7);
    }
  }

  .back-button {
    display: block;
    color: var(--color-grey-light);
    border-bottom: 1px solid var(--color-grey-mid);
    padding: 0 12px;
    position: sticky;
    height: 60px;
    top: 0;
    line-height: 60px;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    background: var(--background-semi-transparent);
    z-index: 10;

    &:hover {
      color: var(--white);
    }
  }
</style>
