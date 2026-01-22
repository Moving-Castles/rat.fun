<script lang="ts">
  import { formatUnits, parseUnits, type Hex } from "viem"
  import { swapState } from "../state.svelte"
  import RemainingAllowance from "./RemainingAllowance.svelte"
  import {
    quoteExactIn,
    availableCurrencies,
    decodeQuoterError,
    calculateFallbackEstimate
  } from "$lib/modules/swap-router"
  import { tokenBalances } from "$lib/modules/balances"

  // Track if we're using estimated (fallback) pricing vs real quote
  let isUsingEstimate = $state(false)

  /**
   * Convert a number to decimal string without scientific notation
   * JavaScript's toString() can produce "1e-7" for small numbers, which viem rejects
   */
  function toDecimalString(value: number, maxDecimals: number): string {
    // Handle edge cases
    if (!Number.isFinite(value)) return "0"

    // Use toFixed to avoid scientific notation, then trim trailing zeros
    const fixed = value.toFixed(maxDecimals)
    // Remove trailing zeros after decimal point, but keep at least one digit after decimal if there is one
    return fixed.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "")
  }

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
   * Get amount in as number for comparisons
   */
  function getAmountInNumber(): number | undefined {
    const amountIn = swapState.data.amountIn
    if (amountIn === undefined) return undefined
    if (amountIn === 0n) return 0
    return Number(formatUnits(amountIn, swapState.data.fromCurrency.decimals))
  }

  /**
   * Check if the current input amount exceeds the user's balance
   */
  function isAmountExceedsBalance(): boolean {
    const balance = getSelectedCurrencyBalance()
    const amountIn = getAmountInNumber()
    if (balance === undefined || amountIn === undefined) return false
    return amountIn > balance
  }

  /**
   * Check if output amount is below minimum (1 $RAT)
   * Also returns true if input is so small it rounds to 0
   */
  function isBelowMinimum(): boolean {
    const amountIn = swapState.data.amountIn
    const amountOut = swapState.data.amountOut
    const auctionParams = swapState.data.auctionParams
    if (!auctionParams) return false

    // If input rounds to 0, it's below minimum (user entered something too small)
    if (amountIn === 0n) return true

    // If no output yet, not below minimum
    if (amountOut === undefined) return false

    // If output is 0 or less than 1 $RAT, it's below minimum
    const ratAmount = Number(formatUnits(amountOut, auctionParams.token.decimals))
    return ratAmount < 1
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
   * Returns string to avoid scientific notation for small numbers
   */
  function getAmountInDisplay(): string {
    const amountIn = swapState.data.amountIn
    if (amountIn === 0n) return "0"
    const auctionParams = swapState.data.auctionParams
    if (!amountIn || !auctionParams) return ""
    // Use formatUnits which returns a proper decimal string without scientific notation
    return formatUnits(amountIn, swapState.data.fromCurrency.decimals)
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
      try {
        // Parse display value to bigint with proper decimals
        // Use toDecimalString to avoid scientific notation for small numbers
        const valueStr = toDecimalString(value, fromCurrency.decimals)
        const amountIn = parseUnits(valueStr, fromCurrency.decimals)

        // If the parsed amount is 0 (value was too small), treat as zero
        if (amountIn === 0n) {
          swapState.data.setAmountIn(0n)
          swapState.data.setAmountOut(undefined)
          return
        }

        swapState.data.setAmountIn(amountIn)
        // Quote the expected output amount
        isUsingEstimate = false
        quoteExactIn(fromCurrency.address, auctionParams, amountIn)
          .then(result => {
            swapState.data.setAmountOut(result.amountOutFinal)
            isUsingEstimate = false
          })
          .catch(error => {
            console.error("[SwapForm] Quote failed:", decodeQuoterError(error))

            // Try fallback estimation
            const fallback = calculateFallbackEstimate({
              amountIn,
              fromCurrencyAddress: fromCurrency.address,
              fromCurrencyDecimals: fromCurrency.decimals,
              tokenDecimals: auctionParams.token.decimals,
              currentPriceUsdc: swapState.data.currentPriceUsdc,
              eurcToEthRate: swapState.data.eurcToEthRate,
              eurcToUsdcRate: swapState.data.eurcToUsdcRate
            })

            if (fallback) {
              console.log("[SwapForm] Using fallback estimate:", fallback.amountOut.toString())
              swapState.data.setAmountOut(fallback.amountOut)
              isUsingEstimate = true
            } else {
              console.warn("[SwapForm] Fallback estimation also failed")
              swapState.data.setAmountOut(undefined)
              isUsingEstimate = false
            }
          })
      } catch (error) {
        // Handle invalid decimal number errors gracefully
        console.warn("[SwapForm] Invalid amount:", error)
        swapState.data.setAmountIn(undefined)
        swapState.data.setAmountOut(undefined)
      }
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
   * Accepts both "." and "," as decimal separators for international support
   */
  function handleAmountInInput(event: Event) {
    const input = event.target as HTMLInputElement
    // Replace comma with period for locales that use comma as decimal separator
    const normalizedValue = input.value.replace(",", ".")
    const value = parseFloat(normalizedValue)
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
        <div class="input-with-currency" class:error={isAmountExceedsBalance()}>
          <span class="currency-label">{swapState.data.fromCurrency.symbol}</span>
          <input
            id="numeraire-input"
            type="text"
            inputmode="decimal"
            placeholder="0.0"
            value={getAmountInDisplay()}
            oninput={handleAmountInInput}
          />
          {#if getSelectedCurrencyBalance() !== undefined && getSelectedCurrencyBalance()! > 0}
            <button class="max-button" type="button" onclick={setMaxAmount}>MAX</button>
          {/if}
        </div>
        <div class="balance-row">
          <span class="balance-text" class:error={isAmountExceedsBalance()}>
            Balance: {getSelectedCurrencyBalance()?.toLocaleString(undefined, {
              maximumFractionDigits: 6
            }) ?? "..."}
            {swapState.data.fromCurrency.symbol}
          </span>
          {#if isAmountExceedsBalance()}
            <span class="error-text">· Insufficient</span>
          {/if}
        </div>
      </div>
      <div class="input-group">
        <div
          class="input-with-currency"
          class:error={isBelowMinimum()}
          class:estimate={isUsingEstimate}
        >
          <span class="currency-label">$RAT</span>
          <input
            id="token-input"
            type="text"
            readonly
            placeholder="0"
            value={isUsingEstimate && getAmountOut()
              ? `~${getAmountOut()}`
              : (getAmountOut() ?? "")}
          />
        </div>
        <div class="output-row">
          <span class="error-text" class:visible={isBelowMinimum()}>
            Minimum purchase is 1 $RAT
          </span>
          {#if isUsingEstimate}
            <span class="estimate-warning">estimated - actual may vary</span>
          {:else}
            <span class="subtext">minimum guaranteed</span>
          {/if}
        </div>
        <div class="rat-subjects-label">
          ≈ <strong>{getInGameRats() ?? 0}</strong> Rat Subjects
        </div>
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
    width: 100%;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 5px;
  }

  .current-price {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
  }

  .inputs-section {
    display: flex;
    flex-direction: column;
    gap: 12px;

    @media (max-width: 768px) {
      gap: 8px;
    }
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 5px;
    margin-bottom: 10px;
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
      border-radius: 0;
      background: rgba(255, 255, 255, 0.05);

      &:focus,
      &:hover,
      &:active {
        background: rgba(255, 255, 255, 0.05);
      }

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
    }

    .input-with-currency {
      display: flex;
      align-items: stretch;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid rgba(255, 255, 255, 0.2);
      transition: all 0.2s;

      &:focus-within {
        border-color: rgba(255, 255, 255, 0.4);
        background: rgba(0, 0, 0, 0.4);
      }

      &.error {
        border-color: red;
        background: rgba(255, 68, 68, 0.1);
      }

      &.estimate {
        border-color: orange;
        background: rgba(255, 165, 0, 0.1);
      }

      .currency-label {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 60px;
        flex-shrink: 0;
        font-size: 14px;
        white-space: nowrap;
        background: rgba(255, 255, 255, 0.15);
        color: white;
        border-right: 1px solid rgba(255, 255, 255, 0.2);
      }

      input {
        flex: 1;
        min-width: 0;
        border: none;
        background: transparent;
        padding: 12px 16px 12px 8px;

        &:focus {
          border: none;
          background: transparent;
        }
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
        color: red;
      }
    }

    .max-button {
      display: flex;
      align-items: center;
      flex-shrink: 0;
      background: rgba(255, 255, 255, 0.15);
      border: none;
      border-left: 1px solid rgba(255, 255, 255, 0.2);
      color: white;
      padding: 0 12px;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.25);
      }
    }

    .output-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .error-text {
      font-size: 12px;
      color: red;
      visibility: hidden;

      &.visible {
        visibility: visible;
      }
    }

    .subtext {
      font-size: 12px;
      color: rgba(255, 255, 255, 0.5);
    }

    .estimate-warning {
      font-size: 12px;
      color: orange;
    }
  }

  .rat-subjects-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    padding: 0;

    strong {
      color: white;
    }
  }
</style>
