<script lang="ts">
  import type { TripEvent } from "$lib/components/Admin/types"
  import { timeSince } from "$lib/modules/utils"
  import { adminUnlockedAt } from "$lib/modules/ui/state.svelte"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"

  import AdminEventLogItem from "./AdminEventLogItem.svelte"

  let {
    graphData,
    hideUnlockEvent = false,
    behavior = "hover"
  }: {
    graphData: TripEvent[]
    hideUnlockEvent?: boolean
    behavior?: "hover" | "click"
  } = $props()

  // Filter out baseline event
  let data = $derived(
    (graphData ?? []).toReversed().filter(p => p.eventType !== TRIP_EVENT_TYPE.BASELINE)
  )
</script>

<div class="admin-event-log">
  {#each data as point (point.index)}
    <AdminEventLogItem {point} {behavior} />
  {/each}
  {#if !hideUnlockEvent}
    <p class="event">
      You unlocked the cashboard
      <span class="meta">
        {timeSince(new Date($adminUnlockedAt).getTime())}
      </span>
    </p>
  {/if}
</div>

<style lang="scss">
  .admin-event-log {
    background: var(--color-grey-dark);
    height: 100%;
    max-height: 800px;
    overflow-y: scroll;
    flex-flow: column nowrap;
    align-items: start;
    justify-content: flex-start;
    gap: 8px;
    padding: 6px;
    user-select: none;

    .event {
      padding: 0;
      margin: 0;
      color: white;
      display: block;
      margin-bottom: 4px;
      font-size: var(--font-size-small);

      .meta {
        font-size: var(--font-size-small);
        color: var(--color-grey-light);
        text-align: center;
        margin-bottom: 20px;
      }
    }
  }
</style>
