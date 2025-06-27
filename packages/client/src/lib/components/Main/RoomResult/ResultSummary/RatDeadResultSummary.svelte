<script lang="ts">
  import { onMount } from "svelte"
  import { frozenRat } from "$lib/components/Main/RoomResult/state.svelte"
  import { playSound } from "$lib/modules/sound"
  import { gsap } from "gsap"
  import { goto } from "$app/navigation"

  let innerContainerElement = $state<HTMLDivElement | null>(null)
  let messageElement = $state<HTMLHeadingElement | null>(null)
  let closeButtonElement = $state<HTMLButtonElement | null>(null)

  // Timeline
  const timeline = gsap.timeline()

  onMount(() => {
    if (!innerContainerElement || !messageElement || !closeButtonElement) {
      console.error("Missing elements")
      return
    }

    gsap.set([messageElement, closeButtonElement], {
      opacity: 0
    })

    gsap.set(innerContainerElement, {
      scale: 0
    })

    timeline.call(() => {
      playSound("tcm", "ratsDown")
    })

    timeline.to(innerContainerElement, {
      scale: 1,
      duration: 0.4,
      ease: "power2.out"
    })

    timeline.to(messageElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })

    timeline.to(closeButtonElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })
  })
</script>

<div
  onclick={() => {
    goto("/rat")
  }}
  role="presentation"
  class="popup-container"
>
  <div class="room-event-popup">
    <div class="inner" bind:this={innerContainerElement}>
      <div class="content">
        <h1 class="message" bind:this={messageElement}>
          {$frozenRat?.name} DIED
        </h1>
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
        <img class="background-image" src={$frozenRat?.image} alt={$frozenRat?.name} />
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

    .inner {
      position: relative;
      width: 100%;
      height: 100%;

      background: var(--color-death);

      .message {
        padding: 1rem;
        color: var(--foreground);
        color: var(--background);
        font-family: var(--label-font-stack);
        letter-spacing: -0.2em;
        font-size: var(--font-size-extra-large);
        line-height: calc(var(--font-size-extra-large) * 0.7);
        font-weight: normal;
        text-align: center;

        .digit {
          display: inline-block;
          width: 50%;
          text-align: center;
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
      }

      .content {
        position: relative;
        height: 100%;
        z-index: var(--z-sub-top);
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
