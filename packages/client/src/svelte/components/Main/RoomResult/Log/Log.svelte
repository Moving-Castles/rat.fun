<script lang="ts">
  import type { MergedLogEntry } from "./types"
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { mergeLog } from "./index"
  import { gsap } from "gsap"

  import LogItem from "@components/Main/RoomResult/Log/LogItem.svelte"

  let {
    result,
    onComplete,
  }: {
    result: EnterRoomReturnValue | null
    onComplete: () => void
  } = $props()

  // Element
  let logElement: HTMLDivElement

  // Merge log events with corresponding outcomes
  let mergedLog: MergedLogEntry[] | undefined = $state(undefined)
  let totalItems: number | undefined = $state(undefined)
  let receivedTimelines = 0

  $effect(() => {
    if (result && !mergedLog) {
      mergedLog = mergeLog(result)
      totalItems = mergedLog.length
    }
  })

  // ** Animation **
  // Log has a parent gsap timeline
  // Each log item has a child gsap timeline
  // Child timelines are added to the parent timeline
  // When all child timelines are added, the parent timeline plays

  // Create parent timeline
  const logTimeline = gsap.timeline({
    defaults: { duration: 0.5, ease: "power2.out" },
  })

  function addToTimeline(timeline: ReturnType<typeof gsap.timeline>) {
    logTimeline.add(timeline)
    receivedTimelines++

    if (receivedTimelines === totalItems) {
      logTimeline.call(
        () => {
          onComplete()
        },
        [],
        "+=0.5" // Add a delay of 0.5 seconds before calling the callback
      )
      // All timelines added, play the parent timeline
      logTimeline.play()
    }
  }

  const replayOutcome = () => {
    logTimeline.restart()
  }
</script>

<div class="log" bind:this={logElement}>
  {#if mergedLog && mergedLog.length > 0}
    {#each mergedLog as logEntry, i (i)}
      <LogItem {logEntry} onTimeline={addToTimeline} />
    {/each}
  {/if}

  <!-- <button class="replay-button" onclick={replayOutcome}>Replay</button> -->
</div>

<style lang="scss">
  .log {
    margin-bottom: 20px;
    height: calc(var(--game-window-height) - 300px);
    padding: 10px;
    border: var(--default-border-style);
    border-top: none;
    position: relative;
    background-image: url("/images/bg-test.jpg");

    // .replay-button {
    //   position: absolute;
    //   bottom: 20px;
    //   right: 20px;
    //   padding: 10px 20px;
    //   background: var(--color-grey-dark);
    // }
  }
</style>
