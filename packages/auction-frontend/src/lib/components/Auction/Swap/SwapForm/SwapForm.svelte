<script lang="ts">
  import { formatUnits, parseUnits, type Hex } from "viem"
  import { swapState } from "../state.svelte"
  import RemainingAllowance from "./RemainingAllowance.svelte"
  import { quoteExactIn, availableCurrencies, decodeQuoterError } from "$lib/modules/swap-router"
  import { tokenBalances } from "$lib/modules/balances"

  /**
   * Get balance for a currency address
   */
  function getCurrencyBalance(address: Hex): number | undefined {
    return $tokenBalances[address]?.formatted
  }

  /**
   * Check if a currency has zero balance
   */
  function hasZeroBalance(address: Hex): boolean {
    const balance = getCurrencyBalance(address)
    return balance === undefined || balance === 0
  }

  /**
   * Get the balance of the currently selected currency
   */
  function getSelectedCurrencyBalance(): number | undefined {
    const fromCurrency = swapState.data.fromCurrency
    if (!fromCurrency) return undefined
    return getCurrencyBalance(fromCurrency.address)
  }

  /**
   * Check if the current input amount exceeds the user's balance
   */
  function isAmountExceedsBalance(): boolean {
    const balance = getSelectedCurrencyBalance()
    const amountIn = getAmountIn()
    if (balance === undefined || amountIn === undefined) return false
    return amountIn > balance
  }

  /**
   * Set amount to max balance
   */
  function setMaxAmount() {
    const balance = getSelectedCurrencyBalance()
    if (balance !== undefined && balance > 0) {
      setAmountIn(balance)
    }
  }

  /**
   * Handle currency change from dropdown
   */
  function handleCurrencyChange(event: Event) {
    const select = event.target as HTMLSelectElement
    const selected = availableCurrencies.find(c => c.address === select.value)
    if (selected) {
      swapState.data.setFromCurrency(selected)
      // Clear amounts when currency changes
      swapState.data.setAmountIn(undefined)
      swapState.data.setAmountOut(undefined)
      swapState.data.clearPermit()
    }
  }

  /**
   * Get numeraire amount formatted for display in input field
   */
  function getAmountIn() {
    const amountIn = swapState.data.amountIn
    if (amountIn === 0n) return 0
    const auctionParams = swapState.data.auctionParams
    if (!amountIn || !auctionParams) return undefined
    return Number(formatUnits(amountIn, swapState.data.fromCurrency.decimals))
  }

  /**
   * Set numeraire amount and quote token amount (exact input swap)
   * Clears any existing permits since amounts changed
   */
  function setAmountIn(value: number | undefined) {
    const auctionParams = swapState.data.auctionParams
    if (!auctionParams) return

    // Mark as exact input mode
    swapState.data.setIsExactOut(false)
    // Clear permits when amounts change
    swapState.data.clearPermit()

    const fromCurrency = swapState.data.fromCurrency
    if (value === undefined || value === null || !fromCurrency) {
      swapState.data.setAmountIn(undefined)
      swapState.data.setAmountOut(undefined)
    } else if (value === 0) {
      swapState.data.setAmountIn(0n)
      swapState.data.setAmountOut(undefined)
    } else {
      // Parse display value to bigint with proper decimals
      const amountIn = parseUnits(value.toString(), fromCurrency.decimals)
      swapState.data.setAmountIn(amountIn)
      // Quote the expected output amount
      quoteExactIn(fromCurrency.address, auctionParams, amountIn)
        .then(result => {
          swapState.data.setAmountOut(result.amountOutFinal)
        })
        .catch(error => {
          console.error("[SwapForm] Quote failed:", decodeQuoterError(error))
          swapState.data.setAmountOut(undefined)
        })
    }
  }

  /**
   * Get token amount formatted for display in input field
   */
  function getAmountOut() {
    const amountOut = swapState.data.amountOut
    if (amountOut === 0n) return 0
    const auctionParams = swapState.data.auctionParams
    if (!amountOut || !auctionParams) return undefined
    return Number(formatUnits(amountOut, auctionParams.token.decimals))
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
   * Handle amount in input change
   */
  function handleAmountInInput(event: Event) {
    const input = event.target as HTMLInputElement
    const value = parseFloat(input.value)
    setAmountIn(isNaN(value) ? undefined : value)
  }
</script>

<div class="swap-form">
  <!-- Remaining allowance section -->
  <RemainingAllowance />

  <!-- Current price display -->
  {#if swapState.data.currentPriceUsdc !== undefined}
    <div class="current-price">
      Current Price: <span class="price">{swapState.data.currentPriceUsdc.toFixed(4)}</span> USDC per
      $RAT
    </div>
  {/if}

  {#if swapState.data.auctionParams}
    <!-- Input fields section -->
    <div class="inputs-section">
      <div class="input-group">
        <label for="currency-select">Pay with:</label>
        <select
          id="currency-select"
          value={swapState.data.fromCurrency.address}
          onchange={handleCurrencyChange}
        >
          {#each availableCurrencies as currency}
            <option
              value={currency.address}
              disabled={hasZeroBalance(currency.address)}
              class:disabled={hasZeroBalance(currency.address)}
            >
              {currency.symbol}{hasZeroBalance(currency.address) ? " (no balance)" : ""}
            </option>
          {/each}
        </select>
      </div>
      <div class="input-group">
        <label for="numeraire-input">{swapState.data.fromCurrency.symbol ?? "Amount"}:</label>
        <input
          id="numeraire-input"
          type="text"
          inputmode="decimal"
          placeholder="0.0"
          class:error={isAmountExceedsBalance()}
          value={getAmountIn() ?? ""}
          oninput={handleAmountInInput}
        />
        <div class="balance-row">
          <span class="balance-row-left">
            <span class="balance-text" class:error={isAmountExceedsBalance()}>
              Balance: {getSelectedCurrencyBalance()?.toLocaleString(undefined, {
                maximumFractionDigits: 6
              }) ?? "..."}
              {swapState.data.fromCurrency.symbol}
            </span>
            {#if isAmountExceedsBalance()}
              <span class="error-text">· Insufficient</span>
            {/if}
          </span>
          {#if getSelectedCurrencyBalance() !== undefined && getSelectedCurrencyBalance()! > 0}
            <button class="max-button" type="button" onclick={setMaxAmount}>MAX</button>
          {/if}
        </div>
      </div>
      <div class="input-group">
        <label for="token-input">$RAT:</label>
        <input id="token-input" type="text" readonly placeholder="0" value={getAmountOut() ?? ""} />
        <span class="subtext">minimum guaranteed</span>
      </div>
      <div class="rat-subjects-label">
        ≈ <strong>{getInGameRats() ?? 0}</strong> Rat Subjects
      </div>
    </div>
  {/if}
</div>

<style lang="scss">
  .swap-form {
    display: flex;
    flex-flow: column nowrap;
    gap: 20px;
    padding: 0;
    min-width: 400px;
    margin-bottom: 20px;
    width: 100%;
  }

  .current-price {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
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

    select,
    input {
      padding: 12px 16px;
      font-size: 16px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      outline: none;
      transition: all 0.2s;

      &:focus {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(0, 0, 0, 0.4);
      }
    }

    select {
      cursor: pointer;
      font-family: var(--typewriter-font-stack);
      padding: 10px 6px;

      option {
        background: #1a1a1a;
        color: white;

        &:disabled,
        &.disabled {
          color: rgba(255, 255, 255, 0.3);
          cursor: not-allowed;
        }
      }
    }

    input {
      &::placeholder {
        color: rgba(255, 255, 255, 0.3);
      }

      &.error {
        border-color: #ff4444;
        background: rgba(255, 68, 68, 0.1);
      }
    }

    .balance-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
    }

    .balance-text {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.6);

      &.error {
        color: #ff4444;
      }
    }

    .balance-row-left {
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .max-button {
      background: rgba(255, 255, 255, 0.1);
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.8);
      font-size: 11px;
      padding: 2px 8px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.2);
        color: white;
      }
    }

    .error-text {
      font-size: 12px;
      color: #ff4444;
    }

    .subtext {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }
  }

  .rat-subjects-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    padding: 8px 0;

    strong {
      color: white;
    }
  }
</style>
