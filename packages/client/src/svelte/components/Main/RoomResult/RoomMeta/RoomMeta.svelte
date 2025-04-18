<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"

  import {
    frozenRoom,
    frozenRat,
    freezeObjects,
  } from "@components/Main/RoomResult/state.svelte"
  import { staticContent, lastUpdated, urlFor } from "@modules/content"

  const { rat, room }: { rat: Rat; room: Room } = $props()

  // Elements
  let roomIndexElement = $state<HTMLDivElement>()
  let imageContainerElement = $state<HTMLDivElement>()
  let promptElement = $state<HTMLDivElement>()
  let roomInnerElement = $state<HTMLDivElement>()
  let sanityRoomContent = $derived(
    $staticContent.rooms.find(r => r.title == roomId)
  )

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
    // console.log("$frozenRoom", $frozenRoom)
    // console.log("$frozenRat", $frozenRat)

    if (
      !roomInnerElement ||
      !imageContainerElement ||
      !promptElement ||
      !roomIndexElement
    ) {
      console.error("RoomMeta: Missing elements")
      return
    }

    // Set initial values
    gsap.set(imageContainerElement, { opacity: 0, scale: 0.95 })
    gsap.set(promptElement, { opacity: 0, scale: 0.95 })
    gsap.set(roomIndexElement, { opacity: 0, scale: 0.95 })
    // Add to timeline
    metaTimeline.to(roomIndexElement, { opacity: 1, scale: 1, delay: 0.5 })
    metaTimeline.to(imageContainerElement, { opacity: 1, scale: 1 })
    metaTimeline.to(promptElement, { opacity: 1, scale: 1 })
    metaTimeline.to(roomInnerElement, { opacity: 0, delay: 2, duration: 0.5 })
  })
</script>

<div class="room-meta">
  <div class="inner" bind:this={roomInnerElement}>
    <div class="room-index" bind:this={roomIndexElement}>
      ROOM #{$frozenRoom?.index ?? ""}
    </div>
    <!-- IMAGE -->
    <div class="room-image">
      {#key $lastUpdated}
        {#if sanityRoomContent}
          <img src={urlFor(sanityRoomContent?.image).url()} alt={room.name} />
        {:else}
          <img src="/images/room3.jpg" alt={room.name} />
        {/if}
      {/key}
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

      .image-container {
        width: 100%;
        border: 1px solid white;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .prompt {
        background: var(--color-alert);
        color: black;
        width: auto;
        display: inline-block;
        padding: 5px;
      }

      .room-index {
        background: var(--color-grey-light);
        color: black;
        width: auto;
        padding: 5px;
      }
    }
  }
</style>
