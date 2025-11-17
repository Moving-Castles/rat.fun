<script lang="ts">
  import { onMount } from "svelte"
  import {
    playerFakeTokenBalance,
    playerFakeTokenAllowance
  } from "$lib/modules/erc20Listener/stores"
  import { EXCHANGE_STATE, exchangeState } from "$lib/components/Exchange/state.svelte"
  import {
    ConnectWalletForm,
    NoTokens,
    Approve,
    ExchangeForm,
    Done
  } from "$lib/components/Exchange"
  import { userAddress } from "$lib/modules/entry-kit"
  import { playerAddress } from "$lib/modules/state/stores"
  import { initErc20Listener } from "$lib/modules/erc20Listener"
  import { initFakeTokenListener } from "$lib/modules/erc20Listener/fakeToken"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"

  // Listen to changes in wallet connection (for when user connects wallet)
  $effect(() => {
    if ($userAddress) {
      console.log("[Exchange] Wallet connected:", $userAddress)
      // Set player address and initialize token listeners
      playerAddress.set($userAddress)
      initErc20Listener()
      initFakeTokenListener()
      checkStateAndTransition()
    }
  })

  function checkStateAndTransition() {
    // Wait for stores to update from polling
    setTimeout(() => {
      if ($playerFakeTokenBalance === 0) {
        exchangeState.state.transitionTo(EXCHANGE_STATE.NO_TOKENS)
      } else if ($playerFakeTokenAllowance === 0) {
        exchangeState.state.transitionTo(EXCHANGE_STATE.APPROVE)
      } else {
        exchangeState.state.transitionTo(EXCHANGE_STATE.EXCHANGE)
      }
    }, 500)
  }

  onMount(async () => {
    // Reset state to INIT
    exchangeState.state.reset()

    // If wallet is already connected (from previous session), wait for balance to load
    if ($userAddress) {
      console.log("[Exchange] Wallet already connected on mount:", $userAddress)

      // Set player address and initialize token listeners
      playerAddress.set($userAddress)
      initErc20Listener()
      initFakeTokenListener()

      // Wait for fake token balance to be updated
      const startTime = Date.now()
      while (Date.now() < startTime + 1000) {
        if ($playerFakeTokenBalance > 0) {
          break
        }
        await new Promise(resolve => setTimeout(resolve, 50))
      }

      // Determine initial state based on balance and allowance
      if ($playerFakeTokenBalance === 0) {
        exchangeState.state.transitionTo(EXCHANGE_STATE.NO_TOKENS)
      } else if ($playerFakeTokenAllowance === 0) {
        exchangeState.state.transitionTo(EXCHANGE_STATE.APPROVE)
      } else {
        exchangeState.state.transitionTo(EXCHANGE_STATE.EXCHANGE)
      }
    } else {
      // No wallet connected, show connect wallet screen
      exchangeState.state.transitionTo(EXCHANGE_STATE.CONNECT_WALLET)
    }
  })
</script>

<WalletInfo />

<div class="exchange-container">
  <div class="exchange-inner">
    {#if exchangeState.state.current === EXCHANGE_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if exchangeState.state.current === EXCHANGE_STATE.APPROVE}
      <Approve />
    {:else if exchangeState.state.current === EXCHANGE_STATE.EXCHANGE}
      <ExchangeForm />
    {:else if exchangeState.state.current === EXCHANGE_STATE.DONE}
      <Done />
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
  }
</style>
