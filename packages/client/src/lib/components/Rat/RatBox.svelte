<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import {
    playerHasTokens,
    tokenAllowanceApproved,
    playerHasLiveRat
  } from "$lib/modules/state/stores"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import {
    RatInfo,
    RatDeploy,
    DeployingRat,
    ConfirmLiquidation,
    ConfirmExtractNFT,
    ImportNFTs,
    LiquidatingRat,
    NoTokens,
    NoAllowance,
    PastTripList
  } from "$lib/components/Rat"
  import { RAT_BOX_STATE, ratState } from "$lib/components/Rat/state.svelte"
  import { playerERC20Balance } from "$lib/modules/erc20Listener/stores"
  import { TutorialPopup } from "$lib/modules/ui/tutorial-messages"

  onMount(async () => {
    shaderManager.setShader("clouds", true)

    if ($playerERC20Balance === 0) {
      // Wait for erc20 balance to be updated
      const startTime = Date.now()
      while (Date.now() < startTime + 1000) {
        if ($playerERC20Balance > 0) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }
    }

    // Set to INIT
    ratState.state.reset()

    /*
     *  Possible entry scenarios based on:
     *  - $playerHasTokens
     *  - $tokenAllowanceApproved
     *  - $playerHasLiveRat
     *
     *  +---+-----------------+------------------------+------------------+
     *  |   | playerHasTokens | tokenAllowanceApproved | playerHasLiveRat |
     *  +---+-----------------+------------------------+------------------+
     *  | 0 |      false      |         false          |      false       |
     *  | 1 |      false      |         false          |      true        |
     *  | 2 |      false      |         true           |      false       |
     *  | 3 |      false      |         true           |      true        |
     *  | 4 |      true       |         false          |      false       |
     *  | 5 |      true       |         false          |      true        |
     *  | 6 |      true       |         true           |      false       |
     *  | 7 |      true       |         true           |      true        |
     *  +---+-----------------+------------------------+------------------+
     *
     *  State:
     *  0 => NO_TOKENS
     *  1 => NO_ALLOWANCE
     *  2 => NO_TOKENS
     *  3 => HAS_RAT
     *  4 => NO_ALLOWANCE
     *  5 => NO_ALLOWANCE
     *  6 => NO_RAT
     *  7 => HAS_RAT
     */

    // Scenario 1 & 5: Has rat but no allowance
    if ($playerHasLiveRat === true && $tokenAllowanceApproved === false) {
      ratState.state.transitionTo(RAT_BOX_STATE.NO_ALLOWANCE)
    }
    // Scenario 3 & 7: Has rat and has allowance
    else if ($playerHasLiveRat === true && $tokenAllowanceApproved === true) {
      ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
    }
    // Scenario 0 & 2: No rat and no tokens
    else if ($playerHasLiveRat === false && $playerHasTokens === false) {
      ratState.state.transitionTo(RAT_BOX_STATE.NO_TOKENS)
    }
    // Scenario 4: No rat, has tokens, no allowance
    else if (
      $playerHasLiveRat === false &&
      $playerHasTokens === true &&
      $tokenAllowanceApproved === false
    ) {
      ratState.state.transitionTo(RAT_BOX_STATE.NO_ALLOWANCE)
    }
    // Scenario 6: No rat, has tokens, has allowance
    else if (
      $playerHasLiveRat === false &&
      $playerHasTokens === true &&
      $tokenAllowanceApproved === true
    ) {
      ratState.state.transitionTo(RAT_BOX_STATE.NO_RAT)
    }
  })
</script>

<div class="rat-box">
  {#if ratState.state.current === RAT_BOX_STATE.NO_RAT}
    <RatDeploy />
  {:else if ratState.state.current === RAT_BOX_STATE.DEPLOYING_RAT}
    <DeployingRat />
  {:else if ratState.state.current === RAT_BOX_STATE.HAS_RAT}
    <RatInfo />
  {:else if ratState.state.current === RAT_BOX_STATE.CONFIRM_LIQUIDATION}
    <ConfirmLiquidation />
  {:else if ratState.state.current === RAT_BOX_STATE.LIQUIDATING_RAT}
    <LiquidatingRat />
  {:else if ratState.state.current === RAT_BOX_STATE.CONFIRM_EXPORT_NFT}
    <ConfirmExtractNFT />
  {:else if ratState.state.current === RAT_BOX_STATE.IMPORTING_OBJECTS_FROM_NFT}
    <ImportNFTs />
  {:else if ratState.state.current === RAT_BOX_STATE.NO_TOKENS}
    <NoTokens />
  {:else if ratState.state.current === RAT_BOX_STATE.NO_ALLOWANCE}
    <NoAllowance />
  {:else if ratState.state.current === RAT_BOX_STATE.PAST_TRIP_LIST}
    <PastTripList />
  {/if}
</div>

<!-- Tutorial system -->
<TutorialPopup />

<style lang="scss">
  .rat-box {
    display: flex;
    height: var(--game-window-main-height);
    width: 100%;
    max-width: 100%;
    position: relative;
    z-index: var(--z-top);
    overflow: visible;

    @media (max-width: 800px) {
      width: 100%;
      flex: 1;
      height: auto;
    }
  }
</style>
