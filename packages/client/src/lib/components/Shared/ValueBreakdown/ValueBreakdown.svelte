<script lang="ts">
  import { gameConfig } from "$lib/modules/state/stores"

  let {
    originalValue,
    originalLabel = "Value",
    taxRateKey,
    taxLabel = "TraumwertSteuer",
    payoutLabel = "Payout"
  }: {
    originalValue: number
    originalLabel?: string
    taxRateKey: "taxationLiquidateRat" | "taxationCloseRoom"
    taxLabel?: string
    payoutLabel?: string
  } = $props()

  // Calculate tax and payout amounts
  const taxAmount = Math.floor((originalValue * $gameConfig[taxRateKey]) / 100)
  const payoutAmount = Math.floor((originalValue * (100 - $gameConfig[taxRateKey])) / 100)
</script>

<div class="value-breakdown">
  <div class="value-line">
    {originalLabel}: <span class="value">{originalValue} SLOPAMINE</span>
  </div>
  <div class="value-line">
    {taxLabel} ({$gameConfig[taxRateKey]}%):
    <span class="value negative">-{taxAmount} SLOPAMINE</span>
  </div>
  <div class="value-line">
    {payoutLabel}: <span class="value payout">{payoutAmount} SLOPAMINE</span>
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
