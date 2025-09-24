<script lang="ts">
  import { rat, ratTotalValue } from "$lib/modules/state/stores"
  import { BigButton, ValueBreakdown } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  const onClickConfirm = () => {
    // RAT_BOX_STATE.CONFIRM_LIQUIDATION -> RAT_BOX_STATE.LIQUIDATING_RAT
    transitionTo(RAT_BOX_STATE.LIQUIDATING_RAT)
  }

  const onClickAbort = () => {
    // RAT_BOX_STATE.CONFIRM_LIQUIDATION -> RAT_BOX_STATE.HAS_RAT
    transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="confirm-liquidation">
  <div class="confirm-liquidation-text">
    <h1>
      Are you sure you want to liquidate {$rat?.name}?
    </h1>
    <ValueBreakdown
      originalValue={Number($ratTotalValue)}
      originalLabel="Rat value"
      taxRateKey="taxationLiquidateRat"
    />
  </div>
  <div class="button-container">
    <BigButton id="abort" text="Abort" onclick={onClickAbort} />
    <BigButton id="liquidate" text="Confirm" onclick={onClickConfirm} />
  </div>
</div>

<style lang="scss">
  .confirm-liquidation {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    position: relative;
    width: 100%;
    text-align: center;
    background-image: url("/images/texture-2.png");
    background-size: 200px;

    .confirm-liquidation-text {
      width: 80%;
      padding-bottom: 10px;
      color: var(--foreground);
    }

    .button-container {
      overflow: hidden;
      width: 80%;
      display: flex;
      justify-content: center;
      align-items: center;
      display: flex;
      flex-direction: row;
      gap: 10px;
      height: 80px;
    }
  }
</style>
