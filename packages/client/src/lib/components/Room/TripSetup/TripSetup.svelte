<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { errorHandler, UIError } from "$lib/modules/error-handling"

  const {
    staticRoomContent,
    onComplete
  }: {
    staticRoomContent: any
    onComplete: () => void
  } = $props()

  // Elements
  let roomIndexElement = $state<HTMLDivElement>()
  let imageContainerElement = $state<HTMLDivElement>()
  let promptElement = $state<HTMLDivElement>()
  let roomInnerElement = $state<HTMLDivElement>()

  // Timer state
  let timeElapsed = $state(0)
  let timerInterval: ReturnType<typeof setInterval> | undefined

  // Create parent timeline
  const splashScreenTimeline = gsap.timeline({
    defaults: { duration: 0.75, ease: "power2.out" }
  })

  onMount(() => {
    // Start timer
    timerInterval = setInterval(() => {
      timeElapsed += 0.1
    }, 100)

    // if (!roomInnerElement || !imageContainerElement || !promptElement || !roomIndexElement) {
    //   errorHandler(new UIError("Missing elements"))
    //   return
    // }

    // // Set initial values
    // gsap.set(imageContainerElement, { opacity: 0, scale: 0.95 })
    // gsap.set(promptElement, { opacity: 0, scale: 0.95 })
    // gsap.set(roomIndexElement, { opacity: 0, scale: 0.95 })

    // // Add to timeline
    // splashScreenTimeline.to(roomIndexElement, {
    //   opacity: 1,
    //   scale: 1,
    //   delay: 0.5
    // })
    // splashScreenTimeline.to(imageContainerElement, { opacity: 1, scale: 1 })
    // splashScreenTimeline.to(promptElement, { opacity: 1, scale: 1 })
    // splashScreenTimeline.to(roomInnerElement, {
    //   opacity: 0,
    //   delay: 2,
    //   duration: 0.5
    // })

    // // Return to parent
    // splashScreenTimeline.call(onComplete)

    setTimeout(() => {
      // Clear timer
      if (timerInterval) {
        clearInterval(timerInterval)
      }
      onComplete()
    }, 4000)
  })
</script>

<div class="splash-screen">
  <div class="inner" bind:this={roomInnerElement}>
    <div class="setup-title">SETUP PHASE</div>
    <div class="timer">{timeElapsed.toFixed(1)}s</div>
  </div>
</div>

<style lang="scss">
  .splash-screen {
    padding: 0;
    position: fixed;
    top: 0;
    left: 0;
    text-align: center;
    display: flex;
    height: 100vh;
    width: 100vw;
    justify-content: center;
    align-items: center;
    color: var(--foreground);
    font-size: 64px;
    background: rgba(0, 0, 0, 1);

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 500px;
      max-width: calc(var(--game-window-width) * 0.9);
      .setup-title {
        font-size: 64px;
        font-weight: bold;
      }

      .timer {
        font-size: 32px;
        font-family: monospace;
        background: var(--color-alert);
        color: var(--background);
        padding: 10px 20px;
        border-radius: 8px;
        min-width: 120px;
        text-align: center;
      }
    }
  }
</style>
