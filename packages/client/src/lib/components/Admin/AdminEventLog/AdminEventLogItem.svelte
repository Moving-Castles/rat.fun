<script lang="ts">
  import type {
    TripEventVisit,
    TripEventDeath,
    TripEventLiquidation,
    TripEventCreation,
    TripEventDepletion
  } from "$lib/components/Admin/types"
  import { VALUE_CHANGE_DIRECTION } from "$lib/components/Admin/enums"
  import { SignedNumber } from "$lib/components/Shared"
  import { timeSince } from "$lib/modules/utils"
  import { makeHref } from "$lib/components/Admin/helpers"
  import { focusEvent, focusTrip } from "$lib/modules/ui/state.svelte"

  import { Tooltip } from "$lib/components/Shared"

  let {
    point,
    behavior = "click",
    isScrolling = false
  }: {
    point:
      | TripEventVisit
      | TripEventDeath
      | TripEventLiquidation
      | TripEventCreation
      | TripEventDepletion
    behavior?: "hover" | "click"
    isScrolling?: boolean
  } = $props()

  let valueChangeDirection = $derived(
    point.valueChange > 0
      ? VALUE_CHANGE_DIRECTION.POSITIVE
      : point.valueChange < 0
        ? VALUE_CHANGE_DIRECTION.NEGATIVE
        : VALUE_CHANGE_DIRECTION.NEUTRAL
  )

  let visitClass = $derived(
    point.eventType === "trip_visit" || point.eventType === "trip_death" ? "trip_visit" : ""
  )

  let focus = $derived(
    $focusEvent === point.index || (point.tripId === $focusTrip && $focusEvent === -1)
  )
  let timeStamp = $derived(timeSince(new Date(point.time).getTime()))

  const href = makeHref(point)

  const onpointerup = () => {
    if (behavior === "click") {
      $focusEvent = point.index
      $focusTrip = point.tripId
    }
  }

  const onpointerenter = () => {
    if (behavior === "hover" && !isScrolling) {
      $focusEvent = point.index
      $focusTrip = point.tripId
    }
  }

  const onpointerleave = () => {
    if (behavior === "hover" && !isScrolling) {
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
    trip #{p.meta?.tripIndex}
    <span class="event-icon">→</span>
    {p.meta?.playerName}
  </span>
  <div class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" value={p.valueChange} />
  </div>
{/snippet}

{#snippet ratDied(p: TripEventDeath)}
  <span class="event-message">
    trip #{p.meta?.tripIndex}
    <span class="event-icon">✝</span>
    {p.meta?.playerName}
  </span>
  <div class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" value={p.valueChange} />
  </div>
{/snippet}

{#snippet tripLiquidated(p: TripEventLiquidation)}
  <span class="event-message">
    <span class="event-icon">*</span>
    You liquidated trip #{p.meta?.index}
  </span>
  <div class="event-valuechange"></div>
{/snippet}

{#snippet tripDepleted(p: TripEventDepletion)}
  <span class="event-message">
    <span class="event-icon">*</span>
    Trip #{p.meta?.index} got depleted
  </span>
  <div class="event-valuechange"></div>
{/snippet}

{#snippet tripCreated(p: TripEventCreation)}
  <span class="event-message">
    <span class="event-icon">*</span>
    You created trip #{p.meta?.index}
    <!-- {p.meta.tripCreationCost} -->
  </span>
  <div class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" hideZero value={p.valueChange} />
  </div>
{/snippet}

<a
  {href}
  class="event {visitClass} {valueChangeDirection}"
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
      {:else if point.eventType === "trip_depleted"}
        {@render tripDepleted(point)}
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
    border: none;
    border-style: outset;
    border-width: 2px;
    border-color: rgba(0, 0, 0, 0.3);

    &.focus {
      background: black;
    }

    &.trip_visit:not(.focus) {
      &.positive {
        background: rgba(0, 255, 0, 0.4);
      }
      &.negative {
        background: rgba(255, 0, 0, 0.4);
      }
      &.neutral {
        background: rgba(255, 255, 0, 0.4);
      }
    }

    .event-content {
      display: flex;
      justify-content: space-between;
      width: 100%;
      min-height: 10px;
    }
  }
</style>
