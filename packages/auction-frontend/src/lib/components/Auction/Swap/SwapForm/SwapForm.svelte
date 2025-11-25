<script lang="ts">
  import { formatUnits, parseUnits } from "viem"
  import { swapState, SWAP_STATE } from "../state.svelte"
  import SpendLimitProgressBar from "./SpendLimitProgressBar.svelte"

  /**
   * Get numeraire amount formatted for display in input field
   */
  function getAmountIn() {
    const amountIn = swapState.data.amountIn
    const auctionParams = swapState.data.auctionParams
    if (!amountIn || !auctionParams) return undefined
    return Number(formatUnits(amountIn, auctionParams.numeraire.decimals))
  }

  /**
   * Set numeraire amount and quote token amount (exact input swap)
   * Clears any existing permits since amounts changed
   */
  function setAmountIn(value: number | undefined) {
    const auctionParams = swapState.data.auctionParams
    const quoter = swapState.data.quoter
    if (!auctionParams || !quoter) return

    // Mark as exact input mode
    swapState.data.setIsExactOut(false)
    // Clear permits when amounts change
    swapState.data.clearPermit()

    if (value === undefined || value === null) {
      swapState.data.setAmountIn(undefined)
      swapState.data.setAmountOut(undefined)
    } else {
      // Parse display value to bigint with proper decimals
      const amountIn = parseUnits(value.toString(), auctionParams.numeraire.decimals)
      swapState.data.setAmountIn(amountIn)
      // Quote the expected output amount
      quoter
        .quoteExactInputV4(amountIn, true)
        .then(result => {
          swapState.data.setAmountOut(result.amountOut)
        })
        .catch(error => {
          console.error("[SwapForm] Quote failed:", error)
          swapState.data.setAmountOut(undefined)
        })
    }
  }

  /**
   * Get token amount formatted for display in input field
   */
  function getAmountOut() {
    const amountOut = swapState.data.amountOut
    const auctionParams = swapState.data.auctionParams
    if (!amountOut || !auctionParams) return undefined
    return Number(formatUnits(amountOut, auctionParams.token.decimals))
  }

  /**
   * Set token amount and quote numeraire amount (exact output swap)
   * Clears any existing permits since amounts changed
   */
  function setAmountOut(value: number | undefined) {
    const auctionParams = swapState.data.auctionParams
    const quoter = swapState.data.quoter
    if (!auctionParams || !quoter) return

    // Mark as exact output mode
    swapState.data.setIsExactOut(true)
    // Clear permits when amounts change
    swapState.data.clearPermit()

    if (value === undefined || value === null) {
      swapState.data.setAmountIn(undefined)
      swapState.data.setAmountOut(undefined)
    } else {
      // Parse display value to bigint with proper decimals
      const amountOut = parseUnits(value.toString(), auctionParams.token.decimals)
      swapState.data.setAmountOut(amountOut)
      // Quote the required input amount
      quoter
        .quoteExactOutputV4(amountOut, true)
        .then(result => {
          swapState.data.setAmountIn(result.amountIn)
        })
        .catch(error => {
          console.error("[SwapForm] Quote failed:", error)
          swapState.data.setAmountIn(undefined)
        })
    }
  }

  /**
   * Get in-game rats from token amount
   * Each in-game rat costs 100 $RAT
   * Floored since you can't have fractional rats
   */
  function getInGameRats() {
    const amountOut = swapState.data.amountOut
    const auctionParams = swapState.data.auctionParams
    if (!amountOut || !auctionParams) return undefined
    const ratAmount = Number(formatUnits(amountOut, auctionParams.token.decimals))
    return Math.floor(ratAmount / 100)
  }

  /**
   * Set in-game rats and calculate $RAT amount needed (exact output swap)
   * Each in-game rat costs 100 $RAT
   */
  function setInGameRats(value: number | undefined) {
    if (value === undefined || value === null) {
      setAmountOut(undefined)
    } else {
      // Convert rats to $RAT amount (multiply by 100)
      const ratAmount = value * 100
      setAmountOut(ratAmount)
    }
  }
</script>

<div class="swap-form">
  <div class="balances-section">
    <div class="balance-item">
      <span class="label">Numeraire balance:</span>
      <span class="value">{swapState.data.numeraireBalance ?? "..."}</span>
    </div>
    <div class="balance-item">
      <span class="label">Token balance:</span>
      <span class="value">{swapState.data.tokenBalance ?? "..."}</span>
    </div>
  </div>

  <!-- Spend limit progress bar -->
  <SpendLimitProgressBar />

  {#if swapState.data.auctionParams}
    <!-- Input fields section -->
    <div class="inputs-section">
      <div class="input-group">
        <label for="numeraire-input">Numeraire:</label>
        <input
          id="numeraire-input"
          type="number"
          step="any"
          placeholder="0.0"
          bind:value={getAmountIn, setAmountIn}
        />
      </div>
      <div class="input-group">
        <label for="token-input">$RAT</label>
        <input
          id="token-input"
          type="number"
          step="any"
          placeholder="0.0"
          bind:value={getAmountOut, setAmountOut}
        />
      </div>
      <div class="input-group">
        <label for="rats-input">In-game Rats (100 $RAT each)</label>
        <input
          id="rats-input"
          type="number"
          step="1"
          min="0"
          placeholder="0"
          bind:value={getInGameRats, setInGameRats}
        />
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .swap-form {
    display: flex;
    flex-flow: column nowrap;
    gap: 20px;
    padding: 24px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    border: 1px solid rgba(255, 255, 255, 0.1);
    min-width: 400px;
    margin-bottom: 20px;
    width: 100%;
  }

  .balances-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px;
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
  }

  .balance-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }

  .value {
    font-size: 14px;
    font-weight: 500;
    color: white;
  }

  .inputs-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;

    label {
      font-size: 14px;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.9);
    }

    input {
      padding: 12px 16px;
      font-size: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      border-radius: 8px;
      color: white;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(0, 0, 0, 0.4);
      }

      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      // Remove spinner arrows
      &::-webkit-outer-spin-button,
      &::-webkit-inner-spin-button {
        -webkit-appearance: none;
        margin: 0;
      }

      &[type="number"] {
        appearance: textfield;
        -moz-appearance: textfield;
      }
    }
  }
</style>
