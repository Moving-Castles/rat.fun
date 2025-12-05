<script lang="ts">
  import { formatUnits } from "viem"
  import { swapState } from "../state.svelte"

  /**
   * Calculate remaining allowance in USDC
   */
  function getRemainingAllowanceUsdc(): number | undefined {
    const spent = swapState.data.spentAmount
    const auctionParams = swapState.data.auctionParams
    const rate = swapState.data.eurcToUsdcRate

    if (spent === undefined || !auctionParams || rate === undefined) return undefined

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
    const remainingEurc = limitEurc - spentEurc

    return remainingEurc * rate
  }

  /**
   * Calculate total allowance in USDC
   */
  function getTotalAllowanceUsdc(): number | undefined {
    const auctionParams = swapState.data.auctionParams
    const rate = swapState.data.eurcToUsdcRate

    if (!auctionParams || rate === undefined) return undefined

    const spendLimitRaw = auctionParams.spendLimitAmount
    const decimals = auctionParams.numeraire.decimals
    const limitNumber = Number(spendLimitRaw)
    const hasEmbeddedDecimals = limitNumber > 1000000

    const limitEurc = hasEmbeddedDecimals
      ? Number(formatUnits(BigInt(spendLimitRaw), decimals))
      : limitNumber

    return limitEurc * rate
  }

  const remainingUsdc = $derived(getRemainingAllowanceUsdc())
  const totalUsdc = $derived(getTotalAllowanceUsdc())
</script>

{#if swapState.data.auctionParams}
  <div class="remaining-allowance">
    <span class="label">Remaining Allowance (USDC)</span>
    <span class="amount">
      ${remainingUsdc !== undefined ? remainingUsdc.toFixed(2) : "..."}
    </span>
    <span class="total">
      of ${totalUsdc !== undefined ? totalUsdc.toFixed(2) : "..."} total
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
    font-weight: 600;
    color: white;
    padding-top: 10px;
    padding-bottom: 10px;
  }

  .total {
    font-size: 12px;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
