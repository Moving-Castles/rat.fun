<script lang="ts">
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { goto } from "$app/navigation"
  import { ratImageUrl } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import { gsap } from "gsap"
  import { onMount } from "svelte"

  let {
    result,
    onTimeline
  }: {
    result: any
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Figure out if rat died or survived
  const ratDied = result?.ratDead
  const statusText = ratDied ? "DIED" : "SURVIVED"

  // Elements
  let summaryContainer = $state<HTMLDivElement | null>(null)

  // Create timeline
  const timeline = gsap.timeline()

  onMount(() => {
    if (summaryContainer) {
      // Animate the summary container (fade in + slide up)
      timeline.fromTo(
        summaryContainer,
        { opacity: 0, y: 50 },
        { opacity: 1, y: 0, duration: 0.6, ease: "power4.out" }
      )

      // Pass timeline to parent
      done()
    }
  })

  // Timeline is constructed
  // Pass it to the parent component
  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }
</script>

<div class="summary-container" bind:this={summaryContainer}>
  <div class="summary">
    <div class="event">
      <div class="image">
        <img src={$ratImageUrl} alt={$frozenRat?.name} />
      </div>
      <div class="event-text">
        {$frozenRat?.name}
        {statusText}
      </div>
    </div>
    <div class="button-container">
      <BigButton
        text="COME DOWN"
        onclick={() => {
          goto("/")
        }}
      />
    </div>
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

    // Initial state (hidden, will be animated in by timeline)
    opacity: 0;

    // Layout
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background-image: url("/images/texture-2.png");

    .event {
      background: var(--color-secondary);
      margin: 0;
      padding: 0;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 80px;
    }

    .image {
      width: 200px;
      height: 200px;
      img {
        width: 100%;
        height: 100%;
      }
    }

    .button-container {
      width: 100%;
      height: 80px;
    }
  }
</style>
