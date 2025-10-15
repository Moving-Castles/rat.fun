<script lang="ts">
  import type {
    TripEventVisit,
    TripEventDeath,
    TripEventLiquidation,
    TripEventCreation
  } from "$lib/components/Admin/types"
  import { TRIP_EVENT_TYPE } from "$lib/components/Admin/enums"
  import { timeSince } from "$lib/modules/utils"

  import { Tooltip } from "$lib/components/Shared"

  let {
    point,
    behavior = "click",
    localFocusEvent,
    setLocalFocusEvent
  }: {
    point: TripEventVisit | TripEventDeath | TripEventLiquidation | TripEventCreation
    behavior?: "hover" | "click"
    localFocusEvent?: number
    setLocalFocusEvent: (index: number) => void
  } = $props()

  const focus = $derived(localFocusEvent === point.index)

  const timeStamp = timeSince(new Date(point.time).getTime())

  const href = $derived.by(() => {
    // For visit and death events, meta is SanityOutcome
    if (point.eventType === TRIP_EVENT_TYPE.VISIT || point.eventType === TRIP_EVENT_TYPE.DEATH) {
      return `/admin/${point.meta?.tripId}?focusId=${point.meta._id}`
    } else if (
      point.eventType === TRIP_EVENT_TYPE.LIQUIDATION ||
      point.eventType === TRIP_EVENT_TYPE.CREATION
    ) {
      // For liquidation and creation events, meta is SanityTrip
      return `/admin/${point.meta._id}`
    }
  })

  const onpointerdown = () => {
    // ...
  }

  const onpointerup = () => {
    if (behavior === "click") {
      setLocalFocusEvent(point.index)
    }
  }

  const onpointerenter = () => {
    if (behavior === "hover") {
      setLocalFocusEvent(point.index)
    }
  }

  const onpointerleave = () => {
    if (behavior === "hover") {
      setLocalFocusEvent(-1)
    }
  }
</script>

{#snippet ratVisitEvent(p: TripEventVisit | TripEventDeath)}
  <span class="event-icon">*</span>
  <span class="event-message">
    {p.meta?.playerName} sent {p.meta?.ratName} to trip #{p.meta?.tripIndex}
  </span>
{/snippet}

{#snippet ratDied(p: TripEventDeath)}
  <span class="event-icon">*</span>
  <span class="event-message">
    {p.meta?.ratName} died tripping #{p.meta?.tripIndex}
  </span>
{/snippet}

{#snippet tripLiquidated(p: TripEventLiquidation)}
  <span class="event-icon">*</span>
  <span class="event-message">
    You liquidated trip #{p.meta?.index}
  </span>
{/snippet}

{#snippet tripCreated(p: TripEventCreation)}
  <span class="event-icon">*</span>
  <span class="event-message">
    You created trip #{p.meta?.index}
  </span>
{/snippet}

<a class="event" {href} {onpointerdown} {onpointerup} {onpointerenter} {onpointerleave} class:focus>
  <Tooltip content={timeStamp}>
    <div class="event-content">
      {#if point.eventType === "trip_visit"}
        {@render ratVisitEvent(point)}
      {:else if point.eventType === "trip_liquidated"}
        {@render tripLiquidated(point)}
      {:else if point.eventType === "trip_created"}
        {@render tripCreated(point)}
      {:else if point.eventType === "trip_death"}
        {@render ratDied(point)}
      {/if}
    </div>
  </Tooltip>
</a>

<style lang="scss">
  .event {
    padding: 0;
    margin: 0;
    color: white;
    display: block;
    margin-bottom: 4px;
    cursor: pointer;
    font-size: var(--font-size-small);
    width: 100%;

    .event-content {
      width: 100%;
    }

    &.focus {
      background: black;
    }
  }
</style>
