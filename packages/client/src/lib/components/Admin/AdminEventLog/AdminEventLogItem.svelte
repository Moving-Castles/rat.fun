<script lang="ts">
  import type {
    TripEventVisit,
    TripEventDeath,
    TripEventLiquidation,
    TripEventCreation
  } from "$lib/components/Admin/types"
  import { TRIP_EVENT_TYPE, VALUE_CHANGE_DIRECTION } from "$lib/components/Admin/enums"
  import { SignedNumber } from "$lib/components/Shared"
  import { timeSince } from "$lib/modules/utils"
  import { focusEvent, focusTrip } from "$lib/modules/ui/state.svelte"

  import { Tooltip } from "$lib/components/Shared"

  let {
    point,
    behavior = "click"
  }: {
    point: TripEventVisit | TripEventDeath | TripEventLiquidation | TripEventCreation
    behavior?: "hover" | "click"
  } = $props()

  let valueChangeDirection = $derived(
    point.valueChange > 0
      ? VALUE_CHANGE_DIRECTION.POSITIVE
      : point.valueChange < 0
        ? VALUE_CHANGE_DIRECTION.NEGATIVE
        : VALUE_CHANGE_DIRECTION.NEUTRAL
  )

  let focus = $derived(
    $focusEvent === point.index || (point.tripId === $focusTrip && $focusEvent === -1)
  )
  let timeStamp = $derived(timeSince(new Date(point.time).getTime()))

  const href = $derived.by(() => {
    // For visit and death events, meta is SanityOutcome
    if (point.eventType === TRIP_EVENT_TYPE.VISIT || point.eventType === TRIP_EVENT_TYPE.DEATH) {
      return `/cashboard/${point.meta?.tripId}?focusId=${point.meta._id}`
    } else if (
      point.eventType === TRIP_EVENT_TYPE.LIQUIDATION ||
      point.eventType === TRIP_EVENT_TYPE.CREATION
    ) {
      // For liquidation and creation events, meta is SanityTrip
      return `/cashboard/${point.meta._id}`
    }
  })

  const onpointerup = () => {
    if (behavior === "click") {
      $focusEvent = point.index
      $focusTrip = point.tripId
    }
  }

  const onpointerenter = () => {
    if (behavior === "hover") {
      $focusEvent = point.index
      $focusTrip = point.tripId
    }
  }

  const onpointerleave = () => {
    if (behavior === "hover") {
      $focusEvent = -1
      $focusTrip = ""
    }
  }

  const onpointerdown = () => {
    // if (behavior === "click") {
    //   setLocalFocusEvent(point.index)
    // }
  }
</script>

{#snippet ratVisitEvent(p: TripEventVisit | TripEventDeath)}
  <span class="event-message">
    <span class="event-icon">→</span>
    {p.meta?.playerName} sent {p.meta?.ratName} to trip #{p.meta?.tripIndex}
  </span>
  <div class="event-valuechange">
    <SignedNumber hideZero value={p.valueChange} />
  </div>
{/snippet}

{#snippet ratDied(p: TripEventDeath)}
  <span class="event-message">
    <span class="event-icon">✝</span>
    {p.meta?.ratName} died tripping #{p.meta?.tripIndex}
  </span>
  <div class="event-valuechange">
    <SignedNumber hideZero value={p.valueChange} />
  </div>
{/snippet}

{#snippet tripLiquidated(p: TripEventLiquidation)}
  <span class="event-message">
    <span class="event-icon">*</span>
    You liquidated trip #{p.meta?.index}
  </span>
  <div class="event-valuechange">
    <SignedNumber hideZero value={p.valueChange} />
  </div>
{/snippet}

{#snippet tripCreated(p: TripEventCreation)}
  <span class="event-message">
    <span class="event-icon">*</span>
    You created trip #{p.meta?.index}
  </span>
  <div class="event-valuechange">
    <SignedNumber hideZero value={p.valueChange} />
  </div>
{/snippet}

<a
  class="event {valueChangeDirection}"
  {href}
  {onpointerdown}
  {onpointerup}
  {onpointerenter}
  {onpointerleave}
  class:focus
>
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
    display: block;
    padding: 0;
    margin: 0;
    color: white;
    cursor: pointer;
    font-size: var(--font-size-small);
    width: 100%;
    margin-bottom: 4px;
    font-family: var(--admin-font-stack);
    padding-top: 2px;
    padding-bottom: 4px;

    &.positive {
      background: rgba(0, 255, 0, 0.4);
    }
    &.negative {
      background: rgba(255, 0, 0, 0.4);
    }
    &.neutral {
      background: rgba(255, 255, 0, 0.4);
    }

    .event-content {
      display: flex;
      justify-content: space-between;
      width: 100%;
      min-height: 10px;
    }

    &.focus {
      background: black;
    }
  }
</style>
