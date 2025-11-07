<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import { gsap } from "gsap"
  import LogOutcomeItem from "./LogOutcomeItem.svelte"
  import LogOutcomeHealth from "./LogOutcomeHealth.svelte"

  let {
    logEntry,
    onTimeline
  }: {
    logEntry: MergedLogEntry
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Timeline
  const timeline = gsap.timeline()

  // Store outcome timelines for sequencing
  let outcomeTimelines: ReturnType<typeof gsap.timeline>[] = []

  // Calculate expected number of outcomes
  const expectedOutcomes = (logEntry.balanceTransfer ? 1 : 0) + (logEntry?.itemChanges?.length || 0)
  let receivedOutcomes = 0

  // Handle individual outcome timeline
  const addOutcomeTimeline = (outcomeTimeline: ReturnType<typeof gsap.timeline>) => {
    outcomeTimelines.push(outcomeTimeline)
    receivedOutcomes++

    // Check if we've received all expected outcomes
    if (receivedOutcomes === expectedOutcomes) {
      buildTimeline()
    }
  }

  // Build the timeline when all outcomes are received
  const buildTimeline = () => {
    // Add each outcome timeline sequentially
    outcomeTimelines.forEach(outcomeTimeline => {
      timeline.add(outcomeTimeline)
    })

    // Pass the timeline to the parent component
    if (onTimeline) {
      onTimeline(timeline)
    }
  }

  // Handle case where there are no outcomes
  if (expectedOutcomes === 0) {
    // No outcomes expected, immediately pass empty timeline
    if (onTimeline) {
      onTimeline(timeline)
    }
  }
</script>

<div class="outcome-list">
  {#if logEntry.balanceTransfer}
    <div class="outcome-wrapper">
      <LogOutcomeHealth value={logEntry.balanceTransfer.amount} onTimeline={addOutcomeTimeline} />
    </div>
  {/if}
  {#if logEntry?.itemChanges}
    {#each logEntry?.itemChanges as itemChange}
      <div class="outcome-wrapper">
        <LogOutcomeItem
          id={itemChange.id}
          name={itemChange.name}
          value={itemChange.value}
          action={itemChange.type}
          onTimeline={addOutcomeTimeline}
        />
      </div>
    {/each}
  {/if}
</div>

<style lang="scss">
  .outcome-list {
    margin-left: 10px;
    display: flex;
    flex-direction: row;
    gap: 5px;
    flex-wrap: wrap;
    height: 45px;
  }
</style>
