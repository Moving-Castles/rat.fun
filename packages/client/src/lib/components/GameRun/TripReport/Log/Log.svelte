<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { mergeLog } from "./index"
  import { gsap } from "gsap"
  import { LogItem, LogStatus } from "$lib/components/GameRun"

  let {
    result,
    onTimeline
  }: {
    result: EnterTripReturnValue
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let logElement: HTMLDivElement

  // Merge log events with corresponding outcomes
  let mergedLog: MergedLogEntry[] | undefined = $state(undefined)
  let totalItems: number | undefined = $state(undefined)
  let receivedTimelines = 0
  let endStatusContainer: HTMLDivElement | null = $state(null)

  // Wait for result, then merge log events with corresponding outcomes
  $effect(() => {
    if (result && !mergedLog) {
      mergedLog = mergeLog(result)
      totalItems = mergedLog.length + 1 // +1 for START status only
    }
  })

  // ** Animation **
  // Log has a parent gsap timeline
  // Each log item has a child gsap timeline
  // Child timelines are added to the parent timeline
  // When all child timelines are added, pass timeline to parent

  // Create parent timeline
  const logTimeline = gsap.timeline()

  function addToTimeline(timeline: ReturnType<typeof gsap.timeline>) {
    logTimeline.add(timeline)
    receivedTimelines++

    if (receivedTimelines === totalItems) {
      // All log items + START added, now manually add END status animation
      if (endStatusContainer) {
        gsap.set(endStatusContainer, { opacity: 0 })
        logTimeline.to(endStatusContainer, {
          opacity: 1,
          duration: 0.5,
          ease: "power2.out"
        })
      }
      // Pass complete timeline to parent
      done()
    }
  }

  // Timeline is constructed
  // Pass it to the parent component
  const done = () => {
    if (logTimeline && onTimeline) {
      onTimeline(logTimeline)
    }
  }
</script>

<div class="log-container" bind:this={logElement}>
  <LogStatus status="START" onTimeline={timeline => addToTimeline(timeline)} />
  {#if mergedLog && mergedLog.length > 0}
    {#each mergedLog as logEntry, i (i)}
      <LogItem {logEntry} onTimeline={timeline => addToTimeline(timeline)} delay={0} />
    {/each}
  {/if}
  <div bind:this={endStatusContainer}>
    <LogStatus status="END" />
  </div>
</div>

<style lang="scss">
  .log-container {
    margin-bottom: 0;
    width: 100%;
    padding: 10px;
    border-top: none;
    position: relative;
    background-size: 200px;
  }
</style>
