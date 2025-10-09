<script lang="ts">
  import type { Hex } from "viem"
  import { trips } from "$lib/modules/state/stores"
  import { TripSEO } from "$lib/components/Trip"
  import { GameTripPreview } from "$lib/components/Trip"

  let { data } = $props()

  let trip = $derived($trips[data.tripId])
</script>

<TripSEO trip={data.tripContent} />

{#if trip && data.tripContent}
  <GameTripPreview {trip} tripId={data.tripId as Hex} sanityTripContent={data.tripContent} />
{/if}
