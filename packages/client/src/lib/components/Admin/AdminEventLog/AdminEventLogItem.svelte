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
    point
  }: {
    point:
      | TripEventVisit
      | TripEventDeath
      | TripEventLiquidation
      | TripEventCreation
      | TripEventDepletion
  } = $props()
</script>

{#if point.eventType === "trip_visit"}
  <span class="event-message">
    {point.meta?.playerName} sent rat to trip #{point.meta?.tripIndex}
  </span>
  <div class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" value={point.valueChange} />
  </div>
{:else if point.eventType === "trip_liquidated"}
  <span class="event-message prio-2">
    <span class="event-icon">*</span>
    You liquidated trip #{point.meta?.index}
  </span>
  <div class="event-valuechange"></div>
{:else if point.eventType === "trip_created"}
  <span class="event-message prio-2">
    <span class="event-icon">*</span>
    You created trip #{point.meta?.index}
    <!-- {point.meta.tripCreationCost} -->
  </span>
  <div class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" hideZero value={point.valueChange} />
  </div>
{:else if point.eventType === "trip_death"}
  <span class="event-message">
    {point.meta?.playerName}'s rat died in trip #{point.meta?.tripIndex}
  </span>
  <div class="event-valuechange">
    <SignedNumber neutralColor="rgba(255, 255, 0, 1);" value={point.valueChange} />
  </div>
{:else if point.eventType === "trip_depleted"}
  <span class="event-message prio-2">
    <span class="event-icon">*</span>
    Trip #{point.meta?.index} got depleted
  </span>
  <div class="event-valuechange"></div>
{/if}

<style lang="scss">
</style>
