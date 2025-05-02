<script lang="ts">
  import type { MergedLogEntry } from "./types"
  import type { ServerReturnValue } from "@components/Main/RoomResult/types"
  import { mergeLog } from "./index"
  import { gsap } from "gsap"
  import { playSound } from "@modules/sound"

  import LogItem from "@components/Main/RoomResult/Log/LogItem.svelte"
  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

  let {
    result,
    animationstarted,
  }: { result: ServerReturnValue | undefined; animationstarted: boolean } =
    $props()

  // Elements
  let logElement: HTMLDivElement
  let returnButtonElement: HTMLButtonElement

  import { getUIState } from "@modules/ui/state.svelte"
  const { rooms } = getUIState()

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
      // Add animation for return button
      gsap.set(returnButtonElement, { opacity: 0 })
      logTimeline.to(returnButtonElement, {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out",
      })
      // All timelines added, play the parent timeline
      logTimeline.play()
    }
  }

  const sendLeaveRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.close()
  }
</script>

<div class="log" bind:this={logElement}>
  {#if mergedLog && mergedLog.length > 0}
    {#each mergedLog as logEntry, i (i)}
      <LogItem {logEntry} onTimeline={addToTimeline} />
    {/each}
  {:else if animationstarted}
    EXPERIMENT IN PROGRESS: <Spinner />
  {/if}

  <button
    class="return"
    bind:this={returnButtonElement}
    onclick={sendLeaveRoom}
  >
    LEAVE ROOM
  </button>
</div>

<!-- <button class="restart-button" onclick={restartAnimation}>Restart</button> -->

<style lang="scss">
  .log {
    margin-bottom: 20px;
    height: calc(var(--game-window-height) - 300px);
    padding: 10px;
    border: var(--default-border-style);
    border-top: none;
    position: relative;

    .return {
      opacity: 0;
      position: absolute;
      bottom: 10px;
      left: 10px;
      margin: 0;
      width: calc(100% - 20px);
      padding: 20px;
      background: var(--color-alert-priority);
      margin-top: 20px;
      cursor: pointer;
      border: var(--default-border-style);

      &:hover {
        background: var(--background);
        color: var(--foreground);
      }
    }
  }
</style>
