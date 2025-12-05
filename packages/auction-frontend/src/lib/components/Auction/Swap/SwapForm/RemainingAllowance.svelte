<script lang="ts">
  import { formatUnits } from "viem"
  import { swapState } from "../state.svelte"
  import { wethCurrency } from "$lib/modules/swap-router"

  /**
   * Check if the selected currency is ETH
   */
  function isEthSelected(): boolean {
    return swapState.data.fromCurrency.address.toLowerCase() === wethCurrency.address.toLowerCase()
  }

  /**
   * Get the remaining allowance in EURC
   */
  function getRemainingAllowanceEurc(): number | undefined {
    const spent = swapState.data.spentAmount
    const auctionParams = swapState.data.auctionParams

    if (spent === undefined || !auctionParams) return undefined

    const spendLimitRaw = auctionParams.spendLimitAmount
    const decimals = auctionParams.numeraire.decimals

    // Check if spendLimitAmount has decimals embedded or is human-readable
    // If it's a large number (> 1000000), it likely has decimals embedded
    const limitNumber = Number(spendLimitRaw)
    const hasEmbeddedDecimals = limitNumber > 1000000

    const limitEurc = hasEmbeddedDecimals
      ? Number(formatUnits(BigInt(spendLimitRaw), decimals))
      : limitNumber
    const spentEurc = Number(formatUnits(spent, decimals))

    return limitEurc - spentEurc
  }

  /**
   * Get the total allowance in EURC
   */
  function getTotalAllowanceEurc(): number | undefined {
    const auctionParams = swapState.data.auctionParams

    if (!auctionParams) return undefined

    const spendLimitRaw = auctionParams.spendLimitAmount
    const decimals = auctionParams.numeraire.decimals
    const limitNumber = Number(spendLimitRaw)
    const hasEmbeddedDecimals = limitNumber > 1000000

    return hasEmbeddedDecimals ? Number(formatUnits(BigInt(spendLimitRaw), decimals)) : limitNumber
  }

  /**
   * Get the conversion rate for the selected currency
   */
  function getRate(): number | undefined {
    return isEthSelected() ? swapState.data.eurcToEthRate : swapState.data.eurcToUsdcRate
  }

  /**
   * Get the remaining allowance in the selected currency
   */
  function getRemainingAllowance(): number | undefined {
    const remainingEurc = getRemainingAllowanceEurc()
    const rate = getRate()
    if (remainingEurc === undefined || rate === undefined) return undefined
    return remainingEurc * rate
  }

  /**
   * Get the total allowance in the selected currency
   */
  function getTotalAllowance(): number | undefined {
    const totalEurc = getTotalAllowanceEurc()
    const rate = getRate()
    if (totalEurc === undefined || rate === undefined) return undefined
    return totalEurc * rate
  }

  /**
   * Format the value based on the selected currency
   */
  function formatValue(value: number | undefined): string {
    if (value === undefined) return "..."
    // ETH typically needs more decimal places
    return isEthSelected() ? value.toFixed(6) : value.toFixed(2)
  }

  const remaining = $derived(getRemainingAllowance())
  const total = $derived(getTotalAllowance())
  const currencySymbol = $derived(isEthSelected() ? "ETH" : "USDC")
  const currencyPrefix = $derived(isEthSelected() ? "" : "$")
</script>

{#if swapState.data.auctionParams}
  <div class="remaining-allowance">
    <span class="label">Remaining Allowance ({currencySymbol})</span>
    <span class="amount">
      {currencyPrefix}{formatValue(remaining)}
    </span>
    <span class="total">
      of {currencyPrefix}{formatValue(total)} total
    </span>
  </div>
{/if}

<style lang="scss">
  .remaining-allowance {
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .label {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.6);
  }

  .amount {
    font-size: 24px;
    color: white;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .total {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
