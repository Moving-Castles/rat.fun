<script lang="ts">
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { environment } from "$lib/modules/network"
  import { saleStatus } from "$lib/modules/network"
  import { SALE_STATUS } from "@ratfun/common/basic-network"
  import {
    playerHasTokens,
    playerHasLiveRat,
    tokenAllowanceApproved
  } from "$lib/modules/state/stores"
  import { ENVIRONMENT } from "@ratfun/common/basic-network"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import { SmallSpinner, BigButton } from "$lib/components/Shared"

  let busy = $state(false)

  $effect(() => {
    if ($playerHasTokens) {
      // Has tokens
      if ($tokenAllowanceApproved) {
        // Has allowance
        if ($playerHasLiveRat) {
          // Live rat
          ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
        } else {
          // No live rat
          ratState.state.transitionTo(RAT_BOX_STATE.NO_RAT)
        }
      } else {
        // No allowance, rat irrelevant
        ratState.state.transitionTo(RAT_BOX_STATE.NO_ALLOWANCE)
      }
    }
  })

  const goToSale = () => {
    window.open(
      "https://matcha.xyz/tokens/base/0xf2dd384662411a21259ab17038574289091f2d41",
      "_blank"
    )
  }
</script>

<div class="no-tokens">
  {#if busy}
    <div class="loading">{UI_STRINGS.gettingTokens} <SmallSpinner soundOn /></div>
  {:else if $environment == ENVIRONMENT.BASE && $saleStatus === SALE_STATUS.LIVE}
    <div class="container">
      <div class="text-container">
        You do not have $RAT tokens.<br />You need to buy $RAT tokens.
      </div>
      <div class="button-container">
        <BigButton text="Buy $RAT" onclick={goToSale} />
      </div>
    </div>
  {:else}
    <div class="notice">{UI_STRINGS.waitForTokens}</div>
  {/if}
</div>

<style lang="scss">
  .no-tokens {
    text-align: center;
    color: var(--foreground);
    width: 100%;
    height: 100%;
    overflow: hidden;
    position: relative;
    background-image: url("/images/texture-2.png");
    background-size: 200px;
    display: flex;
    justify-content: center;
    align-items: center;

    .loading {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: var(--background);
      background: var(--foreground);
      padding: 10px;
    }

    .notice {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: var(--background);
      background: var(--color-bad);
      padding: 10px;
      width: 50%;
    }

    .container {
      width: 90%;
      .text-container {
        font-size: var(--font-size-large);
        font-family: var(--typewriter-font-stack);
        padding: 10px;
        background: var(--foreground-semi-transparent);
        color: var(--background);
        padding: 10px;
        width: 100%;
        margin-bottom: 20px;
      }

      .button-container {
        overflow: hidden;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 200px;
      }
    }
  }
</style>
