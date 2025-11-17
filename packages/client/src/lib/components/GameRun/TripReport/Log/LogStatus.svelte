<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"

  gsap.registerPlugin(TextPlugin)

  let {
    status,
    delay = 0,
    onTimeline
  }: {
    status: "START" | "END"
    delay?: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Elements
  let element = $state<HTMLDivElement | null>(null)
  // Timeline
  const timeline = gsap.timeline({ delay })

  const statusText = $derived(`TRIP REPORT // ${status}`)

  // Ensure root element is mounted
  onMount(() => {
    // Only create animation if onTimeline is provided
    // Otherwise, parent will handle the animation manually
    if (onTimeline) {
      timeline.set(".status", {
        opacity: 0
      })

      timeline.to(".status", {
        opacity: 1,
        duration: 0.5,
        ease: "power2.out"
      })
      onTimeline(timeline)
    }
  })
</script>

<div class="trip-status" bind:this={element}>
  <div class="status">{statusText}</div>
</div>

<style lang="scss">
  .trip-status {
    display: flex;
    margin-bottom: 0.5em;
    line-height: 1.2em;
    font-size: var(--font-size-normal);

    .status {
      display: inline-block;
      background: var(--background-semi-transparent);
      color: var(--foreground);
      padding: 10px;
      max-width: 60%;
      font-family: var(--typewriter-font-stack);
    }
  }
</style>
