<script lang="ts">
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import { SignedNumber, Tooltip } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  let { event, previousEnabled, nextEnabled, previous, next } = $props()
</script>

<div class="admin-trip-event-ticker">
  <div class="buttons">
    <Tooltip content={UI_STRINGS.older}>
      <button onclick={next} disabled={!nextEnabled}>
        {"<"}
      </button>
    </Tooltip>
    <Tooltip content={UI_STRINGS.newer}>
      <button onclick={previous} disabled={!previousEnabled}>
        {">"}
      </button>
    </Tooltip>
  </div>
  <div class="title">
    {#if event.eventType === TRIP_EVENT_TYPE.VISIT}
      <span class="summary">
        {event.meta.playerName} sent {event.meta.ratName} to trip #{event.meta.tripIndex}
      </span>
    {:else if event.eventType === TRIP_EVENT_TYPE.DEATH}
      <span class="summary">
        {event.meta.playerName} let {event.meta.ratName} die in trip #{event.meta.tripIndex}
      </span>
    {/if}
  </div>
  {#if event.eventType === TRIP_EVENT_TYPE.DEATH || event.eventType === TRIP_EVENT_TYPE.VISIT}
    <span class="number">
      <SignedNumber value={event.valueChange} />
    </span>
  {/if}
</div>

<style lang="scss">
  .admin-trip-event-ticker {
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: white;
    color: black;
    text-align: left;
    padding: 2px 6px;
    font-size: var(--font-size-small);
  }

  .buttons {
    display: flex;
    gap: 8px;
  }
</style>
