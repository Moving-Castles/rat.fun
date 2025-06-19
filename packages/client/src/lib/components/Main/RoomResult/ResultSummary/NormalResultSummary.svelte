<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { onMount } from "svelte"
  import { getUIState } from "$lib/modules/ui/state.svelte"
  import { playSound } from "$lib/modules/sound"
  import { gsap } from "gsap"
  import { frozenRat } from "$lib/components/Main/RoomResult/state.svelte"
  import { fade } from "svelte/transition"
  import OutcomeItem from "$lib/components/Main/Shared/OutcomeItem/OutcomeItem.svelte"
  // import Trait from "$lib/components/Main/Shared/Trait/Trait.svelte"
  // import Item from "$lib/components/Main/Shared/Item/Item.svelte"

  let { rooms } = getUIState()

  let {
    result,
  }: {
    room: Room
    staticRoomContent: any
    result: EnterRoomReturnValue | null
  } = $props()

  let innerContainerElement = $state<HTMLDivElement | null>(null)
  let messageElement = $state<HTMLHeadingElement | null>(null)
  let closeButtonElement = $state<HTMLButtonElement | null>(null)
  let changes = $derived([
    ...(result?.itemChanges || []).map(itm => ({ ...itm, type: "item" })),
    ...(result?.traitChanges || []).map(trt => ({ ...trt, type: "trait" })),
  ])

  // Timeline
  const timeline = gsap.timeline()

  onMount(() => {
    if (!innerContainerElement || !messageElement || !closeButtonElement) {
      console.error("Missing elements")
      return
    }

    gsap.set([messageElement, closeButtonElement], {
      opacity: 0,
    })

    gsap.set(innerContainerElement, {
      scale: 0,
    })

    timeline.call(() => {
      playSound("tcm", "ratsUp")
    })

    timeline.to(innerContainerElement, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out",
    })

    timeline.to(messageElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    })

    timeline.to(closeButtonElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    })
  })
</script>

<div
  onclick={async () => {
    await rooms.close(false)
  }}
  role="presentation"
  class="popup-container"
>
  <div class="room-event-popup">
    <div class="inner" bind:this={innerContainerElement}>
      <div class="content">
        <div class="message" bind:this={messageElement}>
          <h1>
            {$frozenRat?.name} LIVED
          </h1>

          {#if changes.length > 0}
            <span class="message-text"> GOT: </span>
            {#each changes as change, i}
              <div
                class="inline-block"
                transition:fade|global={{ delay: i * 120 }}
              >
                <OutcomeItem
                  negative={false}
                  type={change.type}
                  value={change.name}
                />
              </div>
            {/each}
          {/if}
        </div>
        <button
          bind:this={closeButtonElement}
          class="close-button"
          onclick={() => {
            rooms.close(false)
          }}
        >
          LEAVE ROOM
        </button>
      </div>

      <div class="background">
        <img
          class="background-image"
          src={$frozenRat?.image}
          alt={$frozenRat?.name}
        />
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  .popup-container {
    background: rgba(0, 0, 0, 0.8);
    position: absolute;
    inset: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    overscroll-behavior: none;
    z-index: var(--z-sub);
  }

  .room-event-popup {
    position: relative;
    height: 400px;
    width: 100%;
    max-width: calc(var(--game-window-height) * 0.6);
    max-height: calc(var(--game-window-height) * 0.9);
    overflow-x: hidden;
    overflow-y: scroll;
    background: var(--color-alert);

    .inner {
      position: relative;
      width: 100%;
      height: 100%;

      .message {
        padding: 1rem;
        color: var(--foreground);
        font-family: var(--label-font-stack);
        font-size: var(--font-size-large);
        line-height: calc(var(--font-size-extra-large) * 0.7);
        font-weight: normal;
        text-align: center;

        .message-text {
          letter-spacing: -0.2em;
        }
      }

      .background {
        height: var(--game-window-height);
        width: var(--game-window-height);
        position: absolute;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        z-index: var(--z-sub);
        overflow: hidden;
        mix-blend-mode: screen;

        .background-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
          object-position: center;
          opacity: 0.5;
        }

        &.room-depleted {
          .background-image {
            animation: fade-out 60s ease;
          }
        }
      }

      .content {
        position: relative;
        height: 100%;
        z-index: var(--z-base);
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        align-items: center;
      }
    }
  }

  .close-button {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    height: 3rem;
    border: none;

    background: var(--black);
    background: var(--color-alert-priority);

    &:hover {
      background: var(--color-alert);
      color: var(--white);
    }
  }

  .inline-block {
    display: inline-block;
  }

  @keyframes fade-out {
    0% {
      opacity: 1;
      transform: scale(1);
    }
    100% {
      opacity: 0;
      transform: scale(1.5);
    }
  }
</style>
