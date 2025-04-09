<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"

  import {
    frozenRoom,
    frozenRat,
    freezeObjects,
  } from "@svelte/components/Main/RoomResult/state.svelte"

  const { rat, room }: { rat: Rat; room: Room } = $props()

  // Elements
  let nameElement = $state<HTMLDivElement>()
  let imageContainerElement = $state<HTMLDivElement>()
  let promptElement = $state<HTMLDivElement>()

  // Create parent timeline
  const metaTimeline = gsap.timeline({
    defaults: { duration: 0.75, ease: "power2.out" },
  })

  onMount(() => {
    // Snapshot room and rat
    // We want the pre-result state to gradually apply changes to
    // without reactivity from on chain changes
    // Do it here becuase RoomResult parent is loaded early
    freezeObjects(rat, room)
    console.log("$frozenRoom", $frozenRoom)
    console.log("$frozenRat", $frozenRat)

    if (!nameElement || !imageContainerElement || !promptElement) {
      return
    }

    // Set initial values
    gsap.set(nameElement, { opacity: 0 })
    gsap.set(imageContainerElement, { opacity: 0 })
    gsap.set(promptElement, { opacity: 0 })

    // Add to timeline
    metaTimeline.to(nameElement, { opacity: 1, delay: 0.5 })
    metaTimeline.to(imageContainerElement, { opacity: 1 })
    metaTimeline.to(promptElement, { opacity: 1 })
  })
</script>

<div class="room-meta">
  {#if $frozenRoom}
    <div class="inner">
      <!-- NAME -->
      <div class="name" bind:this={nameElement}>
        {$frozenRoom.name}
      </div>
      <!-- IMAGE -->
      <div class="image-container" bind:this={imageContainerElement}>
        <img src="/images/room3.jpg" alt={$frozenRoom.name} />
      </div>
      <!-- PROMPT -->
      <div class="prompt" bind:this={promptElement}>
        {$frozenRoom.roomPrompt}
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .room-meta {
    padding: 0;
    position: absolute;
    inset: 0;
    text-align: center;
    display: flex;
    height: 100dvh;
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
      font-size: 1.5rem;

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
        background: white;
        color: black;
        width: auto;
        display: inline-block;
      }
    }
  }
</style>
