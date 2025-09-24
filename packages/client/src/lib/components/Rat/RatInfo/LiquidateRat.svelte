<script lang="ts">
  import { DangerButton } from "$lib/components/Shared"
  import { ratTotalValue } from "$lib/modules/state/stores"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  const onClick = async () => {
    // RAT_BOX_STATE.HAS_RAT -> RAT_BOX_STATE.CONFIRM_LIQUIDATION
    transitionTo(RAT_BOX_STATE.CONFIRM_LIQUIDATION)
  }
</script>

<div class="liquidate-rat">
  <div class="total-value">
    <!-- <div class="label">Total Value</div> -->
    <div class="value">
      <div>${$ratTotalValue}</div>
    </div>
  </div>
  <div class="action">
    <DangerButton
      text="Liquidate Rat"
      tippyText="Liquidate rat to get the value added to your wallet"
      onclick={onClick}
    />
  </div>
</div>

<style lang="scss">
  .liquidate-rat {
    height: 100%;
    display: flex;
    background-image: url("/images/texture-5.png");
    .total-value {
      width: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      color: white;
      display: flex;
      flex-direction: column;

      .value {
        padding: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
        font-size: 3vw;
        color: rgba(255, 255, 255, 0.7);
        font-weight: 900;
      }
    }

    .action {
      width: 50%;
      padding: 5px;
    }
  }
</style>
