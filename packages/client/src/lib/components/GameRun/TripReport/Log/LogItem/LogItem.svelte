<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import { gsap } from "gsap"

  import { LogTimestamp, LogOutcomeList } from "$lib/components/GameRun"
  import LogText from "./LogText.svelte"

  let {
    logEntry,
    delay = 0,
    onTimeline
  }: {
    logEntry: MergedLogEntry
    delay: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Elements
  let logItemElement = $state<HTMLDivElement | null>(null)

  // Timeline
  const timeline = gsap.timeline({ delay })

  // Store child timelines for later addition
  let logTextTimeline: ReturnType<typeof gsap.timeline> | null = null
  let logTimestampTimeline: ReturnType<typeof gsap.timeline> | null = null
  let logOutcomeListTimeline: ReturnType<typeof gsap.timeline> | null = null

  // Track completion of child timeline collection
  let receivedChildTimelines = 0
  const expectedChildTimelines = 3 // LogTimestamp, LogText, LogOutcomeList

  // Helper function to check if all child timelines are collected and build timeline
  const checkAndBuildTimeline = () => {
    receivedChildTimelines++
    // console.log(
    //   `${logEntry.timestamp} Child timeline received: ${receivedChildTimelines}/${expectedChildTimelines}`
    // )

    if (receivedChildTimelines === expectedChildTimelines) {
      // console.log(`${logEntry.timestamp} All child timelines collected, building main timeline`)
      buildMainTimeline()
    }
  }

  // Handle LogTimestamp timeline - store it for later addition
  const addLogTimestampTimeline = (timestampTimeline: ReturnType<typeof gsap.timeline>) => {
    // console.log(`${logEntry.timestamp} 1. addLogTimestampTimeline`, timestampTimeline)
    logTimestampTimeline = timestampTimeline
    checkAndBuildTimeline()
  }

  // Handle LogText timeline - store it for later addition
  const addLogTextTimeline = (textTimeline: ReturnType<typeof gsap.timeline>) => {
    // console.log(`${logEntry.timestamp} 2. addLogTextTimeline`, textTimeline)
    logTextTimeline = textTimeline
    checkAndBuildTimeline()
  }

  // Handle LogOutcomeList timeline - store it for later addition
  const addLogOutcomeListTimeline = (outcomeListTimeline: ReturnType<typeof gsap.timeline>) => {
    // console.log(`${logEntry.timestamp} 3. addLogOutcomeListTimeline`, outcomeListTimeline)
    logOutcomeListTimeline = outcomeListTimeline
    checkAndBuildTimeline()
  }

  // Build the main timeline - only called when all child timelines are collected
  const buildMainTimeline = () => {
    // console.log(`${logEntry.timestamp} Building main timeline with collected child timelines`)

    // Add LogTimestamp timeline at the start
    if (logTimestampTimeline) {
      timeline.add(logTimestampTimeline)
    }

    // Add LogText timeline after timestamp completes
    if (logTextTimeline) {
      timeline.add(logTextTimeline)
    }

    // Add LogOutcomeList timeline after text completes
    if (logOutcomeListTimeline) {
      timeline.add(logOutcomeListTimeline)
    }

    // Pass the complete timeline to parent
    done()
  }

  // Timeline is constructed
  // Pass it to the parent component
  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }
</script>

<div class="log-item" bind:this={logItemElement}>
  <LogTimestamp {logEntry} onTimeline={addLogTimestampTimeline} />
  <LogText {logEntry} onTimeline={addLogTextTimeline} />
  <LogOutcomeList {logEntry} onTimeline={addLogOutcomeListTimeline} />
</div>

<style lang="scss">
  .log-item {
    display: flex;
    margin-bottom: 0.5em;
    line-height: 40px;
    height: 40px;
  }
</style>
