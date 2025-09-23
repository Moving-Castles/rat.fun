<script lang="ts">
  import { onMount } from "svelte"
  import { rat, playerIsBroke, tokenAllowanceApproved } from "$lib/modules/state/stores"
  import {
    RatInfo,
    RatDeploy,
    DeployingRat,
    ConfirmLiquidation,
    LiquidatingRat,
    RatDead,
    NoTokens,
    NoAllowance
  } from "$lib/components/Rat"
  import { shaderManager } from "$lib/modules/webgl/shaders/index.svelte"

  import { RAT_BOX_STATE, ratBoxState, transitionTo, resetRatBoxState } from "./state.svelte"

  onMount(() => {
    shaderManager.setShader("clouds")

    // Set state to RAT_BOX_STATE.INIT
    resetRatBoxState()

    if ($rat) {
      if ($rat.dead) {
        transitionTo(RAT_BOX_STATE.NO_RAT)
      } else {
        transitionTo(RAT_BOX_STATE.HAS_RAT)
      }
    } else {
      if ($playerIsBroke) {
        transitionTo(RAT_BOX_STATE.NO_TOKENS)
      } else if ($tokenAllowanceApproved === false) {
        transitionTo(RAT_BOX_STATE.NO_ALLOWANCE)
      } else {
        transitionTo(RAT_BOX_STATE.NO_RAT)
      }
    }
  })
</script>

<div class="rat-box">
  {#if ratBoxState.state === RAT_BOX_STATE.NO_RAT}
    <RatDeploy />
  {:else if ratBoxState.state === RAT_BOX_STATE.DEPLOYING_RAT}
    <DeployingRat />
  {:else if ratBoxState.state === RAT_BOX_STATE.HAS_RAT}
    <RatInfo />
  {:else if ratBoxState.state === RAT_BOX_STATE.CONFIRM_LIQUIDATION}
    <ConfirmLiquidation />
  {:else if ratBoxState.state === RAT_BOX_STATE.LIQUIDATING_RAT}
    <LiquidatingRat />
  {:else if ratBoxState.state === RAT_BOX_STATE.DEAD_RAT}
    <RatDead />
  {:else if ratBoxState.state === RAT_BOX_STATE.NO_TOKENS}
    <NoTokens />
  {:else if ratBoxState.state === RAT_BOX_STATE.NO_ALLOWANCE}
    <NoAllowance />
  {:else if ratBoxState.state === RAT_BOX_STATE.ERROR}
    error
  {/if}
</div>

<style lang="scss">
  .rat-box {
    display: flex;
    height: 100%;
    width: 100%;
    overflow: hidden;
  }
</style>
