<script lang="ts">
  import { gamePercentagesConfig } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  let {
    originalValue,
    originalLabel
  }: {
    originalValue: number
    originalLabel: string
  } = $props()

  // Calculate tax and payout amounts for rat liquidation
  const taxAmount = Math.floor((originalValue * $gamePercentagesConfig.taxationLiquidateRat) / 100)
  const payoutAmount = Math.floor(
    (originalValue * (100 - $gamePercentagesConfig.taxationLiquidateRat)) / 100
  )
</script>

<div class="value-breakdown">
  <div class="value-line">
    {UI_STRINGS.traumwertSteuerExplanation(Number($gamePercentagesConfig.taxationLiquidateRat))}:
    <span class="value negative">-{taxAmount} {CURRENCY_SYMBOL}</span>
  </div>
  <div class="value-line">
    Payout: <span class="value payout">{payoutAmount} {CURRENCY_SYMBOL}</span>
  </div>
</div>

<style lang="scss">
  .value-breakdown {
    margin-top: 20px;
    text-align: left;
    font-size: var(--font-size-normal);
    background: rgba(0, 0, 0, 0.8);
    padding: 15px;
    color: var(--foreground);
  }

  .value-line {
    margin: 8px 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .value {
    background: var(--color-value);
    color: var(--black);
    padding: 3px 8px;
    border-radius: 3px;
    font-weight: bold;

    &.negative {
      background: var(--color-death);
      color: var(--background);
    }

    &.payout {
      background: var(--color-success);
      color: var(--black);
    }
  }
</style>
