<script lang="ts">
  import { DangerButton } from "$lib/components/Shared"
  import { ratTotalValue } from "$lib/modules/state/stores"
  import { transitionTo, RAT_BOX_STATE } from "../RatBox/state.svelte"

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
  <div class="total-value">
    <div>${$ratTotalValue}</div>
  </div>
</div>

<style lang="scss">
  .liquidate-rat {
    height: 100%;
    display: flex;
    background-image: url("/images/texture-5.png");
    padding: 5px;
    .total-value {
      width: 50%;
      padding: 5px;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: var(--font-size-extra-large);
      color: black;
    }

    .action {
      width: 50%;
    }
  }
</style>
