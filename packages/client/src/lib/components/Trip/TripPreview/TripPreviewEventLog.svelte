<script lang="ts">
  import type { Outcome } from "@sanity-types"
  import type { Hex } from "viem"

  import { TripEventLog } from "$lib/components/Trip"

  let { tripId, tripOutcomes }: { tripId: Hex; tripOutcomes?: Outcome[] } = $props()
</script>

{#if tripOutcomes}
  <div class="trip-preview-event-log">
    <TripEventLog {tripId} initialOutcomes={tripOutcomes} />
  </div>
{/if}

<style lang="scss">
  .trip-preview-event-log {
    background: var(--background-semi-transparent);
  }
</style>
