<script lang="ts">
  import type { Hex } from "viem"
  import { trips } from "$lib/modules/state/stores"
  import { TripSEO } from "$lib/components/Trip"
  import { GameTripPreview } from "$lib/components/Trip"

  let { data } = $props()

  let trip = $derived($trips[data.tripId])
  let sanityTrip = $derived(data.tripContent)
</script>

<TripSEO trip={sanityTrip} />

{#if sanityTrip || trip}
  <!-- GameTripPreview handles both cases: with chain data and without -->
  <GameTripPreview {trip} tripId={data.tripId as Hex} sanityTripContent={sanityTrip} />
{/if}
