<script lang="ts">
  import type { ServerReturnValue } from "@components/Main/RoomResult/types"
  import LogItem from "@components/Main/RoomResult/Log/LogItem.svelte"
  import { mergeLog } from "./index"
  import { gsap } from "gsap"

  let { result }: { result: ServerReturnValue } = $props()
  let logElement: HTMLDivElement

  // Merge log events with corresponding outcomes
  const mergedLog = mergeLog(result)

  // ** Animation **
  // Log has a parent gsap timeline
  // Each log item has a child gsap timeline
  // Child timelines are added to the parent timeline
  // When all child timelines are added, the parent timeline plays

  // Create parent timeline
  const logTimeline = gsap.timeline({
    defaults: { duration: 0.5, ease: "power2.out" },
  })

  const totalItems = mergedLog.length
  let receivedTimelines = 0

  function addToTimeline(timeline: ReturnType<typeof gsap.timeline>) {
    logTimeline.add(timeline)
    receivedTimelines++

    if (receivedTimelines === totalItems) {
      console.log("All timelines added, playing")
      console.log("logTimeline", logTimeline.getChildren())
      logTimeline.play()
    }
  }

  const restartAnimation = () => {
    logTimeline.restart()
  }
</script>

<div class="log" bind:this={logElement}>
  {#each mergedLog as logEntry, i (i)}
    <LogItem {logEntry} onTimeline={addToTimeline} />
  {/each}
</div>

<button class="restart-button" onclick={restartAnimation}>Restart</button>

<style lang="scss">
  .log {
    margin-bottom: 20px;
  }

  .restart-button {
    position: absolute;
    top: 10px;
    right: 10px;
  }
</style>
