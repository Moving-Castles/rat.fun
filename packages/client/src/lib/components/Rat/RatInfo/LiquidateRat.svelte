<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { DangerButton } from "$lib/components/Shared"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { getRatTotalValue } from "$lib/modules/state/utils"

  let { displayRat }: { displayRat: Rat | null } = $props()

  let totalValue = $derived(displayRat ? getRatTotalValue(displayRat) : 0)

  const onClick = async () => {
    // RAT_BOX_STATE.HAS_RAT -> RAT_BOX_STATE.CONFIRM_LIQUIDATION
    transitionTo(RAT_BOX_STATE.CONFIRM_LIQUIDATION)
  }
</script>

<div class="liquidate-rat">
  {#if displayRat}
    <div class="total-value">
      <!-- <div class="label">Total Value</div> -->
      <div class="value">
        <div>{CURRENCY_SYMBOL}{totalValue}</div>
      </div>
    </div>
    <div class="action">
      <DangerButton
        text="Liquidate Rat"
        tippyText="Liquidate rat to get the value added to your wallet"
        onclick={onClick}
      />
    </div>
  {/if}
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
        font-size: 72px;
        color: rgba(255, 255, 255, 0.7);

        @media (max-width: 700px) {
          font-size: 48px;
        }
      }
    }

    .action {
      width: 50%;
      padding: 5px;
    }
  }
</style>
