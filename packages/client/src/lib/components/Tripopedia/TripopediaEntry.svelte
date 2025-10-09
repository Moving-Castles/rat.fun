<script lang="ts">
  import type { Trip as TripSanityDoc, Outcome as OutcomeSanityDoc } from "@sanity-types"

  let { trip, result }: { trip: TripSanityDoc | undefined; result: OutcomeSanityDoc | undefined } =
    $props()
</script>

<div class="tripopedia-entry">
  {#if trip && result}
    <h1>TRIP PROMPT: {trip.prompt}</h1>
    <p>RAT ID: {result.ratId}</p>
    <p>PLAYER ID: {result.playerId}</p>
    <div class="tripopedia-entry-content">
      {#each result.log ?? [] as item}
        <p>{item.event}</p>
      {/each}
    </div>
  {/if}
</div>
