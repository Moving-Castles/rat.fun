<script lang="ts">
  import { onMount } from "svelte"
  import { publicNetwork } from "$lib/modules/network"
  import { CLAIM_STATE, claimState } from "$lib/components/Claim/state.svelte"
  import { ConnectWalletForm, Done } from "$lib/components/Claim"
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { entryKitSession } from "$lib/modules/entry-kit/stores"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"

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
    claimState.state.transitionTo(CLAIM_STATE.DONE)
    // Wait for stores to update from polling
    // setTimeout(() => {
    //   if ($playerFakeTokenBalance === 0) {
    //     claimState.state.transitionTo(CLAIM_STATE.NO_TOKENS)
    //   } else if ($playerFakeTokenAllowance === 0) {
    //     claimState.state.transitionTo(CLAIM_STATE.APPROVE)
    //   } else {
    //     claimState.state.transitionTo(CLAIM_STATE.EXCHANGE)
    //   }
    // }, 500)
  }

  onMount(async () => {
    // Reset state to INIT
    claimState.state.reset()

    claimState.state.transitionTo(CLAIM_STATE.CONNECT_WALLET)

    // // If wallet is already connected (from previous session), wait for balance to load
    // if ($entryKitSession?.account?.client && $entryKitSession.userAddress) {
    //   // Wait for fake token balance to be updated
    //   const startTime = Date.now()
    //   while (Date.now() < startTime + 1000) {
    //     if ($playerFakeTokenBalance > 0) {
    //       break
    //     }
    //     await new Promise(resolve => setTimeout(resolve, 50))
    //   }

    //   // Determine initial state based on balance and allowance
    //   if ($playerFakeTokenBalance === 0) {
    //     claimState.state.transitionTo(CLAIM_STATE.NO_TOKENS)
    //   } else if ($playerFakeTokenAllowance === 0) {
    //     claimState.state.transitionTo(CLAIM_STATE.APPROVE)
    //   } else {
    //     claimState.state.transitionTo(CLAIM_STATE.EXCHANGE)
    //   }
    // } else {
    //   // No wallet connected, show connect wallet screen
    //   claimState.state.transitionTo(CLAIM_STATE.CONNECT_WALLET)
    // }
  })
</script>

<WalletInfo />

<div class="claim-container">
  <div class="claim-inner">
    {#if claimState.state.current === CLAIM_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if claimState.state.current === CLAIM_STATE.DONE}
      <Done />
    {/if}
  </div>
</div>

<style lang="scss">
  .claim-container {
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    color: white;
  }
</style>
