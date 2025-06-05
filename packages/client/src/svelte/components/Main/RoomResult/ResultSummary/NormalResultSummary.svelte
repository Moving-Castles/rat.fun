<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { onMount, onDestroy } from "svelte"
  import { Howl } from "howler"
  import { getUIState } from "@modules/ui/state.svelte"
  import { playSound } from "@modules/sound"

  let { rooms } = getUIState()

  let {
    room,
    staticRoomContent,
    result,
  }: {
    room: Room
    staticRoomContent: any
    result: EnterRoomReturnValue | null
  } = $props()

  let snd = $state<Howl | undefined>(undefined)

  $inspect(staticRoomContent)
  $inspect(result)
  $inspect(room)

  onMount(() => {
    console.log("on mount")
    snd = playSound("tcm", "win", true)
  })

  onDestroy(() => {
    snd?.stop()
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
    <div class="inner">
      <div class="content">
        <!-- Big colored text to explain the situation -->
        <h1 class="message">SOMETHING HAPPENED</h1>
        <button
          class="close-button"
          onclick={() => {
            rooms.close(false)
          }}
        >
          LEAVE ROOM
        </button>
      </div>

      <div class="background"></div>
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
    z-index: 1;
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
        z-index: 0;
        overflow: hidden;

        .background-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
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
        z-index: 10;
        display: flex;
        flex-flow: column nowrap;
        justify-content: center;
        align-items: center;
      }
    }
  }

  .rotate-down {
    display: inline-block;
    transform: rotate(90deg) translate(-8px, 0);
  }

  .rotate-up {
    display: inline-block;
    transform: rotate(-90deg) translate(-4px, 0);
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
