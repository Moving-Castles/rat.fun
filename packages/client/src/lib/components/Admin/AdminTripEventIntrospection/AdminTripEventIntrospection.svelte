<script lang="ts">
  import type { TripEvent } from "$lib/components/Admin/types"
  import RatTripLog from "./RatTripLog.svelte"
  import { strings } from "$lib/modules/strings"
  let { event }: { event: TripEvent } = $props()
</script>

<div class="introspection">
  {#if event && (event.eventType === "trip_visit" || event.eventType === "trip_death")}
    <RatTripLog result={event.meta} />
  {:else}
    <div class="empty">
      <p class="void glow">{strings.noData.toUpperCase()}</p>
    </div>
  {/if}
</div>

<style>
  .introspection {
    height: 300px;
  }

  .glow {
    filter: drop-shadow(0px 0px 2px #ffffff);
    opacity: 0.5;
  }

  .empty {
    display: flex;
    width: 100%;
    height: 100%;
    justify-content: center;
    align-items: center;
  }
</style>
