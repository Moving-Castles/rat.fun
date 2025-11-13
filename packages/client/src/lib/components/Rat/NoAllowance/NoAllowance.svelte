<script lang="ts">
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { sendApproveMax } from "$lib/modules/action-manager/index.svelte"
  import {
    tokenAllowanceApproved,
    playerHasTokens,
    playerHasLiveRat
  } from "$lib/modules/state/stores"
  import { strings } from "$lib/modules/strings"

  import { SmallSpinner, BigButton } from "$lib/components/Shared"

  let busy = $state(false)

  $effect(() => {
    if ($tokenAllowanceApproved) {
      // Has allowance,
      if ($playerHasTokens) {
        // Has tokens
        if ($playerHasLiveRat) {
          // Live rat
          ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
        } else {
          // No live rat
          ratState.state.transitionTo(RAT_BOX_STATE.NO_RAT)
        }
      } else {
        // No tokens
        ratState.state.transitionTo(RAT_BOX_STATE.NO_TOKENS)
      }
    }
  })

  const onClick = () => {
    busy = true
    sendApproveMax()
    // Wait for result in $effect block above
  }
</script>

<div class="no-allowance">
  {#if busy}
    <div class="loading">{strings.approvingAllowance} <SmallSpinner soundOn /></div>
  {:else}
    <div class="button-container">
      <BigButton text={strings.approveAllowance} disabled={busy} onclick={onClick} />
    </div>
  {/if}
</div>

<style lang="scss">
  .no-allowance {
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
