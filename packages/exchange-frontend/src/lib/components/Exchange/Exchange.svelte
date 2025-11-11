<script lang="ts">
  import { onMount } from "svelte"
  import { publicNetwork } from "$lib/modules/network"
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
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { entryKitSession } from "$lib/modules/entry-kit/stores"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"

  $inspect(exchangeState.state.current)

  // Listen to changes in the entrykit session (for when user connects wallet)
  $effect(() => {
    if ($entryKitSession) {
      if ($entryKitSession?.account?.client && $entryKitSession.userAddress) {
        const wallet = setupWalletNetwork($publicNetwork, $entryKitSession)
        initWalletNetwork(wallet, $entryKitSession.userAddress, WALLET_TYPE.ENTRYKIT)
        checkStateAndTransition()
      }
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
    if ($entryKitSession?.account?.client && $entryKitSession.userAddress) {
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
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    color: white;
  }
</style>
