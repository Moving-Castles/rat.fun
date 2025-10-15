<script lang="ts">
  import type { TripEvent } from "$lib/components/Admin/types"
  import { timeSince } from "$lib/modules/utils"
  import { adminUnlockedAt, focusEvent } from "$lib/modules/ui/state.svelte"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"

  import AdminEventLogItem from "./AdminEventLogItem.svelte"

  let {
    graphData,
    focus = $bindable(),
    localFocusEvent = $bindable(),
    nosync = false,
    behavior = "hover"
  }: {
    graphData: TripEvent[]
    focus?: number
    localFocusEvent?: number
    nosync?: boolean
    behavior?: "hover" | "click"
  } = $props()

  const setLocalFocusEvent = (index: number) => {
    // console.log("setLocalFocusEvent", index)
    localFocusEvent = index
    // ???
    if (!nosync) {
      $focusEvent = index
    }
  }

  // Filter out baseline event
  let data = $derived(
    (graphData ?? []).toReversed().filter(p => p.eventType !== TRIP_EVENT_TYPE.BASELINE)
  )
</script>

<div class="admin-event-log">
  {#each data as point (point.index)}
    <AdminEventLogItem {point} {behavior} {localFocusEvent} {setLocalFocusEvent} />
  {/each}
  <p class="event">
    You unlocked the panel
    <span class="meta">
      {timeSince(new Date($adminUnlockedAt).getTime())}
    </span>
  </p>
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
