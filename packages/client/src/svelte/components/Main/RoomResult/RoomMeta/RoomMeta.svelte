<script lang="ts">
  import { onMount } from "svelte"
  import { gsap } from "gsap"
  import { staticContent, urlFor } from "@modules/content"
  import type { Hex } from "viem"
  import {
    frozenRoom,
    freezeObjects,
  } from "@components/Main/RoomResult/state.svelte"
  import { renderSafeString } from "@modules/utils"

  const { rat, room, roomId }: { rat: Rat; room: Room; roomId: Hex } = $props()

  // Elements
  let roomIndexElement = $state<HTMLDivElement>()
  let imageContainerElement = $state<HTMLDivElement>()
  let promptElement = $state<HTMLDivElement>()
  let roomInnerElement = $state<HTMLDivElement>()

  let sanityRoomContent = $derived(
    $staticContent.rooms.find(r => r._id == (roomId ?? ""))
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
    freezeObjects(rat, room, roomId)
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
    <div class="image-container" bind:this={imageContainerElement}>
      {#if sanityRoomContent}
        <img
          src={urlFor(sanityRoomContent?.image)
            .width(700)
            .auto("format")
            .saturation(-100)
            .url()}
          alt={`room #${$frozenRoom?.index ?? ""}`}
        />
      {:else}
        <img
          src="/images/room3.jpg"
          alt={`room #${$frozenRoom?.index ?? ""}`}
        />
      {/if}
    </div>
    <!-- PROMPT -->
    <div class="prompt" bind:this={promptElement}>
      {renderSafeString($frozenRoom?.prompt ?? "")}
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
    height: var(--game-window-height);
    justify-content: center;
    align-items: center;
    background: var(--background);
    color: var(--foreground);

    .inner {
      display: flex;
      flex-flow: column nowrap;
      justify-content: center;
      align-items: center;
      gap: 1rem;
      width: 600px;
      max-width: calc(var(--game-window-width) * 0.9);

      .image-container {
        width: 100%;
        border: var(--default-border-style);

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          aspect-ratio: 4 / 3;
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
        background: var(--color-grey-light);
        color: var(--background);
        width: auto;
        padding: 5px;
      }
    }
  }
</style>
