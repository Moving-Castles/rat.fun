<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Log, TripSummary } from "$lib/components/GameRun"
  import { playSound } from "$lib/modules/sound"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { Howl } from "howler"
  import { gsap } from "gsap"

  let { result }: { result: EnterTripReturnValue | null } = $props()

  let backgroundMusic: Howl | undefined = $state()

  // ** Root Timeline Management **
  const rootTimeline = gsap.timeline()
  let logTimeline: ReturnType<typeof gsap.timeline> | null = null
  let summaryTimeline: ReturnType<typeof gsap.timeline> | null = null
  let receivedTimelines = 0
  const expectedTimelines = 2 // Log and TripSummary

  // Handle Log timeline
  const addLogTimeline = (timeline: ReturnType<typeof gsap.timeline>) => {
    logTimeline = timeline
    receivedTimelines++
    checkAndBuildTimeline()
  }

  // Handle TripSummary timeline
  const addSummaryTimeline = (timeline: ReturnType<typeof gsap.timeline>) => {
    summaryTimeline = timeline
    receivedTimelines++
    checkAndBuildTimeline()
  }

  // Build the root timeline when all child timelines are ready
  const checkAndBuildTimeline = () => {
    if (receivedTimelines === expectedTimelines) {
      // Add log timeline first
      if (logTimeline) {
        rootTimeline.add(logTimeline)
      }

      // Add summary timeline after log completes (with a delay)
      if (summaryTimeline) {
        rootTimeline.add(summaryTimeline, "+=0.3")
      }

      // Play the root timeline
      rootTimeline.play()
    }
  }

  const replay = () => {
    teardownTripReport()
    setupTripReport()
    // Restart the root timeline
    rootTimeline.restart()
  }

  const setupTripReport = () => {
    playSound("ratfunTransitions", "tripReportEnter")
    shaderManager.setShader("blank")
    backgroundMusic = playSound("ratfunMusic", "tripReport", true)
  }

  const teardownTripReport = () => {
    // Stop background music
    if (backgroundMusic) {
      backgroundMusic.stop()
      backgroundMusic = undefined
    }
  }

  onMount(() => {
    setupTripReport()
  })

  onDestroy(async () => {
    teardownTripReport()
  })
</script>

<div class="replay-button-container">
  <button onclick={replay}>Replay</button>
</div>

<div class="trip-report-container">
  <!-- LOG -->
  <div class="log-container">
    <Log {result} onTimeline={addLogTimeline} />
  </div>

  <!-- RESULT SUMMARY -->
  <TripSummary {result} onTimeline={addSummaryTimeline} />
</div>

<style lang="scss">
  .replay-button-container {
    position: fixed;
    top: 10px;
    right: 10px;
    z-index: var(--z-top);
  }

  .trip-report-container {
    height: 100%;
    width: 100%;

    .log-container {
      width: 100%;
      height: 100%;
    }
  }
</style>
