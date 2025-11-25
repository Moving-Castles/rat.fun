<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import { type AuctionParams, readAuctionParams } from "doppler"
  import { dopplerHookAbi } from "@whetstone-research/doppler-sdk"
  import { publicNetwork } from "$lib/modules/network"
  import { AUCTION_STATE, auctionState } from "$lib/components/Auction/state.svelte"
  import { userAddress } from "$lib/modules/drawbridge"
  import { playerAddress } from "$lib/modules/state/stores"
  import { initErc20Listener } from "$lib/modules/erc20Listener"
  import type { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"

  import { Swap, ConnectWalletForm, Ended, Error as ErrorComponent } from "$lib/components/Auction"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"

  let auctionParams = $state({} as AuctionParams)

  let endingTimeInterval: ReturnType<typeof setInterval> | null = null

  function readAuctionParamsStrict(chainId: number) {
    const result = readAuctionParams(chainId)
    if (!result) throw new Error("Auction parameters not found for chain")
    return result
  }

  // Check if early exit
  // It occurs if the auction is fully bought out before the ending time
  async function checkEarlyExit(publicNetwork: SetupPublicNetworkResult) {
    return publicNetwork.publicClient.readContract({
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

  const setupAndGoToSwap = () => {
    // Sync drawbridge userAddress to playerAddress store (for WalletInfo component)
    // We know userAddress is not null here
    playerAddress.set($userAddress!)
    initErc20Listener()
    auctionState.state.transitionTo(AUCTION_STATE.SWAP)
  }

  // Listen to changes in wallet connection (for when user connects wallet)
  $effect(() => {
    if ($userAddress) {
      console.log("[Claim] Wallet connected:", $userAddress)

      if (auctionState?.state?.current === AUCTION_STATE.ENDED) {
        // Nothing to do, auction is over
        return
      }

      setupAndGoToSwap()
    }
  })

  onMount(async () => {
    // Reset state to INIT
    auctionState.state.reset()

    auctionParams = readAuctionParamsStrict($publicNetwork.publicClient.chain.id)
    console.log("[Auction] auctionParams:", auctionParams)
    if (!auctionParams) {
      console.error("[Auction] auctionParams not found")
      auctionState.state.transitionTo(AUCTION_STATE.ERROR)
      return
    }

    const saleEnded = checkSaleEnded()
    const earlyExit = await checkEarlyExit($publicNetwork)
    if (saleEnded || earlyExit) {
      auctionState.state.transitionTo(AUCTION_STATE.ENDED)
      return
    }

    console.log("[Auction] userAddress:", $userAddress)
    // If wallet is already connected (from previous session), transition to swap
    if ($userAddress) {
      console.log("[Claim] Wallet already connected on mount:", $userAddress)
      setupAndGoToSwap()
    } else {
      // No wallet connected, show connect wallet screen
      auctionState.state.transitionTo(AUCTION_STATE.CONNECT_WALLET)
    }

    // Monitor auction ending time and early exit
    endingTimeInterval = setInterval(async () => {
      const saleEnded = checkSaleEnded()
      const earlyExit = await checkEarlyExit($publicNetwork)
      if (saleEnded || earlyExit) {
        clearEndingTimeInterval()
        auctionState.state.transitionTo(AUCTION_STATE.ENDED)
      }
    }, 30_000)
  })

  onDestroy(clearEndingTimeInterval)
</script>

<WalletInfo />

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
