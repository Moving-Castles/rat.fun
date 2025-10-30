<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { rat, playerIsBroke, tokenAllowanceApproved } from "$lib/modules/state/stores"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"
  import { playSound } from "$lib/modules/sound"
  import {
    RatInfo,
    RatDeploy,
    DeployingRat,
    ConfirmLiquidation,
    LiquidatingRat,
    RatDead,
    NoTokens,
    NoAllowance,
    PastTripList
  } from "$lib/components/Rat"
  import { RAT_BOX_STATE, ratState } from "$lib/components/Rat/state.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"

  onMount(() => {
    shaderManager.setShader("clouds", true)
    $backgroundMusic?.stop()
    $backgroundMusic = playSound("ratfunMusic", "main", true)

    if (!$rat) {
      if ($playerIsBroke) {
        ratState.state.transitionTo(RAT_BOX_STATE.NO_TOKENS)
      } else if ($tokenAllowanceApproved === false) {
        ratState.state.transitionTo(RAT_BOX_STATE.NO_ALLOWANCE)
      } else {
        ratState.state.transitionTo(RAT_BOX_STATE.NO_RAT)
      }
    } else {
      if ($rat.dead) {
        ratState.state.transitionTo(RAT_BOX_STATE.NO_RAT)
      } else {
        ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
      }
    }
  })

  onDestroy(() => {
    // Stop background music
    if ($backgroundMusic) {
      $backgroundMusic.stop()
      $backgroundMusic = undefined
    }
  })
</script>

<!-- <div>
  State: {ratState.state.current}
</div>
<div>
  Balance: {ratState.balance.current}: {$rat.balance}
</div>
<div>
  ItemCount: {ratState.inventorySize.current}: {getRatInventory($rat)?.length ?? 0}
</div> -->
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
  {:else if ratState.state.current === RAT_BOX_STATE.DEAD_RAT}
    <RatDead />
  {:else if ratState.state.current === RAT_BOX_STATE.NO_TOKENS}
    <NoTokens />
  {:else if ratState.state.current === RAT_BOX_STATE.NO_ALLOWANCE}
    <NoAllowance />
  {:else if ratState.state.current === RAT_BOX_STATE.PAST_TRIP_LIST}
    <PastTripList />
  {:else}
    error: {ratState.state.current}
  {/if}
</div>

<style lang="scss">
  .rat-box {
    display: flex;
    height: var(--game-window-main-height);
    width: var(--game-column-width);
    position: relative;
    z-index: 100;
    overflow: visible;

    @media (max-width: 700px) {
      width: 100%;
    }
  }
</style>
