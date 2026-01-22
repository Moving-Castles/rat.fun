<script lang="ts">
  import { formatUnits } from "viem"
  import { swapState } from "../state.svelte"
  import { BigButton, SmallButton } from "$lib/components/Shared"
  import { addRatTokenToWallet } from "$lib/modules/drawbridge/connector"

  /**
   * Extract receipt data from swap logs
   * The Receipt event contains: buyer, countryCode, tokenAmount, numeraireAmount
   */
  function getReceiptData() {
    const receipt = swapState.data.swapReceipt
    const auctionParams = swapState.data.auctionParams
    const fromCurrency = swapState.data.fromCurrency
    const amountIn = swapState.data.amountIn

    if (!receipt || !auctionParams) {
      return null
    }

    // Find the Receipt event log
    const receiptLog = receipt.find(log => log.eventName === "Receipt")

    if (!receiptLog || receiptLog.eventName !== "Receipt") {
      return null
    }

    const { buyer, countryCode, tokenAmount } = receiptLog.args

    // Show the amount spent in the actual currency the user used (ETH or USDC)
    const spentAmount = amountIn !== undefined ? formatUnits(amountIn, fromCurrency.decimals) : null

    const tokenAmountRaw = Number(formatUnits(tokenAmount!, auctionParams.token.decimals))

    return {
      buyer,
      countryCode,
      tokenAmount: tokenAmountRaw.toFixed(4),
      spentAmount,
      tokenSymbol: auctionParams.token.symbol,
      spentSymbol: fromCurrency.symbol,
      inGameRats: Math.floor(tokenAmountRaw / 100)
    }
  }

  const receiptData = $derived(getReceiptData())

  const basescanUrl = $derived(
    swapState.data.swapTxHash ? `https://basescan.org/tx/${swapState.data.swapTxHash}` : null
  )

  /**
   * Navigate to the game
   */
  function goToGame() {
    window.open("https://rat.fun", "_blank")
  }

  async function handleAddToken() {
    const auctionParams = swapState.data.auctionParams
    if (!auctionParams) return

    try {
      await addRatTokenToWallet(
        auctionParams.token.address,
        auctionParams.token.symbol,
        auctionParams.token.decimals
      )
    } catch (e) {
      console.error("Failed to add token to wallet:", e)
    }
  }
</script>

<div class="swap-complete">
  <div class="success-header">
    <h2>Success</h2>
  </div>

  {#if receiptData}
    <div class="receipt-details">
      {#if receiptData.spentAmount}
        <div class="receipt-row">
          <span class="label">You spent:</span>
          <span class="value">
            {receiptData.spentAmount}
            {receiptData.spentSymbol}
          </span>
        </div>
      {/if}

      <div class="receipt-row">
        <span class="label">You received:</span>
        <span class="value highlight">
          {receiptData.tokenAmount}
          ${receiptData.tokenSymbol}
        </span>
      </div>

      {#if basescanUrl}
        <a href={basescanUrl} target="_blank" rel="noopener noreferrer" class="tx-link">
          View transaction on Basescan
        </a>
      {/if}
    </div>
  {:else}
    <div class="receipt-details">
      <div class="receipt-row">
        <span class="value">Swap completed successfully</span>
      </div>
    </div>
  {/if}

  <div class="add-token-container">
    <SmallButton text="Add token info to wallet" onclick={handleAddToken} />
  </div>

  <div class="actions">
    <BigButton text="Play Game" onclick={goToGame} />
  </div>
</div>

<style lang="scss">
  .swap-complete {
    display: flex;
    flex-direction: column;
    gap: 24px;
    width: 100%;
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

    .tx-link {
      display: block;
      margin-top: 10px;
      font-size: 14px;
      color: white;
      text-decoration: underline;
      text-align: center;

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .add-token-container {
    display: flex;
    justify-content: center;
    height: 40px;
  }

  .receipt-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;

    .label {
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    .value {
      font-size: 14px;
      font-weight: 500;
      color: white;

      &.highlight {
        color: var(--color-good);
      }
    }
  }

  .actions {
    display: flex;
    gap: 12px;
    margin-top: 8px;
    height: 160px;
  }
</style>
