<script lang="ts">
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { sendGiveCallerTokens } from "$lib/modules/action-manager/index.svelte"
  import { environment } from "$lib/modules/network"
  import {
    playerHasTokens,
    playerHasLiveRat,
    tokenAllowanceApproved
  } from "$lib/modules/state/stores"
  import { ENVIRONMENT } from "$lib/mud/enums"
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

  const onClick = () => {
    busy = true
    sendGiveCallerTokens()
    // Wait for result in $effect block above
  }
</script>

<div class="no-tokens">
  {#if busy}
    <div class="loading">{UI_STRINGS.gettingTokens} <SmallSpinner soundOn /></div>
  {:else if $environment == ENVIRONMENT.BASE}
    <div class="notice">{UI_STRINGS.waitForTokens}</div>
  {:else}
    <div class="button-container">
      <BigButton text={UI_STRINGS.getTokens(2000)} disabled={busy} onclick={onClick} />
    </div>
  {/if}
</div>

<style lang="scss">
  .no-tokens {
    text-align: center;
    color: var(--white);
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
      color: black;
      background: orangered;
      padding: 10px;
    }

    .notice {
      font-size: var(--font-size-normal);
      font-family: var(--typewriter-font-stack);
      color: black;
      background: orangered;
      padding: 10px;
    }
    .button-container {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translateX(-50%) translateY(-50%);
      overflow: hidden;
      width: 90%;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 200px;
    }
  }
</style>
