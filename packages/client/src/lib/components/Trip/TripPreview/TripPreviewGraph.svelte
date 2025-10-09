<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import type { PlotPoint } from "$lib/components/Trip/TripGraph/types"
  import { TripGraph } from "$lib/components/Trip"

  let {
    trip,
    tripOutcomes,
    sanityTripContent
  }: { trip: Trip; tripOutcomes?: Outcome[]; sanityTripContent: any } = $props()

  let plotData: PlotPoint[] = $derived.by(() => {
    if (!tripOutcomes) {
      return []
    }
    return [
      {
        time: 0,
        tripValue: Number(trip.tripCreationCost),
        meta: sanityTripContent
      },
      ...tripOutcomes
    ].map((o, i) => {
      return {
        time: i,
        value: o?.tripValue || 0,
        meta: o
      }
    })
  })
</script>

<div class="trip-preview-stats">
  <div class="header">TRIP BALANCE OVER TIME</div>
  <div class="content" class:empty={plotData.length == 1}>
    <TripGraph height={300} {plotData} isEmpty={plotData.length == 1} />
  </div>
</div>

<style lang="scss">
  .trip-preview-stats {
    background: var(--background-semi-transparent);

    .header {
      border-top: 1px solid var(--color-grey-mid);
      border-left: 1px solid var(--color-grey-mid);
      border-right: 1px solid var(--color-grey-mid);
      border-bottom: 1px dashed var(--color-grey-mid);
      padding: 12px;
      display: flex;
      justify-content: space-between;
      top: 0;
      background: var(--background);
      font-size: var(--font-size-small);
      overflow: hidden;
    }

    .content {
      height: 300px;
      border-right: 1px solid var(--color-grey-mid);

      &.empty {
        height: 300px;
      }
    }
  }
</style>
