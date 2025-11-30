<script lang="ts">
  import { formatUnits } from "viem"
  import {
    type AuctionParams,
    CustomQuoter,
    balanceOf,
    buyLimitSpentAmount,
    buyLimitGetCountryCode
  } from "doppler"
  import { userAddress } from "$lib/modules/drawbridge"
  import { publicClient as publicClientStore, networkConfig } from "$lib/network"
  import { onMount } from "svelte"
  import { asPublicClient } from "$lib/utils/clientAdapter"
  import { swapState, SWAP_STATE } from "./state.svelte"

  import { SwapForm, Agreement, SignAndSwap, SwapComplete } from "./index"
  import DebugPanel from "./DebugPanel.svelte"

  let {
    auctionParams
  }: {
    auctionParams: AuctionParams
  } = $props()

  /**
   * Determine which state to transition to based on loaded data
   */
  function determineInitialState(): SWAP_STATE {
    // Check in order of requirements:

    // 1. Check wallet limit reached
    if (
      swapState.data.spentAmount !== undefined &&
      swapState.data.spentAmount >= BigInt(auctionParams.spendLimitAmount)
    ) {
      return SWAP_STATE.WALLET_LIMIT_REACHED
    }

    // 2. Check country code requirement
    if (!swapState.data.savedCountryCode) {
      return SWAP_STATE.AGREEMENT
    }

    // 3. Default to sign and swap (ready to swap)
    // Permit2 approval is now handled inline when user clicks swap
    return SWAP_STATE.SIGN_AND_SWAP
  }

  onMount(async () => {
    // 1. Reset swap state to INIT
    swapState.state.reset()
    swapState.data.reset()

    // 2. Initialize shared data in swapState
    swapState.data.setAuctionParams(auctionParams)

    const client = $publicClientStore
    const config = $networkConfig
    if (!client || !config) {
      console.error("[Swap] Network not initialized")
      return
    }

    const adaptedClient = asPublicClient(client)

    // Initialize quoter
    const quoter = new CustomQuoter(adaptedClient, config.chainId, auctionParams)
    swapState.data.setQuoter(quoter)

    console.log("[Swap] quoter:", quoter)

    // 3. Early return if no wallet
    if (!$userAddress) return

    // 4. Load user-specific data

    // Load spent amount
    const spentAmount = await buyLimitSpentAmount(
      adaptedClient,
      auctionParams.token.address,
      $userAddress
    )
    swapState.data.setSpentAmount(spentAmount)

    // Load country code
    const countryCode = await buyLimitGetCountryCode(
      adaptedClient,
      auctionParams.token.address,
      $userAddress
    )
    swapState.data.setSavedCountryCode(countryCode)

    // TODO replace numeraire balance with fromCurrency balance
    // Load balances
    const unformattedNumeraireBalance = await balanceOf(
      adaptedClient,
      auctionParams.numeraire.address,
      $userAddress
    )
    const numeraireBalance = Number(
      formatUnits(unformattedNumeraireBalance, auctionParams.numeraire.decimals)
    )
    swapState.data.setNumeraireBalance(numeraireBalance)

    const unformattedTokenBalance = await balanceOf(
      adaptedClient,
      auctionParams.token.address,
      $userAddress
    )
    const tokenBalance = Number(formatUnits(unformattedTokenBalance, auctionParams.token.decimals))
    swapState.data.setTokenBalance(tokenBalance)

    // 5. Determine initial state based on conditions
    const nextState = determineInitialState()
    swapState.state.transitionTo(nextState)
  })
</script>

<DebugPanel />

<div class="swap-container">
  {#if swapState.state.current === SWAP_STATE.AGREEMENT}
    <Agreement />
  {:else if swapState.state.current === SWAP_STATE.SIGN_AND_SWAP}
    <SwapForm />
    <SignAndSwap />
  {:else if swapState.state.current === SWAP_STATE.SWAP_COMPLETE}
    <SwapComplete />
  {/if}
</div>

<style lang="scss">
  .swap-container {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
  }
</style>
