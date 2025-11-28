<script lang="ts">
  import { rat, ratTotalValue } from "$lib/modules/state/stores"
  import { playSound } from "$lib/modules/sound"
  import { BigButton, RatLiquidationValueBreakdown, TotalValue } from "$lib/components/Shared"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

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
  <div class="confirm-liquidation-content">
    <div class="total-value-container">
      <TotalValue />
    </div>
    <div class="confirm-liquidation-text">
      <RatLiquidationValueBreakdown
        originalValue={Number($ratTotalValue)}
        originalLabel={UI_STRINGS.ratValue($rat?.name)}
      />
    </div>
    <div class="fine-print">
      {UI_STRINGS.confirmLiquidationMessage($rat?.name)}
    </div>
    <div class="button-container">
      <div class="abort-button-container">
        <BigButton text={UI_STRINGS.cancel} type="abort" onclick={onClickAbort} />
      </div>
      <div class="confirm-button-container">
        <BigButton text={UI_STRINGS.confirm} type="confirm" onclick={onClickConfirm} />
      </div>
    </div>
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

    .confirm-liquidation-content {
      width: calc(100% - 40px);

      .confirm-liquidation-text {
        width: 100%;
        padding-bottom: 10px;
        color: black;
      }

      .fine-print {
        width: 100%;
        padding-bottom: 10px;
        padding-top: 10px;
        color: black;
        margin-top: 20px;
        margin-bottom: 20px;
        background: rgba(255, 255, 255, 0.5);
      }

      .button-container {
        overflow: hidden;
        width: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        display: flex;
        flex-direction: row;
        gap: 10px;
        height: 80px;
        @media (max-width: 800px) {
          width: 100%;
          flex-direction: column;
          height: auto;
        }

        .abort-button-container {
          width: 100%;
          height: 100%;

          @media (max-width: 800px) {
            order: 2;
          }
        }

        .confirm-button-container {
          width: 100%;
          height: 100%;

          @media (max-width: 800px) {
            order: 1;
          }
        }
      }
    }
  }
</style>
