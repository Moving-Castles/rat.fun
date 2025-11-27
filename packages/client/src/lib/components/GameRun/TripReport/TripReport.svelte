<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { onMount, onDestroy } from "svelte"
  import { Log, TripSummary } from "$lib/components/GameRun"
  import TripSummary2 from "./TripSummary/TripSummary2.svelte"
  import { playSound } from "$lib/modules/sound"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { gsap } from "gsap"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { environment } from "$lib/modules/network"
  import { ENVIRONMENT } from "$lib/mud/enums"

  /**
   * Timeline structure:
   *
   * TripReport (rootTimeline)
   * ├── Log (logTimeline)
   * │   ├── LogStatus (START)
   * │   ├── LogInventory
   * │   ├── LogItem (×N)
   * │   │   ├── LogTimestamp
   * │   │   ├── LogText
   * │   │   └── LogOutcomeList
   * │   └── LogStatus (END) - animated manually
   * └── TripSummary2 (summaryTimeline)
   *     ├── TotalValueBox2
   *     └── ActionBox
   */

  let {
    result,
    seed1
  }: {
    result: EnterTripReturnValue
    seed1: number
  } = $props()

  // ** Root Timeline Management **
  const rootTimeline = gsap.timeline()
  let logTimeline: ReturnType<typeof gsap.timeline> | null = null
  let summaryTimeline: ReturnType<typeof gsap.timeline> | null = null
  let receivedTimelines = 0
  const expectedTimelines = 2 // Log and TripSummary

  // Element ref for log container
  let logContainer = $state<HTMLDivElement | null>(null)

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

      // Add summary timeline after log completes with delay
      if (summaryTimeline) {
        // Summary timeline starts after log completes with delay
        const summaryTimelineStart = ">+0.2"

        // Shrink log container height and scroll to bottom at the exact same time
        if (logContainer) {
          rootTimeline.to(
            logContainer,
            {
              height: "calc(100% - 400px)",
              scrollTop: logContainer.scrollHeight,
              duration: 0.6,
              ease: "power4.out"
            },
            summaryTimelineStart
          )
        }

        // Add summary timeline at the same position
        rootTimeline.add(summaryTimeline, ">-0.2")
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

  // Calculate palette color from seeds (matching tripProcessing shader logic)
  const getPaletteColor = (seed: number): [number, number, number] => {
    const hue = seed * Math.PI * 2
    let r = Math.sin(hue)
    let g = Math.sin(hue + 2.09)
    let b = Math.sin(hue + 4.18)

    // Make all positive
    r = Math.abs(r)
    g = Math.abs(g)
    b = Math.abs(b)

    // Normalize to brightest component
    const maxComponent = Math.max(r, g, b)
    return [r / maxComponent, g / maxComponent, b / maxComponent]
  }

  const setupTripReport = () => {
    playSound({ category: "ratfunTransitions", id: "tripReportEnter" })

    // Use the first palette color from seed1
    const [r, g, b] = getPaletteColor(seed1)

    shaderManager.setShader("swirlyNoise", false, {
      u_color: { type: "vec3", value: [r, g, b] }
    })

    backgroundMusic.play({ category: "ratfunMusic", id: "tripReport", loop: true })
  }

  const teardownTripReport = () => {
    backgroundMusic.stop()

    // Stop animation
    if (rootTimeline) {
      rootTimeline.kill()
    }
  }

  onMount(() => {
    setupTripReport()
  })

  onDestroy(async () => {
    teardownTripReport()
  })
</script>

{#if $environment !== ENVIRONMENT.BASE}
  <div class="replay-button-container">
    <button onclick={replay}>Replay</button>
  </div>
{/if}

<div class="trip-report-container">
  <!-- LOG -->
  <div class="log-container" bind:this={logContainer}>
    <Log {result} onTimeline={addLogTimeline} />
  </div>

  <!-- RESULT SUMMARY -->
  <TripSummary2 {result} onTimeline={addSummaryTimeline} />
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
    user-select: none;

    .log-container {
      width: 100%;
      height: 100%;
      overflow-y: auto;
      padding: 10px;
    }
  }
</style>
