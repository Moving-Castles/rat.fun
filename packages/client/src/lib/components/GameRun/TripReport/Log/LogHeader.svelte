<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { TextPlugin } from "gsap/TextPlugin"

  gsap.registerPlugin(TextPlugin)

  let {
    delay = 0,
    onTimeline
  }: {
    delay?: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Elements
  let element = $state<HTMLDivElement | null>(null)
  // Timeline
  const timeline = gsap.timeline({ delay })

  // Ensure root element is mounted
  onMount(() => {
    timeline.set(".header", {
      opacity: 0
    })

    timeline.to(".header", {
      opacity: 1,
      duration: 0.5,
      ease: "power2.out"
    })
    onTimeline?.(timeline)
  })
</script>

<div class="log-header" bind:this={element}>
  <div class="header">TRIP REPORT</div>
</div>

<style lang="scss">
  .log-header {
    display: flex;
    margin-bottom: 0.5em;
    line-height: 1.2em;
    font-size: var(--font-size-large);

    .header {
      display: inline-block;
      background: var(--color-grey-light);
      padding: 5px;
      color: var(--background);
      max-width: 60%;
      font-family: var(--special-font-stack);
    }
  }
</style>
