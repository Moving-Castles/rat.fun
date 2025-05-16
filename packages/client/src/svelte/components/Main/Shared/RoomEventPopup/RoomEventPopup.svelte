<script lang="ts">
  import { onMount } from "svelte"
  import type { ServerReturnValue } from "@components/Main/RoomResult/types"
  import { RESULT_POPUP_STATE } from "@modules/ui/enums"
  import RatDeath from "@components/Main/RatContainer/YourRat/RatDeath.svelte" // move to more appropriate place
  import { frozenRat } from "@components/Main/RoomResult/state.svelte"
  import { playSound } from "@modules/sound"

  let {
    state,
    result,
  }: { state: RESULT_POPUP_STATE; result?: ServerReturnValue } = $props()

  onMount(() => {
    if (state === RESULT_POPUP_STATE.RAT_DEATH) {
      playSound("tcm", "machineFlowing", true)
    }
  })
</script>

<!-- {#if state === RESULT_POPUP_STATE.RAT_DEATH}
{/if} -->

<div class="room-event-popup">
  <div class="inner warning-mute">
    <div class="content">
      <!-- Big colored text to explain the situation -->
      <h1 class="message" class:death={state === RESULT_POPUP_STATE.RAT_DEATH}>
        {#if state === RESULT_POPUP_STATE.RAT_DEATH}
          {$frozenRat?.name} DIED
        {/if}
      </h1>
    </div>

    <div class="background">
      {#if state === RESULT_POPUP_STATE.RAT_DEATH}
        <RatDeath />
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
        max-width: 768px;
        text-align: center;

        &.death {
          background: var(--color-alert-priority);
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
        mix-blend-mode: screen;
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
</style>
