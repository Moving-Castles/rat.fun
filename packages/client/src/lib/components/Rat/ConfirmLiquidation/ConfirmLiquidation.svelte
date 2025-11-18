<script lang="ts">
  import { rat, ratTotalValue } from "$lib/modules/state/stores"
  import { playSound } from "$lib/modules/sound"
  import { BigButton, ValueBreakdown } from "$lib/components/Shared"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings"

  const onClickConfirm = () => {
    // RAT_BOX_STATE.CONFIRM_LIQUIDATION -> RAT_BOX_STATE.LIQUIDATING_RAT
    ratState.state.transitionTo(RAT_BOX_STATE.LIQUIDATING_RAT)
  }

  const onClickAbort = () => {
    // RAT_BOX_STATE.CONFIRM_LIQUIDATION -> RAT_BOX_STATE.HAS_RAT
    playSound({ category: "ratfunUI", id: "ratRelief" })
    ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="confirm-liquidation">
  <div class="confirm-liquidation-text">
    <h1>
      {UI_STRINGS.confirmLiquidationMessage($rat?.name)}
    </h1>
    <ValueBreakdown
      originalValue={Number($ratTotalValue)}
      originalLabel={UI_STRINGS.ratValue($rat?.name)}
      taxRateKey="taxationLiquidateRat"
    />
  </div>
  <div class="button-container">
    <BigButton text={UI_STRINGS.cancel} onclick={onClickAbort} />
    <BigButton text={UI_STRINGS.confirm} onclick={onClickConfirm} />
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
      color: black;
      background: rgb(243, 45, 0);
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
      @media (max-width: 800px) {
        width: 100%;
      }
    }
  }
</style>
