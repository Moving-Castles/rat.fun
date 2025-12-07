<script lang="ts">
  import type { TripEvent } from "$lib/components/Admin/types"
  import RatTripLog from "./RatTripLog.svelte"
  let { event }: { event: TripEvent } = $props()
</script>

<div class="introspection">
  {#if event && (event.eventType === "trip_visit" || event.eventType === "trip_death")}
    <RatTripLog result={event.meta} />
  {/if}
</div>

<style>
  .introspection {
    height: 100%;
  }
</style>
