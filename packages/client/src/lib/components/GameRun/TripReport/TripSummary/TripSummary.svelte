<script lang="ts">
  import type { EnterTripReturnValue } from "@server/modules/types"
  import { playSound } from "$lib/modules/sound"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { gsap } from "gsap"
  import { frozenRat } from "$lib/components/GameRun/state.svelte"

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

  const ratDead = $derived(result?.ratDead)

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
        playSound({ category: "ratfunUI", id: "panelIn" })
        if (ratDead) {
          backgroundMusic.play({ category: "ratfunMusic", id: "death", loop: true, fadeIn: true })
        }
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
        duration: 1.0,
        ease: "power4.out" // elastic.out
      },
      0
    )
  }

  function addToTimeline(timeline: ReturnType<typeof gsap.timeline>, offset: number | string = 0) {
    // Add child timelines at their specified offset position
    summaryTimeline.add(timeline, offset)
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
    <div class="results-inner">
      <HealthBox
        {result}
        initialBalance={Number(frozenRat?.balance ?? 0)}
        onTimeline={addToTimeline}
      />
      <ItemBox {result} onTimeline={addToTimeline} />
      <TotalValueBox
        {result}
        initialTotalValue={frozenRat?.initialTotalValue ?? 0}
        onTimeline={addToTimeline}
      />
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
    height: 400px;

    background-image: url("/images/texture-2.png");

    // Layout
    display: flex;
    flex-direction: row;
    justify-content: center;
    align-items: center;

    @media (max-width: 768px) {
      flex-direction: column;
    }

    .results {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;

      .results-inner {
        width: 100%;
      }

      @media (max-width: 768px) {
        width: 100%;
      }
    }

    .actions {
      width: 50%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      margin-top: -20px;

      @media (max-width: 768px) {
        width: 100%;
      }
    }
  }
</style>
