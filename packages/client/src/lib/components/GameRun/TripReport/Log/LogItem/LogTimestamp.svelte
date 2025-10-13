<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import { gsap } from "gsap"
  import { playSound } from "$lib/modules/sound"
  import { TIMESTAMP_DURATION } from "$lib/components/GameRun/TripReport/Log/config"

  let {
    logEntry,
    onTimeline
  }: {
    logEntry: MergedLogEntry
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let timestampElement = $state<HTMLDivElement | null>(null)

  // Timeline
  const timeline = gsap.timeline()

  // Stage 1: Prepare the animation
  const prepare = () => {
    // Ensure timestamp starts invisible
    gsap.set(timestampElement, {
      opacity: 0
    })
  }

  // Stage 2: Main animation
  const main = () => {
    timeline.call(() => {
      playSound("ratfunUI", "type2")
    })

    timeline.to(timestampElement, {
      opacity: 1,
      duration: TIMESTAMP_DURATION,
      ease: "power2.out"
    })
  }

  // Timeline is constructed
  // Pass it to the parent component
  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }

  // Run once
  const run = () => {
    prepare()
    main() // Build the timeline synchronously
    done() // Call done immediately after building
  }

  // Ensure root element is mounted
  $effect(() => {
    if (timestampElement) {
      run()
    }
  })
</script>

<div class="timestamp" bind:this={timestampElement}>
  <span>{logEntry.timestamp}</span>
</div>

<style lang="scss">
  .timestamp {
    display: inline-block;
    background: var(--color-alert-priority);
    padding: 5px;
    color: var(--background);
    font-size: var(--font-size-normal);
    margin-right: 10px;

    span {
      position: relative;
      top: -4px;
    }
  }
</style>
