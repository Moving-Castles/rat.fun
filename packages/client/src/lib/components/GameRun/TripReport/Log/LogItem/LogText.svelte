<script lang="ts">
  import type { MergedLogEntry } from "$lib/components/GameRun/types"
  import { gsap } from "gsap"
  import { typeHit } from "$lib/modules/sound"
  import { CHARACTER_DELAY } from "$lib/components/GameRun/TripReport/Log/config"

  let {
    logEntry,
    onTimeline
  }: {
    logEntry: MergedLogEntry
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let logTextElement = $state<HTMLSpanElement | null>(null)

  // Timeline
  const timeline = gsap.timeline()

  // Type hit helper
  const playTypeHit = (char: string) => {
    if (logTextElement) {
      logTextElement.textContent += char
      typeHit()
    }
  }

  // Stage 1: Prepare the animation
  const prepare = () => {
    // Ensure text starts invisible
    gsap.set(logTextElement, {
      opacity: 0
    })
    // Clear potential previous text content if element re-renders
    if (logTextElement) {
      logTextElement.textContent = ""
    }
  }

  // Stage 2: Main animation
  const main = () => {
    // Typing Animation
    timeline.set(logTextElement, {
      text: "",
      opacity: 1
    })
    const chars = logEntry.event.split("")
    for (let i = 0; i < chars.length; i++) {
      timeline.call(playTypeHit, [chars[i]], `+=${CHARACTER_DELAY}`)
    }
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
    if (logTextElement) {
      run()
    }
  })
</script>

<div class="log-text" bind:this={logTextElement}></div>

<style lang="scss">
  .log-text {
    display: inline-block;
    background: var(--color-grey-light);
    padding: 5px;
    color: var(--background);
    max-width: 60%;
    font-family: var(--special-font-stack);
  }
</style>
