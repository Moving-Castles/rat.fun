<script lang="ts">
  import { onMount } from "svelte"
  import type { Hex } from "viem"
  import { fakeRatTokenBalance } from "$lib/modules/erc20Listener/stores"
  import { EXCHANGE_STATE, exchangeState } from "$lib/components/Exchange/state.svelte"
  import { ConnectWalletForm } from "$lib/components/Exchange"
  import { ExchangeFlow } from "$lib/components/Exchange/ExchangeFlow"
  import NoTokens from "$lib/components/Exchange/NoTokens/NoTokens.svelte"
  import { userAddress } from "$lib/modules/drawbridge"
  import { initTokenListener } from "$lib/modules/erc20Listener"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"

  /**
   * Check if user has FakeRAT tokens
   */
  function hasTokens(): boolean {
    return $fakeRatTokenBalance > 0
  }

  /**
   * Handle wallet connected - check balance and transition
   */
  async function handleWalletConnected(address: Hex) {
    console.log("[Exchange] Wallet connected:", address)

    // Initialize token listener
    initTokenListener()

    // Wait for balance to load
    const startTime = Date.now()
    while (Date.now() < startTime + 1000) {
      if ($fakeRatTokenBalance > 0) {
        break
      }
      await new Promise(resolve => setTimeout(resolve, 50))
    }

    // Transition based on balance
    if (hasTokens()) {
      exchangeState.state.transitionTo(EXCHANGE_STATE.EXCHANGE)
    } else {
      exchangeState.state.transitionTo(EXCHANGE_STATE.NO_TOKENS)
    }
  }

  // Watch for wallet connection changes
  $effect(() => {
    if ($userAddress && exchangeState.state.current === EXCHANGE_STATE.CONNECT_WALLET) {
      handleWalletConnected($userAddress as Hex)
    }
  })

  onMount(async () => {
    // Reset state
    exchangeState.state.reset()

    // Check if wallet is already connected
    if ($userAddress) {
      await handleWalletConnected($userAddress as Hex)
    } else {
      exchangeState.state.transitionTo(EXCHANGE_STATE.CONNECT_WALLET)
    }
  })
</script>

<WalletInfo />

<div class="exchange-container">
  <div class="exchange-inner">
    {#if exchangeState.state.current === EXCHANGE_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if exchangeState.state.current === EXCHANGE_STATE.EXCHANGE}
      <ExchangeFlow />
    {:else if exchangeState.state.current === EXCHANGE_STATE.NO_TOKENS}
      <NoTokens />
    {/if}
  </div>
</div>

<style lang="scss">
  .exchange-container {
    width: 100dvw;
    height: 100dvh;
    z-index: 1000;
    color: white;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;

    .exchange-inner {
      width: 800px;
      max-width: 90dvw;
      height: auto;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
