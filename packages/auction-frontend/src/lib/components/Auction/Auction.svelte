<script lang="ts">
  import { onDestroy, onMount } from "svelte"
  import {
    type AuctionParams,
    readAuctionParams,
    buyLimitSpentAmount,
    buyLimitGetCountryCode,
    buyLimitSetCountryCode
  } from "doppler"
  import { dopplerHookAbi } from "@whetstone-research/doppler-sdk"
  import { publicNetwork } from "$lib/modules/network"
  import { AUCTION_STATE, auctionState } from "$lib/components/Auction/state.svelte"
  import { Available, ConnectWalletForm } from "$lib/components/Auction"
  import { userAddress } from "$lib/modules/entry-kit"
  import { playerAddress } from "$lib/modules/state/stores"
  import { initErc20Listener } from "$lib/modules/erc20Listener"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"
  import type { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"
  import { prepareConnectorClientForTransaction } from "$lib/modules/entry-kit/connector"
  import { BigButton } from "$lib/components/Shared"

  let auctionParams = $state({} as AuctionParams)
  let spentAmount = $state<bigint | undefined>(undefined)
  let savedCountryCode = $state<string | undefined>(undefined)

  let endingTimeInterval: ReturnType<typeof setInterval> | null = null

  function readAuctionParamsStrict(chainId: number) {
    const result = readAuctionParams(chainId)
    if (!result) throw new Error("Auction parameters not found for chain")
    return result
  }

  $effect(() => {
    // Get relevant static data about the current auction for given chain
    auctionParams = readAuctionParamsStrict($publicNetwork.publicClient.chain.id)
  })

  // Check if early exit
  // It occurs if the auction is fully bought out before the ending time
  async function checkEarlyExit(publicNetwork: SetupPublicNetworkResult) {
    return publicNetwork.publicClient.readContract({
      address: auctionParams.hookAddress,
      abi: dopplerHookAbi,
      functionName: "earlyExit"
    })
  }

  $effect(() => {
    checkEarlyExit($publicNetwork).then(earlyExit => {
      if (earlyExit) {
        auctionState.state.transitionTo(AUCTION_STATE.ENDED)
      }
    })
  })

  async function updateSpentAmount() {
    spentAmount = await buyLimitSpentAmount(
      $publicNetwork.publicClient,
      auctionParams.token.address,
      $userAddress
    )
  }

  // Get spent amount and country code when user connects
  $effect(() => {
    if ($userAddress) {
      updateSpentAmount()
      buyLimitGetCountryCode(
        $publicNetwork.publicClient,
        auctionParams.token.address,
        $userAddress
      ).then(result => {
        savedCountryCode = result
      })
    }
  })

  // Listen to changes in wallet connection (for when user connects wallet)
  $effect(() => {
    if ($userAddress) {
      console.log("[Claim] Wallet connected:", $userAddress)

      // Sync EntryKit userAddress to playerAddress store (for WalletInfo component)
      playerAddress.set($userAddress)

      if (auctionState.state.current === AUCTION_STATE.ENDED) {
        // Nothing to do, auction is over
        return
      }

      // Transition based on claim status
      if (spentAmount === undefined || savedCountryCode === undefined) {
        auctionState.state.transitionTo(AUCTION_STATE.CHECKING)
      } else if (!savedCountryCode) {
        auctionState.state.transitionTo(AUCTION_STATE.COUNTRY_CODE)
      } else if (spentAmount >= BigInt(auctionParams.spendLimitAmount)) {
        console.log(spentAmount, BigInt(auctionParams.spendLimitAmount))
        auctionState.state.transitionTo(AUCTION_STATE.WALLET_LIMIT_REACHED)
      } else {
        auctionState.state.transitionTo(AUCTION_STATE.AVAILABLE)
      }
    }
  })

  onMount(async () => {
    // Reset state to INIT
    auctionState.state.reset()

    // If wallet is already connected (from previous session), transition to checking
    if ($userAddress) {
      console.log("[Claim] Wallet already connected on mount:", $userAddress)
      // Sync to playerAddress store and initialize listeners
      playerAddress.set($userAddress)
      initErc20Listener()
      auctionState.state.transitionTo(AUCTION_STATE.CHECKING)
    } else {
      // No wallet connected, show connect wallet screen
      auctionState.state.transitionTo(AUCTION_STATE.CONNECT_WALLET)
    }

    // Monitor auction ending time
    endingTimeInterval = setInterval(() => {
      const now = Date.now() / 1000
      if (now >= auctionParams.endingTime) {
        auctionState.state.transitionTo(AUCTION_STATE.ENDED)
      }
    }, 60_000)
  })

  onDestroy(() => {
    if (endingTimeInterval) {
      clearInterval(endingTimeInterval)
      endingTimeInterval = null
    }
  })

  async function sendCountryCode() {
    if (!$userAddress) throw new Error("wallet not connected")

    const client = await prepareConnectorClientForTransaction()
    // TODO derive country code from ip lookup
    const countryCode = "US"
    const txHash = await buyLimitSetCountryCode(client, auctionParams.token.address, countryCode)
    await $publicNetwork.publicClient.waitForTransactionReceipt({ hash: txHash })
  }
</script>

<WalletInfo />

<div class="claim-container">
  <div class="claim-inner">
    {#if auctionState.state.current === AUCTION_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if auctionState.state.current === AUCTION_STATE.CHECKING || spentAmount === undefined}
      loading...
    {:else if auctionState.state.current === AUCTION_STATE.COUNTRY_CODE}
      <BigButton
        text="Set country code"
        onclick={() => {
          sendCountryCode()
        }}
      />
    {:else if auctionState.state.current === AUCTION_STATE.AVAILABLE}
      <Available {auctionParams} {spentAmount} />
    {:else if auctionState.state.current === AUCTION_STATE.WALLET_LIMIT_REACHED}
      limit reached
    {:else if auctionState.state.current === AUCTION_STATE.ENDED}
      auction ended
    {/if}
  </div>
</div>

<style lang="scss">
  .claim-container {
    width: 100dvw;
    height: 100dvh;
    z-index: 1000;
    color: white;
  }
</style>
