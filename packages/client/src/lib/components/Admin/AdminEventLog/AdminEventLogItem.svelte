<script lang="ts">
  import type {
    TripEventVisit,
    TripEventDeath,
    TripEventLiquidation,
    TripEventCreation,
    TripEventDepletion
  } from "$lib/components/Admin/types"
  import { SignedNumber } from "$lib/components/Shared"

  let {
    point,
    selected,
    focus
  }: {
    point:
      | TripEventVisit
      | TripEventDeath
      | TripEventLiquidation
      | TripEventCreation
      | TripEventDepletion
    selected?: boolean
    focus?: boolean
  } = $props()
</script>

{#if point.eventType === "trip_visit"}
  <span class:selected class:focus class="event-message">
    <span class="handle">@{point.meta?.playerName}</span> RAT SURVIVED #{point.meta?.tripIndex}
  </span>
  <div class:focus class:selected class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" value={point.valueChange} />
  </div>
{:else if point.eventType === "trip_liquidated"}
  <span class:selected class:focus class="event-message prio-2">
    <span class="event-icon">*</span>
    YOU CASHED OUT TRIP #{point.meta?.index}
  </span>
{:else if point.eventType === "trip_created"}
  <span class:selected class:focus class="event-message prio-2">
    <span class="event-icon">*</span>
    YOU CREATED TRIP #{point.meta?.index}
    <!-- {point.meta.tripCreationCost} -->
  </span>
  <div class:focus class:selected class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" hideZero value={point.valueChange} />
  </div>
{:else if point.eventType === "trip_death"}
  <span class:selected class:focus class="event-message">
    <span class="handle">@{point.meta?.playerName}</span> RAT DIED, #{point.meta?.tripIndex}
  </span>
  <div class:focus class:selected class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" value={point.valueChange} />
  </div>
{:else if point.eventType === "trip_depleted"}
  <span class:selected class:focus class="event-message prio-2">
    <span class="event-icon">*</span>
    TRIP #{point.meta?.index} DEPLETED
  </span>
{/if}

<style lang="scss">
  .handle {
    opacity: 0.5;
  }
  .event-valuechange {
    min-width: 5ch;
    text-align: right;

    &.selected {
      background: var(--black);
    }
    &.focus {
      background: var(--black);
    }
  }
</style>
