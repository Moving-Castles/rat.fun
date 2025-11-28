<script lang="ts">
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import {
    tokenAllowanceApproved,
    playerHasTokens,
    playerHasLiveRat
  } from "$lib/modules/state/stores"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { openAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"

  import { BigButton } from "$lib/components/Shared"

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
    openAllowanceModal()
  }
</script>

<div class="no-allowance">
  <p class="description">{UI_STRINGS.manageAllowanceDescription}</p>
  <div class="button-container">
    <BigButton text={UI_STRINGS.manageAllowance} onclick={onClick} />
  </div>
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
    flex-direction: column;
    justify-content: center;
    align-items: center;
    padding: 20px;

    .description {
      font-family: var(--typewriter-font-stack);
      font-size: var(--font-size-large);
      color: var(--foreground);
      line-height: 1.5;
      margin-bottom: 20px;
      background: var(--black-semi-transparent);
    }

    .button-container {
      overflow: hidden;
      width: 100%;
      height: 160px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
