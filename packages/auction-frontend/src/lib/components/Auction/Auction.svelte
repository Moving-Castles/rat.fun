<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { type AuctionParams, readAuctionParams } from "doppler"
  import { PUBLIC_TEST_AUCTION } from "$env/static/public"
  import testAuctionParams from "../../../../../doppler/_test-auction-params.json"
  import { dopplerHookAbi } from "@whetstone-research/doppler-sdk"
  import type { PublicClient } from "drawbridge"
  import type { Hex } from "viem"
  import { publicClient, networkConfig } from "$lib/network"
  import { AUCTION_STATE, auctionState } from "$lib/components/Auction/state.svelte"
  import { userAddress } from "$lib/modules/drawbridge"
  import { initBalanceListeners } from "$lib/modules/balances"
  import { getTokenCurrency } from "$lib/modules/swap-router"
  import { Swap, ConnectWalletForm, Ended, Error as ErrorComponent } from "$lib/components/Auction"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"

  const isTestAuction = PUBLIC_TEST_AUCTION === "true"

  let auctionParams = $state({} as AuctionParams)

  let endingTimeInterval: ReturnType<typeof setInterval> | null = null

  function readAuctionParamsStrict(chainId: number) {
    if (isTestAuction) {
      const params = testAuctionParams[String(chainId) as keyof typeof testAuctionParams]
      if (!params) throw new Error("Test auction parameters not found for chain")
      return params as AuctionParams
    }
    const result = readAuctionParams(chainId)
    if (!result) throw new Error("Auction parameters not found for chain")
    return result
  }

  // Check if early exit
  // It occurs if the auction is fully bought out before the ending time
  async function checkEarlyExit(client: PublicClient) {
    return client.readContract({
      address: auctionParams.hookAddress,
      abi: dopplerHookAbi,
      functionName: "earlyExit"
    })
  }

  function checkSaleEnded() {
    const now = Date.now() / 1000
    return now >= auctionParams.endingTime
  }

  function clearEndingTimeInterval() {
    if (endingTimeInterval) {
      clearInterval(endingTimeInterval)
      endingTimeInterval = null
    }
  }

  const setupAndGoToSwap = (publicClient: PublicClient, userAddress: Hex) => {
    const tokenCurrency = getTokenCurrency(auctionParams)
    initBalanceListeners(publicClient, userAddress, tokenCurrency)
    auctionState.state.transitionTo(AUCTION_STATE.SWAP)
  }

  // Listen to changes in wallet connection (for when user connects wallet)
  $effect(() => {
    if ($publicClient && $userAddress) {
      console.log("[Claim] Wallet connected:", $userAddress)

      if (auctionState?.state?.current === AUCTION_STATE.ENDED) {
        // Nothing to do, auction is over
        return
      }

      setupAndGoToSwap($publicClient, $userAddress)
    }
  })

  onMount(async () => {
    // Reset state to INIT
    auctionState.state.reset()

    const client = $publicClient
    const config = $networkConfig
    if (!client || !config) {
      console.error("[Auction] Network not initialized")
      auctionState.state.transitionTo(AUCTION_STATE.ERROR)
      return
    }

    auctionParams = readAuctionParamsStrict(config.chainId)
    console.log("[Auction] auctionParams:", $state.snapshot(auctionParams))
    if (!auctionParams) {
      console.error("[Auction] auctionParams not found")
      auctionState.state.transitionTo(AUCTION_STATE.ERROR)
      return
    }

    const saleEnded = checkSaleEnded()
    const earlyExit = await checkEarlyExit(client)
    if (saleEnded || earlyExit) {
      auctionState.state.transitionTo(AUCTION_STATE.ENDED)
      return
    }

    console.log("[Auction] userAddress:", $userAddress)
    // If wallet is already connected (from previous session), transition to swap
    if ($userAddress) {
      console.log("[Claim] Wallet already connected on mount:", $userAddress)
      setupAndGoToSwap(client, $userAddress)
    } else {
      // No wallet connected, show connect wallet screen
      auctionState.state.transitionTo(AUCTION_STATE.CONNECT_WALLET)
    }

    // Monitor auction ending time and early exit
    endingTimeInterval = setInterval(async () => {
      const currentClient = $publicClient
      if (!currentClient) return

      const saleEnded = checkSaleEnded()
      const earlyExit = await checkEarlyExit(currentClient)
      if (saleEnded || earlyExit) {
        clearEndingTimeInterval()
        auctionState.state.transitionTo(AUCTION_STATE.ENDED)
      }
    }, 30_000)
  })

  onDestroy(() => {
    clearEndingTimeInterval()
  })
</script>

<WalletInfo />

{#if isTestAuction}
  <div class="test-auction-banner">TEST AUCTION</div>
{/if}

<div class="auction-container">
  <div class="auction-inner">
    {#if auctionState.state.current === AUCTION_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if auctionState.state.current === AUCTION_STATE.SWAP}
      <Swap {auctionParams} />
    {:else if auctionState.state.current === AUCTION_STATE.ENDED}
      <Ended />
    {:else if auctionState.state.current === AUCTION_STATE.ERROR}
      <ErrorComponent />
    {/if}
  </div>
</div>

<style lang="scss">
  .test-auction-banner {
    position: fixed;
    top: 0;
    right: 0;
    right: 0;
    background: #ff4444;
    color: white;
    text-align: center;
    padding: 8px;
    font-weight: bold;
    font-size: 20px;
    letter-spacing: 2px;
    z-index: 9999;
    width: auto;
  }

  .auction-container {
    width: 100dvw;
    height: 100dvh;
    z-index: 1000;
    color: white;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;

    .auction-inner {
      width: 600px;
      max-width: 90dvw;
      height: auto;
    }
  }
</style>
