<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Trip as SanityTrip } from "@sanity-types"
  import type { TripEvent } from "$lib/components/Admin/types"

  import { gameConfig } from "$lib/modules/state/stores"
  import { blockNumber } from "$lib/modules/network"
  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { goto } from "$app/navigation"
  import { focusEvent } from "$lib/modules/ui/state.svelte"

  import AdminTripPreviewHeader from "$lib/components/Admin/AdminTripPreview/AdminTripPreviewHeader.svelte"
  import AdminTripEventIntrospection from "$lib/components/Admin/AdminTripEventIntrospection/AdminTripEventIntrospection.svelte"
  import TripProfitLossGraph from "$lib/components/Admin/AdminTripPreview/TripProfitLossGraph/TripProfitLossGraph.svelte"
  import TripConfirmLiquidation from "$lib/components/Admin/AdminTripPreview/TripConfirmLiquidation/TripConfirmLiquidation.svelte"
  import LiquidateTrip from "$lib/components/Admin/AdminTripPreview/LiquidateTrip.svelte"
  import AdminEventLog from "$lib/components/Admin/AdminEventLog/AdminEventLog.svelte"

  import { BackButton } from "$lib/components/Shared"
  import { proveWithdrawal } from "viem/op-stack"

  let {
    tripId,
    trip,
    liquidating,
    sanityTripContent
  }: { tripId: Hex; trip: Trip; liquidating?: boolean; sanityTripContent: SanityTrip } = $props()

  let tripOutcomes = $state<Outcome[]>()

  /// graphData is set inside ProfitLossGraph
  let graphData = $state<TripEvent[]>([])

  // Show liquidate button if:
  //  * - Trip is not depleted
  let showLiquidateButton = $derived(trip.balance > 0)

  let blockUntilUnlock = $derived(
    Number(trip.creationBlock) + $gameConfig.cooldownCloseTrip - Number($blockNumber)
  )

  let event = $derived(graphData[$focusEvent])

  const onBackButtonClick = () => {
    goto("/cashboard")
  }

  onMount(() => {
    const getEventIndexFromId = (id: string) => {
      const index = graphData.findIndex(p => p?.meta?._id === id)
      return index
    }
    $focusEvent = Number(page.url.searchParams.get("focusEvent")) || -1
    if (page.url.searchParams.has("focusId")) {
      $focusEvent = getEventIndexFromId(page.url.searchParams.get("focusId")!)
    }

    const outcomes = $staticContent?.outcomes?.filter(o => o.tripId == tripId) || []

    // Sort the outcomes in order of creation
    tripOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<div class="back-button-container">
  <BackButton onclick={onBackButtonClick} />
</div>
{#if !liquidating}
  <div class="trip-inner-container" class:depleted={!showLiquidateButton}>
    <div class="full">
      <AdminTripPreviewHeader {sanityTripContent} {trip} />
    </div>
    <div class="left">
      <TripProfitLossGraph behavior="click" {trip} {tripId} bind:graphData />
    </div>
    <div class="right">
      <AdminEventLog {graphData} behavior="click" hideUnlockEvent />
    </div>
    <div class="full">
      <p class="section-header">Flashbacks</p>
      <div class="min-height">
        {#key event?.meta?._id}
          <AdminTripEventIntrospection {event} />
        {/key}
      </div>
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
  </div>
{:else}
  <TripConfirmLiquidation
    {trip}
    tripContent={sanityTripContent}
    onDone={async () => {
      await goto("/cashboard")
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
    padding-bottom: calc(var(--mode-switch-height) + var(--world-prompt-box-height) + 20px);
    overflow-x: hidden;
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    grid-template-rows: 1fr 400px auto;
    grid-auto-rows: 1fr;

    .section-header {
      padding: 0 8px;
    }

    .left {
      grid-column: 1 / 9;
    }
    .right {
      grid-column: 9 / 13;
    }

    .full {
      grid-column: 1 / 13;
    }

    .min-height {
      height: 300px;
    }

    &.depleted {
      filter: grayscale(0.8) contrast(0.7);
    }
  }

  .back-button-container {
    display: block;
    border-bottom: 1px solid var(--color-grey-mid);
    position: sticky;
    height: 60px;
    top: 0;
    z-index: 10;
  }
</style>
