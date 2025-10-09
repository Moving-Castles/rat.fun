<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { playSound } from "$lib/modules/sound"
  import { gsap } from "gsap"
  import HealthBox from "./HealthBox.svelte"
  import ItemBox from "./ItemBox.svelte"
  import TotalValueBox from "./TotalValueBox.svelte"
  import ActionBox from "./ActionBox.svelte"

  let {
    result,
    onTimeline
  }: {
    result: EnterTripReturnValue
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let summaryContainer = $state<HTMLDivElement | null>(null)

  // Track child timelines
  let receivedTimelines = 0
  const totalItems = 4 // HealthBox, ItemBox, TotalValueBox, ActionBox

  // Create parent timeline
  const summaryTimeline = gsap.timeline()

  const prepare = () => {
    // Set initial state for container
    gsap.set(summaryContainer, {
      opacity: 0,
      y: 100
    })
  }

  const main = () => {
    // NOTE: All animations start at 0 seconds

    // Play sound
    summaryTimeline.call(
      () => {
        playSound("ratfunUI", "panelIn")
      },
      [],
      0
    )

    // Animate the summary container (fade in + slide up)
    summaryTimeline.to(
      summaryContainer,
      {
        opacity: 1,
        y: 0,
        duration: 0.6,
        ease: "power4.out"
      },
      0
    )
  }

  function addToTimeline(timeline: ReturnType<typeof gsap.timeline>) {
    // Add child timelines at position 0 to start with the container animation
    summaryTimeline.add(timeline, 0)
    receivedTimelines++

    if (receivedTimelines === totalItems) {
      // All timelines added, pass to parent
      done()
    }
  }

  // Timeline is constructed
  // Pass it to the parent component
  const done = () => {
    if (summaryTimeline && onTimeline) {
      onTimeline(summaryTimeline)
    }
  }

  const run = () => {
    prepare()
    main()
  }

  // Ensure container is mounted
  $effect(() => {
    if (summaryContainer) {
      run()
    }
  })
</script>

<div class="summary-container" bind:this={summaryContainer}>
  <!-- COLUMN 1 -->
  <div class="results">
    <div class="result-text">
      <HealthBox onTimeline={addToTimeline} />
      <ItemBox {result} onTimeline={addToTimeline} />
      <TotalValueBox {result} onTimeline={addToTimeline} />
    </div>
  </div>

  <!-- COLUMN 2 -->
  <div class="actions">
    <ActionBox {result} onTimeline={addToTimeline} />
  </div>
</div>

<style lang="scss">
  .summary-container {
    // Positioning from parent
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    height: 50vh;

    // Layout
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-image: url("/images/texture-2.png");

    display: flex;
    flex-direction: row;

    .results {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .actions {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
  }
</style>
