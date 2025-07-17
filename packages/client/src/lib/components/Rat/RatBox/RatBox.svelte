<script lang="ts">
  import { onMount } from "svelte"
  import { rat } from "$lib/modules/state/base/stores"

  import RatInfo from "$lib/components/Rat/RatBox/RatInfo/RatInfo.svelte"
  import DeployRat from "$lib/components/Rat/RatBox/RatDeploy/RatDeploy.svelte"
  import DeployingRat from "$lib/components/Rat/RatBox/DeployingRat/DeployingRat.svelte"
  import RatDead from "$lib/components/Rat/RatBox/RatDead/RatDead.svelte"
  import ConfirmLiquidation from "$lib/components/Rat/RatBox/ConfirmLiquidation/ConfirmLiquidation.svelte"
  import LiquidatingRat from "$lib/components/Rat/RatBox/LiquidatingRat/LiquidatingRat.svelte"

  import { ratBoxState, RAT_BOX_STATE, transitionTo, resetRatBoxState } from "./state.svelte"

  onMount(() => {
    // Set state to RAT_BOX_STATE.INIT
    resetRatBoxState()
    if ($rat) {
      if ($rat.dead) {
        transitionTo(RAT_BOX_STATE.DEAD_RAT)
      } else {
        transitionTo(RAT_BOX_STATE.HAS_RAT)
      }
    } else {
      transitionTo(RAT_BOX_STATE.NO_RAT)
    }
  })
</script>

<div class="rat-box">
  {#if ratBoxState.state === RAT_BOX_STATE.NO_RAT}
    <DeployRat />
  {:else if ratBoxState.state === RAT_BOX_STATE.DEPLOYING_RAT}
    <DeployingRat />
  {:else if ratBoxState.state === RAT_BOX_STATE.HAS_RAT}
    <RatInfo />
  {:else if ratBoxState.state === RAT_BOX_STATE.DEAD_RAT}
    <RatDead />
  {:else if ratBoxState.state === RAT_BOX_STATE.CONFIRM_LIQUIDATION}
    <ConfirmLiquidation />
  {:else if ratBoxState.state === RAT_BOX_STATE.LIQUIDATING_RAT}
    <LiquidatingRat />
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
