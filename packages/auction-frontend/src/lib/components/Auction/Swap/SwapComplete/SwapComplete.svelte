<script lang="ts">
  import { formatUnits } from "viem"
  import { swapState, SWAP_STATE } from "../state.svelte"
  import { BigButton } from "$lib/components/Shared"

  /**
   * Extract receipt data from swap logs
   * The Receipt event contains: buyer, countryCode, tokenAmount, numeraireAmount
   */
  function getReceiptData() {
    const receipt = swapState.data.swapReceipt
    const auctionParams = swapState.data.auctionParams

    if (!receipt || !auctionParams) {
      return null
    }

    // Find the Receipt event log
    const receiptLog = receipt.find(log => log.eventName === "Receipt")

    if (!receiptLog || receiptLog.eventName !== "Receipt") {
      return null
    }

    const { buyer, countryCode, tokenAmount, numeraireAmount } = receiptLog.args

    // TODO receipt is always in eurc, decide if spent fromCurrency (usdc/eth) should also be shown
    return {
      buyer,
      countryCode,
      tokenAmount: formatUnits(tokenAmount!, auctionParams.token.decimals),
      numeraireAmount: formatUnits(numeraireAmount!, auctionParams.numeraire.decimals),
      tokenSymbol: auctionParams.token.symbol,
      numeraireSymbol: auctionParams.numeraire.symbol,
      inGameRats: Math.floor(Number(formatUnits(tokenAmount!, auctionParams.token.decimals)) / 100)
    }
  }

  const receiptData = $derived(getReceiptData())

  /**
   * Reset swap state for another swap
   * Clears amounts and permits but keeps user data
   */
  function doAnotherSwap() {
    // Clear swap-specific data
    swapState.data.setAmountIn(undefined)
    swapState.data.setAmountOut(undefined)
    swapState.data.setIsExactOut(false)
    swapState.data.clearPermit()
    swapState.data.setSwapReceipt(null)

    // Go back to ready-to-swap state
    swapState.state.transitionTo(SWAP_STATE.SIGN_AND_SWAP)
  }

  /**
   * Navigate to the game
   */
  function goToGame() {
    window.location.href = "https://rat.fun"
  }
</script>

<div class="swap-complete">
  <div class="success-header">
    <h2>Swap Successful</h2>
  </div>

  {#if receiptData}
    <div class="receipt-details">
      <div class="receipt-row main">
        <span class="label">You received:</span>
        <span class="value">
          {receiptData.tokenAmount}
          {receiptData.tokenSymbol}
        </span>
      </div>

      <div class="receipt-row main">
        <span class="label">In-game Rats:</span>
        <span class="value highlight">{receiptData.inGameRats}</span>
      </div>

      <div class="receipt-row">
        <span class="label">You spent:</span>
        <span class="value">
          {receiptData.numeraireAmount}
          {receiptData.numeraireSymbol}
        </span>
      </div>
    </div>
  {:else}
    <div class="receipt-details">
      <div class="receipt-row">
        <span class="value">Swap completed successfully</span>
      </div>
    </div>
  {/if}

  <div class="actions">
    <BigButton text="Swap Again" onclick={doAnotherSwap} />
    <BigButton text="Play Game" onclick={goToGame} />
  </div>
</div>

<style lang="scss">
  .swap-complete {
    display: flex;
    flex-direction: column;
    gap: 24px;
    padding: 32px;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(0, 255, 0, 0.3);
    min-width: 400px;
    animation: slideIn 0.3s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .success-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    h2 {
      margin: 0;
      font-size: 24px;
      color: white;
      font-weight: normal;
    }
  }

  @keyframes pulse {
    0%,
    100% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
  }

  .receipt-details {
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 20px;
    background: rgba(0, 0, 0, 0.3);
  }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;

    &.main {
      padding: 12px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.1);
      font-size: 16px;

      .value {
        font-size: 18px;
      }
    }

    .label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: white;

      &.highlight {
        color: #0f0;
        font-size: 20px;
        font-weight: 700;
      }
    }
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
  }
</style>
