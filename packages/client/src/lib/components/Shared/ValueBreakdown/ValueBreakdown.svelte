<script lang="ts">
  import { gamePercentagesConfig } from "$lib/modules/state/stores"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { strings } from "$lib/modules/strings"

  let {
    originalValue,
    originalLabel = "Value",
    taxRateKey,
    payoutLabel = "Payout"
  }: {
    originalValue: number
    originalLabel?: string
    taxRateKey: "taxationLiquidateRat" | "taxationCloseTrip"
    taxLabel?: string
    payoutLabel?: string
  } = $props()

  // Calculate tax and payout amounts
  const taxAmount = Math.floor((originalValue * $gamePercentagesConfig[taxRateKey]) / 100)
  const payoutAmount = Math.floor(
    (originalValue * (100 - $gamePercentagesConfig[taxRateKey])) / 100
  )
</script>

<div class="value-breakdown">
  <div class="value-line">
    {originalLabel}: <span class="value">{CURRENCY_SYMBOL}{originalValue}</span>
  </div>
  <div class="value-line">
    {strings.traumwertSteuerExplanation(Number($gamePercentagesConfig[taxRateKey]))}:
    <span class="value negative">-{CURRENCY_SYMBOL}{taxAmount}</span>
  </div>
  <div class="value-line">
    {payoutLabel}: <span class="value payout">{CURRENCY_SYMBOL}{payoutAmount}</span>
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
