<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"

  import {
    frozenRoom,
    frozenRat,
  } from "@svelte/components/Main/RoomResult/state.svelte"

  // Elements
  let nameElement = $state<HTMLDivElement>()
  let imageContainerElement = $state<HTMLDivElement>()
  let promptElement = $state<HTMLDivElement>()
  let roomMetaElement = $state<HTMLDivElement>()

  // Create parent timeline
  const metaTimeline = gsap.timeline({
    defaults: { duration: 0.75, ease: "power2.out" },
  })

  onMount(() => {
    console.log("$frozenRoom", $frozenRoom)
    console.log("$frozenRat", $frozenRat)

    if (
      !roomMetaElement ||
      !nameElement ||
      !imageContainerElement ||
      !promptElement
    ) {
      console.error("RoomMeta: Missing elements")
      return
    }

    // Set initial values
    gsap.set(roomMetaElement, { opacity: 1 })
    gsap.set(nameElement, { opacity: 0, scale: 0.95 })
    gsap.set(imageContainerElement, { opacity: 0, scale: 0.95 })
    gsap.set(promptElement, { opacity: 0, scale: 0.95 })

    // Add to timeline
    metaTimeline.to(nameElement, { opacity: 1, scale: 1, delay: 0.5 })
    metaTimeline.to(imageContainerElement, { opacity: 1, scale: 1 })
    metaTimeline.to(promptElement, { opacity: 1, scale: 1 })
    metaTimeline.to(roomMetaElement, { opacity: 0, duration: 0.25 })
    metaTimeline.to(roomMetaElement, { display: "none" })
  })
</script>

<div class="room-meta" bind:this={roomMetaElement}>
  <div class="inner">
    <!-- NAME -->
    <div class="name" bind:this={nameElement}>
      {$frozenRoom?.name ?? ""}
    </div>
    <!-- IMAGE -->
    <div class="image-container" bind:this={imageContainerElement}>
      <img src="/images/room3.jpg" alt={$frozenRoom?.name ?? ""} />
    </div>
    <!-- PROMPT -->
    <div class="prompt" bind:this={promptElement}>
      {$frozenRoom?.roomPrompt ?? ""}
    </div>
  </div>
</div>

<style lang="scss">
  .room-meta {
    padding: 0;
    position: fixed;
    inset: 0;
    text-align: center;
    display: flex;
    height: 100dvh;
    z-index: 10000;
    justify-content: center;
    align-items: center;
    background: black;
    color: white;

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 400px;
      max-width: 90vw;

      .image-container {
        width: 100%;
        border: 1px solid white;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .name {
        background: var(--color-alert);
        color: black;
        // width: auto;
        display: block;
      }
    }
  }
</style>
