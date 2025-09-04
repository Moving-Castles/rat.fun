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

  // Create parent timeline
  const splashScreenTimeline = gsap.timeline({
    defaults: { duration: 0.75, ease: "power2.out" }
  })

  onMount(() => {
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
      onComplete()
    }, 4000)
  })
</script>

<div class="splash-screen">
  <div class="inner" bind:this={roomInnerElement}>SETUP PHASE</div>
</div>

<style lang="scss">
  .splash-screen {
    padding: 0;
    position: absolute;
    inset: 0;
    text-align: center;
    display: flex;
    height: var(--game-window-height);
    justify-content: center;
    align-items: center;
    color: var(--foreground);
    font-size: 64px;

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 500px;
      max-width: calc(var(--game-window-width) * 0.9);

      .image-container {
        width: 100%;
        border: var(--default-border-style);
        line-height: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          aspect-ratio: 1/1;
        }

        .image-placeholder {
          width: 100%;
          aspect-ratio: 1/1;
        }
      }

      .prompt {
        background: var(--color-alert);
        color: var(--background);
        width: auto;
        display: inline-block;
        padding: 5px;
        max-width: 50ch;
      }

      .room-index {
        background: var(--color-alert-priority);
        color: var(--background);
        width: auto;
        padding: 5px;
      }
    }
  }
</style>
