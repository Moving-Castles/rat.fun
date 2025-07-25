<script lang="ts">
  import { DangerButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "../state.svelte"

  const onClick = async () => {
    // RAT_BOX_STATE.HAS_RAT -> RAT_BOX_STATE.CONFIRM_LIQUIDATION
    transitionTo(RAT_BOX_STATE.CONFIRM_LIQUIDATION)
  }
</script>

<div class="liquidate-rat">
  <div class="action">
    <DangerButton
      text="Liquidate Rat"
      tippyText="Kill rat to get the value added to your wallet"
      onclick={onClick}
    />
  </div>
</div>

<style lang="scss">
  .liquidate-rat {
    height: 100%;
    display: flex;
  }

  .action {
    width: 100%;
  }
</style>
