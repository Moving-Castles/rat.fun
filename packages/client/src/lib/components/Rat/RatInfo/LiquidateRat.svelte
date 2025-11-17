<script lang="ts">
  import { onDestroy } from "svelte"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { DangerButton, Tooltip } from "$lib/components/Shared"
  import { rat } from "$lib/modules/state/stores"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { getRatTotalValue } from "$lib/modules/state/utils"
  import { Tween } from "svelte/motion"
  import { strings } from "$lib/modules/strings"

  let { displayRat }: { displayRat: Rat | null } = $props()

  const initialValue = displayRat ? getRatTotalValue(displayRat) : getRatTotalValue($rat)
  const tweenedValue = new Tween(initialValue)
  let playing = $state(false)

  $effect(() => {
    if (displayRat) {
      tweenedValue.set(getRatTotalValue(displayRat), { delay: 2000 })
    }
  })

  $effect(() => {
    if (tweenedValue.current > tweenedValue.target && !playing) {
      playing = true
    } else if (!playing && tweenedValue.current < tweenedValue.target) {
      playing = true
    }
  })

  const onclick = async () => {
    ratState.state.transitionTo(RAT_BOX_STATE.CONFIRM_LIQUIDATION)
  }

  onDestroy(() => {
    // Stop tween immediately to prevent delayed unmount
    tweenedValue.set(tweenedValue.current, { duration: 0 })
  })
</script>

<div class="liquidate-rat">
  {#if displayRat}
    <div class="total-value">
      <!-- <div class="label">Total Value</div> -->
      <div class:glow={tweenedValue.current !== tweenedValue.target} class="value">
        <!-- <Tooltip content={} -->
        <span>{CURRENCY_SYMBOL}{Math.floor(tweenedValue.current)}</span>
      </div>
    </div>
    <div class="action">
      <DangerButton
        text={strings.liquidateRatButtonText}
        tippyText={strings.liquidateRatInstruction}
        {onclick}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .liquidate-rat {
    height: 100%;
    display: flex;
    background-image: url("/images/texture-5.png");
    .total-value {
      width: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      display: flex;
      flex-direction: column;

      .value {
        margin-top: 8px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 72px;
        line-height: 72px;
        color: rgba(255, 255, 255, 0.7);
        transition: all 0.2s ease;

        &.glow {
          color: rgba(255, 255, 255, 1);
          filter: drop-shadow(0px 0px 2px #ffffff);
        }

        @media (max-width: 800px) {
          font-size: 48px;
        }
      }
    }

    .action {
      width: 50%;
      padding: 5px;
    }
  }
</style>
