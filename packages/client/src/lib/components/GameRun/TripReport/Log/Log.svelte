<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { mergeLog } from "./index"
  import { gsap } from "gsap"
  import { LogItem, LogHeader } from "$lib/components/GameRun"

  let {
    result,
    onTimeline
  }: {
    result: EnterRoomReturnValue | null
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let logElement: HTMLDivElement

  // Merge log events with corresponding outcomes
  let mergedLog: MergedLogEntry[] | undefined = $state(undefined)
  let totalItems: number | undefined = $state(undefined)
  let receivedTimelines = 0

  // Wait for result, then merge log events with corresponding outcomes
  $effect(() => {
    if (result && !mergedLog) {
      mergedLog = mergeLog(result)
      totalItems = mergedLog.length + 1 // +1 for the header
    }
  })

  // ** Animation **
  // Log has a parent gsap timeline
  // Each log item has a child gsap timeline
  // Child timelines are added to the parent timeline
  // When all child timelines are added, pass timeline to parent

  // Create parent timeline
  const logTimeline = gsap.timeline({
    defaults: { duration: 0.5, ease: "power2.out" }
  })

  function addToTimeline(timeline: ReturnType<typeof gsap.timeline>) {
    logTimeline.add(timeline)
    receivedTimelines++

    if (receivedTimelines === totalItems) {
      // All timelines added, pass to parent
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
  <LogHeader onTimeline={addToTimeline} />
  {#if mergedLog && mergedLog.length > 0}
    {#each mergedLog as logEntry, i (i)}
      <LogItem {logEntry} onTimeline={addToTimeline} delay={0} />
    {/each}
  {/if}
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
