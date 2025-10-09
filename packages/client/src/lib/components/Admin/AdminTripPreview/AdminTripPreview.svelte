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
    TripPreviewPrompt,
    TripProfitLossGraph,
    TripConfirmLiquidation,
    LiquidateTrip
  } from "$lib/components/Trip"
  import { AdminTripPreviewHeader } from "$lib/components/Admin"
  import { AdminEventLog } from "$lib/components/Admin"
  import { playSound } from "$lib/modules/sound"

  let {
    tripId,
    trip,
    sanityTripContent
  }: { tripId: Hex; trip: Trip; sanityTripContent: SanityTrip } = $props()

  let tripOutcomes = $state<Outcome[]>()
  let graphData = $state([])

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

<a class="back-button" href="/admin" onclick={() => playSound("ratfunUI", "boing")}>
  <div>Back</div>
</a>
{#if !liquidating}
  <div class="trip-inner-container" class:depleted={!showLiquidateButton}>
    <div class="left">
      <TripProfitLossGraph {trip} {tripId} bind:graphData />
    </div>
    <div class="right">
      <AdminEventLog eventData={graphData} />
    </div>
    {#if showLiquidateButton}
      <div class="full">
        <LiquidateTrip
          onclick={() => (liquidating = true)}
          {tripId}
          {trip}
          isOwnTripListing={true}
        />
      </div>
    {/if}
    <div class="full">
      <AdminTripPreviewHeader {sanityTripContent} {trip} />
    </div>
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
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: 400px auto;
    grid-auto-rows: 1fr;

    .left {
      grid-column: 1 / 9;
    }
    .right {
      grid-column: 9 / 13;
    }
    .left-smol {
      grid-column: 1 / 5;
    }
    .right-big {
      grid-column: 5 / 13;
    }

    .full {
      grid-column: 1 / 13;
    }

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
    text-align: center;

    &:hover {
      color: var(--white);
    }
  }
</style>
