<script lang="ts">
  import { Howl } from "howler"
  import { onMount, onDestroy } from "svelte"
  import { urlFor } from "@modules/content/sanity"
  import type { ServerReturnValue } from "@components/Main/RoomResult/types"
  import { type Room } from "@modules/state/base/types"
  import { RESULT_POPUP_STATE } from "@modules/ui/enums"
  import RatDeath from "@components/Main/RatContainer/YourRat/RatDeath.svelte" // move to more appropriate place
  import RatElevator from "@components/Main/RatContainer/YourRat/RatElevator.svelte" // move to more appropriate place
  import { frozenRat } from "@components/Main/RoomResult/state.svelte"
  import { ratLevel } from "@modules/state/base/stores"
  import { playSound } from "@modules/sound"

  let {
    popupState,
    result,
    room,
    sanityRoomContent,
  }: {
    popupState: RESULT_POPUP_STATE
    result?: ServerReturnValue
    room: Room
    sanityRoomContent: any
  } = $props()

  let snd = $state<Howl | undefined>(undefined)

  $inspect(sanityRoomContent)

  onMount(() => {
    if (popupState === RESULT_POPUP_STATE.RAT_DEAD) {
      snd = playSound("tcm", "machineFlowing", true)
    }
    if (popupState === RESULT_POPUP_STATE.ROOM_DEPLETED) {
      snd = playSound("tcm", "loadingVariation", true)
    }
  })

  onDestroy(() => {
    snd?.stop()
  })
</script>

<!-- {#if state === RESULT_POPUP_STATE.RAT_DEAD}
{/if} -->

<div class="room-event-popup">
  <div
    class="inner"
    class:warning-mute={popupState !== RESULT_POPUP_STATE.ROOM_DEPLETED}
    class:warning={popupState === RESULT_POPUP_STATE.ROOM_DEPLETED}
  >
    <div class="content">
      <!-- Big colored text to explain the situation -->
      <h1
        class="message"
        class:death={popupState === RESULT_POPUP_STATE.RAT_DEAD}
        class:levelup={popupState === RESULT_POPUP_STATE.LEVEL_UP}
        class:leveldown={popupState === RESULT_POPUP_STATE.LEVEL_DOWN}
        class:depleted={popupState === RESULT_POPUP_STATE.ROOM_DEPLETED}
      >
        {#if popupState === RESULT_POPUP_STATE.RAT_DEAD}
          {$frozenRat?.name} DIED
        {/if}
        {#if popupState === RESULT_POPUP_STATE.LEVEL_UP}
          <span class="rotate-down digit">&#x203a;</span><span class=""
            >{$ratLevel.index}</span
          >
        {/if}
        {#if popupState === RESULT_POPUP_STATE.LEVEL_DOWN}
          <span class="rotate-up digit">&#x203a;</span><span class=""
            >{$ratLevel.index}</span
          >
        {/if}
        {#if popupState === RESULT_POPUP_STATE.ROOM_DEPLETED}
          ROOM #{room?.index} DEPLETED
        {/if}
      </h1>
    </div>

    <div
      class="background"
      class:death={popupState === RESULT_POPUP_STATE.RAT_DEAD}
      class:levelup={popupState === RESULT_POPUP_STATE.LEVEL_UP}
      class:leveldown={popupState === RESULT_POPUP_STATE.LEVEL_DOWN}
      class:depleted={popupState === RESULT_POPUP_STATE.ROOM_DEPLETED}
    >
      {#if popupState === RESULT_POPUP_STATE.RAT_DEAD}
        <RatDeath />
      {/if}
      {#if popupState === RESULT_POPUP_STATE.LEVEL_DOWN || popupState === RESULT_POPUP_STATE.LEVEL_UP}
        <RatElevator
          direction={popupState === RESULT_POPUP_STATE.LEVEL_UP ? -1 : 1}
        />
      {/if}
      {#if popupState === RESULT_POPUP_STATE.ROOM_DEPLETED}
        <img
          class="background-image"
          src={urlFor(sanityRoomContent?.image)
            .width(400)
            .auto("format")
            .saturation(-100)
            .url()}
          alt={room.roomPrompt}
        />
      {/if}
    </div>
    <!-- Rat visualisation dying -->
  </div>
</div>

<style lang="scss">
  .room-event-popup {
    position: relative;
    height: 400px;
    width: 400px;

    .inner {
      position: relative;
      width: 100%;
      height: 100%;

      .message {
        padding: 0;
        color: var(--foreground);
        font-family: var(--label-font-stack);
        letter-spacing: -0.2em;
        font-size: var(--font-size-extra-large);
        line-height: calc(var(--font-size-extra-large) * 0.7);
        font-weight: normal;
        width: 100%;
        text-align: center;

        .digit {
          display: block;
          width: 50%;
          height: 100%;
          float: left;
          text-align: center;
        }

        &.death {
          background: var(--color-alert-priority);
          color: var(--background);
        }

        &.depleted {
          background: var(--black);
          color: var(--color-value);
        }

        &.levelup {
          background: var(--color-value-up);
          color: var(--background);
        }

        &.leveldown {
          background: var(--color-value-down);
          color: var(--background);
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
    transform: rotate(-90deg);
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
