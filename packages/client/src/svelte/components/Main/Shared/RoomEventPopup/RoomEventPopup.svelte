<script lang="ts">
  import { Howl } from "howler"
  import { onMount, onDestroy } from "svelte"
  import type { ServerReturnValue } from "@components/Main/RoomResult/types"
  import { type Room } from "@modules/state/base/types"
  import FloorDescription from "@components/Main/Floors/FloorDescription.svelte"
  import { RESULT_EVENT } from "@modules/ui/enums"
  import { getUIState } from "@modules/ui/state.svelte"
  import { frozenRat } from "@components/Main/RoomResult/state.svelte"
  import { ratLevel } from "@modules/state/base/stores"
  import { playSound } from "@modules/sound"
  import { getModalState } from "@components/Main/Modal/state.svelte"

  let { rooms } = getUIState()
  let { modal } = getModalState()

  let {
    resultEvent,
    result,
    room,
    sanityRoomContent,
  }: {
    resultEvent: RESULT_EVENT
    result?: ServerReturnValue
    room: Room
    sanityRoomContent: any
  } = $props()

  let snd = $state<Howl | undefined>(undefined)

  $inspect(sanityRoomContent)

  onMount(() => {
    console.log("on mount")
    if (resultEvent === RESULT_EVENT.RAT_DEAD) {
      snd = playSound("tcm", "machineFlowing", true)
    }
    if (resultEvent === RESULT_EVENT.LEVEL_UP) {
      snd = playSound("tcm", "win", true)
    }
    if (resultEvent === RESULT_EVENT.LEVEL_DOWN) {
      snd = playSound("tcm", "TRX_yes_c", true)
    }
    if (resultEvent === RESULT_EVENT.ROOM_DEPLETED) {
      snd = playSound("tcm", "loadingVariation", true)
    }
  })

  onDestroy(() => {
    snd?.stop()
  })
</script>

<div class="popup-container">
  <div class="room-event-popup">
    <div
      class="inner"
      class:death={resultEvent === RESULT_EVENT.RAT_DEAD}
      class:levelup={resultEvent === RESULT_EVENT.LEVEL_UP}
      class:leveldown={resultEvent === RESULT_EVENT.LEVEL_DOWN}
      class:depleted={resultEvent === RESULT_EVENT.ROOM_DEPLETED}
    >
      <div class="content">
        <!-- Big colored text to explain the situation -->
        <h1 class="message">
          {#if resultEvent === RESULT_EVENT.RAT_DEAD}
            {$frozenRat?.name} DIED
          {/if}
          {#if resultEvent === RESULT_EVENT.LEVEL_UP}
            {$frozenRat?.name} TRANSFERRED DOWN TO {$ratLevel.index === 0
              ? ""
              : "-"}{$ratLevel.index}
            <FloorDescription />
          {/if}
          {#if resultEvent === RESULT_EVENT.LEVEL_DOWN}
            {$frozenRat?.name} TRANSFERRED UP TO {$ratLevel.index === 0
              ? ""
              : "-"}{$ratLevel.index}
            <FloorDescription />
          {/if}
          {#if resultEvent === RESULT_EVENT.ROOM_DEPLETED}
            ROOM #{room?.index} DEPLETED
          {/if}
        </h1>

        {#if resultEvent === RESULT_EVENT.RAT_DEAD || resultEvent === RESULT_EVENT.LEVEL_UP || resultEvent === RESULT_EVENT.LEVEL_DOWN}
          <button
            class="close-button"
            class:death={resultEvent === RESULT_EVENT.RAT_DEAD}
            class:levelup={resultEvent === RESULT_EVENT.LEVEL_UP}
            class:leveldown={resultEvent === RESULT_EVENT.LEVEL_DOWN}
            onclick={async () => {
              await rooms.close()
              setTimeout(modal.close, 3000)
              // modal.close()
            }}
          >
            LEAVE ROOM
          </button>
        {/if}
      </div>

      <div
        class="background"
        class:death={resultEvent === RESULT_EVENT.RAT_DEAD}
        class:levelup={resultEvent === RESULT_EVENT.LEVEL_UP}
        class:leveldown={resultEvent === RESULT_EVENT.LEVEL_DOWN}
        class:depleted={resultEvent === RESULT_EVENT.ROOM_DEPLETED}
      />
      <!-- Rat visualisation dying -->
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

    .inner {
      position: relative;
      width: 100%;
      height: 100%;

      &.death {
        background: var(--color-alert-priority);
        .message {
          color: var(--background);
        }
      }

      &.depleted {
        background: var(--black);
        .message {
          color: var(--color-value);
        }
      }

      &.levelup {
        background: var(--color-value-up);

        .message {
          color: var(--background);
        }
      }

      &.leveldown {
        background: var(--color-value-down);

        .message {
          color: var(--background);
        }
      }

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
          float: left;
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

        &.levelup,
        &.leveldown,
        &.death {
          mix-blend-mode: screen;
        }

        .background-image {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }

        &.depleted {
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
