<script lang="ts">
  import { swapState } from "./state.svelte"
  import { formatUnits } from "viem"
  import { onMount } from "svelte"
  import { publicClient as publicClientStore } from "$lib/network"
  import { dopplerHookAbi } from "@whetstone-research/doppler-sdk"
  import { asPublicClient } from "$lib/utils/clientAdapter"

  let isVisible = $state(false)
  let earlyExitStatus = $state<boolean | null>(null)
  let isCheckingEarlyExit = $state(false)

  function formatBigInt(value: bigint | undefined, decimals: number): string {
    if (value === undefined) return "undefined"
    return formatUnits(value, decimals)
  }

  function toggleDebug() {
    isVisible = !isVisible
  }

  async function checkEarlyExit() {
    const auctionParams = swapState.data.auctionParams
    if (!auctionParams) {
      console.error("[DebugPanel] No auction params available")
      return
    }

    const client = $publicClientStore
    if (!client) {
      console.error("[DebugPanel] No public client available")
      return
    }

    isCheckingEarlyExit = true
    try {
      const result = await asPublicClient(client).readContract({
        address: auctionParams.hookAddress,
        abi: dopplerHookAbi,
        functionName: "earlyExit"
      })
      earlyExitStatus = result
      console.log("[DebugPanel] earlyExit:", result)
    } catch (error) {
      console.error("[DebugPanel] Error checking earlyExit:", error)
      earlyExitStatus = null
    } finally {
      isCheckingEarlyExit = false
    }
  }

  onMount(() => {
    // Toggle debug panel with 'd' key
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === "d" && !e.ctrlKey && !e.metaKey && !e.altKey) {
        // Only toggle if not in an input field
        const target = e.target as HTMLElement
        if (target.tagName !== "INPUT" && target.tagName !== "TEXTAREA") {
          toggleDebug()
        }
      }
    }

    window.addEventListener("keydown", handleKeyPress)
    return () => window.removeEventListener("keydown", handleKeyPress)
  })
</script>

<!-- Toggle button -->
<button
  class="debug-toggle"
  onclick={toggleDebug}
  class:visible={isVisible}
  title="Toggle debug panel (press 'd')"
>
  {isVisible ? "×" : "D"}
</button>

{#if isVisible}
  <div class="debug-panel">
    <div class="debug-header">Swap Debug</div>

    <div class="debug-section">
      <div class="debug-label">State:</div>
      <div class="debug-value state">{swapState.state.current}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Amounts:</div>
      {#if swapState.data.auctionParams}
        <div class="debug-value">
          In: {swapState.data.amountIn
            ? formatBigInt(swapState.data.amountIn, swapState.data.fromCurrency.decimals)
            : "undefined"}
        </div>
        <div class="debug-value">
          Out: {swapState.data.amountOut
            ? formatBigInt(swapState.data.amountOut, swapState.data.auctionParams.token.decimals)
            : "undefined"}
        </div>
      {:else}
        <div class="debug-value">No params loaded</div>
      {/if}
      <div class="debug-value">Exact Out: {swapState.data.isExactOut}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">User Data:</div>
      {#if swapState.data.auctionParams}
        <div class="debug-value">
          Spent: {swapState.data.spentAmount !== undefined
            ? formatBigInt(swapState.data.spentAmount, swapState.data.fromCurrency.decimals)
            : "undefined"}
        </div>
      {/if}
      <div class="debug-value">Country: {swapState.data.savedCountryCode || "none"}</div>
      <div class="debug-value">Currency: {swapState.data.fromCurrency.symbol ?? "unknown"}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Balances:</div>
      <div class="debug-value">Numeraire: {swapState.data.numeraireBalance ?? "undefined"}</div>
      <div class="debug-value">Token: {swapState.data.tokenBalance ?? "undefined"}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Permit:</div>
      <div class="debug-value">Permit: {swapState.data.permit ? "✓" : "✗"}</div>
      <div class="debug-value">Signature: {swapState.data.permitSignature ? "✓" : "✗"}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Initialized:</div>
      <div class="debug-value">Params: {swapState.data.auctionParams ? "✓" : "✗"}</div>
      <div class="debug-value">Quoter: {swapState.data.quoter ? "✓" : "✗"}</div>
    </div>

    <div class="debug-section">
      <div class="debug-label">Pool Status:</div>
      <button class="debug-button" onclick={checkEarlyExit} disabled={isCheckingEarlyExit}>
        {isCheckingEarlyExit ? "Checking..." : "Check earlyExit()"}
      </button>
      <div class="debug-value">
        Early Exit: {earlyExitStatus === null
          ? "not checked"
          : earlyExitStatus
            ? "TRUE (pool empty)"
            : "FALSE (pool active)"}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .debug-toggle {
    position: fixed;
    top: 10px;
    right: 10px;
    width: 32px;
    height: 32px;
    background: var(--background-dark-transparent);
    color: #0f0;
    border: 1px solid #0f0;
    border-radius: 4px;
    font-family: "Courier New", monospace;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    z-index: 10000;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0;

    &:hover {
      background: rgba(0, 255, 0, 0.2);
      transform: scale(1.1);
    }

    &:active {
      transform: scale(0.95);
    }

    &.visible {
      color: #f00;
      border-color: #f00;

      &:hover {
        background: rgba(255, 0, 0, 0.2);
      }
    }
  }

  .debug-panel {
    position: fixed;
    top: 50px;
    right: 10px;
    background: rgba(0, 0, 0, 0.9);
    color: #0f0;
    font-family: "Courier New", monospace;
    font-size: 11px;
    padding: 10px;
    width: 300px;
    border: 1px solid #0f0;
    border-radius: 4px;
    z-index: 9999;
    max-width: 300px;
    box-shadow: 0 4px 12px rgba(0, 255, 0, 0.3);
    animation: slideIn 0.2s ease-out;
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .debug-header {
    font-weight: bold;
    font-size: 13px;
    margin-bottom: 8px;
    padding-bottom: 8px;
    border-bottom: 1px solid #0f0;
    color: #0ff;
  }

  .debug-section {
    margin-bottom: 8px;
    padding-bottom: 6px;
    border-bottom: 1px solid rgba(0, 255, 0, 0.2);

    &:last-child {
      border-bottom: none;
    }
  }

  .debug-label {
    color: #ff0;
    font-weight: bold;
    margin-bottom: 2px;
  }

  .debug-value {
    padding-left: 8px;
    word-break: break-all;
    line-height: 1.4;

    &.state {
      color: #f0f;
      font-weight: bold;
      font-size: 12px;
    }
  }

  .debug-button {
    background: rgba(0, 255, 0, 0.2);
    color: #0f0;
    border: 1px solid #0f0;
    border-radius: 3px;
    padding: 4px 8px;
    font-family: "Courier New", monospace;
    font-size: 10px;
    cursor: pointer;
    margin: 4px 0;
    transition: all 0.2s;
    width: 100%;

    &:hover:not(:disabled) {
      background: rgba(0, 255, 0, 0.3);
      transform: scale(1.02);
    }

    &:active:not(:disabled) {
      transform: scale(0.98);
    }

    &:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  }
</style>
