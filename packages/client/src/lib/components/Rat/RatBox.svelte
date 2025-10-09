<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { rat, playerIsBroke, tokenAllowanceApproved } from "$lib/modules/state/stores"
  import { Howl } from "howler"
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
    PastTripList,
    PastTripEntry
  } from "$lib/components/Rat"
  import {
    RAT_BOX_STATE,
    ratBoxState,
    transitionTo,
    resetRatBoxState
  } from "$lib/components/Rat/state.svelte"
  import { backgroundMusic } from "$lib/modules/sound/stores"

  onMount(() => {
    shaderManager.setShader("clouds", "inverted")
    if ($backgroundMusic?._src !== "/sounds/ratfun/music/main.mp3") {
      $backgroundMusic?.stop()
      $backgroundMusic = undefined
      $backgroundMusic = playSound("ratfunMusic", "main", true)
    }

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

  onDestroy(() => {
    // Stop background music
    if ($backgroundMusic) {
      console.log(5)
      $backgroundMusic.stop()
      $backgroundMusic = undefined
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
  {:else if ratBoxState.state === RAT_BOX_STATE.PAST_TRIP_LIST}
    <PastTripList />
  {:else if ratBoxState.state === RAT_BOX_STATE.PAST_TRIP_ENTRY}
    <PastTripEntry />
  {:else if ratBoxState.state === RAT_BOX_STATE.ERROR}
    error
  {/if}
</div>

<style lang="scss">
  .rat-box {
    display: flex;
    height: var(--game-window-main-height);
    width: 100%;
    overflow: hidden;
  }
</style>
