<script lang="ts">
  import { formatUnits } from "viem"
  import {
    type AuctionParams,
    CustomQuoter,
    balanceOf,
    buyLimitSpentAmount,
    buyLimitGetCountryCode,
    tickToPriceWithParams
  } from "doppler"
  import { userAddress } from "$lib/modules/drawbridge"
  import { publicClient as publicClientStore, networkConfig } from "$lib/network"
  import { onMount } from "svelte"
  import { asPublicClient } from "$lib/utils/clientAdapter"
  import { swapState, SWAP_STATE } from "./state.svelte"
  import { tokenBalances } from "$lib/modules/balances"
  import {
    wethCurrency,
    usdcCurrency,
    getEurcToUsdcRate,
    getEurcToEthRate,
    decodeQuoterError
  } from "$lib/modules/swap-router"
  import { getSoldPercentage } from "$lib/modules/sold-percentage"

  import { SwapForm, Agreement, SignAndSwap, SwapComplete } from "./index"

  let {
    auctionParams
  }: {
    auctionParams: AuctionParams
  } = $props()

  // Sold percentage (calculated once on mount, needs $state for template binding)
  let soldPercentage = $state<number | null>(null)

  /**
   * Select the best default currency based on balances
   * Priority: ETH if has balance, else USDC if has balance, else ETH
   */
  function selectDefaultCurrency() {
    const ethBalance = $tokenBalances[wethCurrency.address]?.formatted ?? 0
    const usdcBalance = $tokenBalances[usdcCurrency.address]?.formatted ?? 0

    if (ethBalance > 0) {
      swapState.data.setFromCurrency(wethCurrency)
    } else if (usdcBalance > 0) {
      swapState.data.setFromCurrency(usdcCurrency)
    } else {
      // No balance in either, default to ETH
      swapState.data.setFromCurrency(wethCurrency)
    }
  }

  // Watch for balance changes and set default currency once balances are loaded
  let hasSetDefaultCurrency = false
  $effect(() => {
    // Only set default once, when balances first become available
    if (hasSetDefaultCurrency) return

    const ethBalance = $tokenBalances[wethCurrency.address]
    const usdcBalance = $tokenBalances[usdcCurrency.address]

    // Wait until at least one balance is loaded
    if (ethBalance !== undefined || usdcBalance !== undefined) {
      selectDefaultCurrency()
      hasSetDefaultCurrency = true
    }
  })

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
    console.log(
      "[Swap] determineInitialState - savedCountryCode:",
      JSON.stringify(swapState.data.savedCountryCode),
      "truthy:",
      !!swapState.data.savedCountryCode
    )
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

    // Calculate sold percentage (fire and forget, non-blocking)
    getSoldPercentage(adaptedClient, auctionParams).then(percentage => {
      soldPercentage = percentage
    })

    // Initialize quoter
    const quoter = new CustomQuoter(adaptedClient, config.chainId, auctionParams)
    swapState.data.setQuoter(quoter)

    console.log("[Swap] quoter:", quoter)

    // 3. Fetch EURC/USDC and EURC/ETH rates (no wallet required)
    try {
      const [usdcRate, ethRate] = await Promise.all([getEurcToUsdcRate(), getEurcToEthRate()])
      swapState.data.setEurcToUsdcRate(usdcRate)
      swapState.data.setEurcToEthRate(ethRate)
      console.log("[Swap] EURC/USDC rate:", usdcRate, "EURC/ETH rate:", ethRate)

      // Try to get current price by quoting, fall back to tick-based calculation
      let priceInEurc: number

      try {
        // Quote how much EURC needed to buy 1 RAT
        const oneRat = 10n ** BigInt(auctionParams.token.decimals)
        console.log("[Swap] Quoting for oneRat:", oneRat.toString())
        const quoteResult = await quoter.quoteExactOutputV4(oneRat, true)
        console.log("[Swap] Quote result:", quoteResult)
        priceInEurc = Number(quoteResult.formattedAmount)
      } catch (quoteError) {
        // Quote failed (auction may not have started), use starting tick price
        console.error(
          "[Swap] Quote failed, using starting tick price:",
          decodeQuoterError(quoteError)
        )
        priceInEurc = tickToPriceWithParams(auctionParams.startingTick, auctionParams)
        console.log("[Swap] Starting tick price:", priceInEurc, "EURC per RAT")
      }

      const priceInUsdc = priceInEurc * usdcRate
      swapState.data.setCurrentPriceUsdc(priceInUsdc)
      console.log("[Swap] Current price:", priceInUsdc, "USDC per RAT (EURC:", priceInEurc, ")")
    } catch (error) {
      console.error("[Swap] Error fetching rate/price:", error)
    }

    // 4. Early return if no wallet
    if (!$userAddress) return

    // 5. Load user-specific data

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
    console.log(
      "[Swap] Country code from contract:",
      JSON.stringify(countryCode),
      "length:",
      countryCode?.length,
      "for user:",
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

    // 6. Determine initial state based on conditions
    const nextState = determineInitialState()
    swapState.state.transitionTo(nextState)
  })
</script>

{#if soldPercentage !== null}
  <div class="sold-banner">
    <span class="sold-text">{soldPercentage.toFixed(1)}% of total sold</span>
    <div class="progress-bar">
      <div class="progress-fill" style="width: {soldPercentage}%"></div>
    </div>
  </div>
{/if}

<div class="swap-container">
  {#if swapState.state.current === SWAP_STATE.AGREEMENT}
    <Agreement />
  {:else if swapState.state.current === SWAP_STATE.SIGN_AND_SWAP}
    <SwapForm />
    <SignAndSwap />
  {:else if swapState.state.current === SWAP_STATE.SWAP_COMPLETE}
    <SwapComplete />
  {:else}
    LOADING...
  {/if}
</div>

<style lang="scss">
  .sold-banner {
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    width: 700px;
    max-width: 90dvw;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px;
    z-index: var(--z-top);

    .sold-text {
      font-family: var(--special-font-stack);
      font-size: var(--font-size-normal);
      text-transform: uppercase;
      letter-spacing: 1px;
      white-space: nowrap;
    }

    .progress-bar {
      flex: 1;
      height: 10px;
      background: var(--color-grey-mid);

      .progress-fill {
        height: 100%;
        background: var(--color-good);
      }
    }
  }

  .swap-container {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: var(--background-dark-transparent);
  }
</style>
