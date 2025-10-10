<script lang="ts">
  import RatTripLog from "./RatTripLog.svelte"
  let { event } = $props()

  let randomVoids = ["Nothing", "Patience", "Void", "Nothing to see here", "...", ":eye:"]

  let randomVoid = randomVoids[Math.floor(Math.random() * randomVoids.length)]
</script>

<div class="introspection">
  {#if event && (event.eventType === "trip_visit" || event.eventType === "trip_death")}
    <RatTripLog result={event.meta} />
  {:else}
    <div class="empty">
      <p class="void glow">{randomVoid}</p>
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
  .void {
  }
</style>
