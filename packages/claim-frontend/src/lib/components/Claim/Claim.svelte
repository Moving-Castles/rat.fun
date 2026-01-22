<script lang="ts">
  import { onMount } from "svelte"
  import type { Hex } from "viem"
  import type { PublicClient } from "drawbridge"
  import { getProofFromJson } from "merkle-tree-airdrop"
  import merkleTree from "merkle-tree-airdrop/static/tree.json" with { type: "json" }
  import { ERC20AirdropMerkleProofAbi } from "contracts/externalAbis"
  import { CLAIM_STATE, claimState } from "$lib/components/Claim/state.svelte"
  import { ConnectWalletForm, NotEligible, AlreadyClaimed, ClaimFlow } from "$lib/components/Claim"
  import { userAddress } from "$lib/modules/drawbridge"
  import { publicClient as publicClientStore, networkConfig } from "$lib/network"
  import { initErc20Listener } from "$lib/modules/erc20Listener"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"

  /**
   * Check if user is eligible (has proof in merkle tree)
   * This is a quick client-side check before entering the claim flow
   */
  async function checkEligibility(address: Hex): Promise<boolean> {
    const proof = await getProofFromJson(address, merkleTree)
    return proof !== null
  }

  /**
   * Check if user has already claimed
   */
  async function checkHasClaimed(
    publicClient: PublicClient,
    playerAddress: Hex,
    airdropAddress: Hex
  ): Promise<boolean> {
    return (await publicClient.readContract({
      address: airdropAddress,
      abi: ERC20AirdropMerkleProofAbi,
      functionName: "hasClaimed",
      args: [playerAddress]
    })) as boolean
  }

  /**
   * Handle wallet connection and transition to appropriate state
   */
  async function handleWalletConnected(address: Hex) {
    console.log("[Claim] Wallet connected:", address)

    // Initialize ERC20 listener (for balance display in WalletInfo)
    initErc20Listener()

    // Check eligibility first
    const isEligible = await checkEligibility(address)

    if (!isEligible) {
      // User not in merkle tree
      claimState.state.transitionTo(CLAIM_STATE.NOT_ELIGIBLE)
      return
    }

    // Check if already claimed
    const client = $publicClientStore
    const config = $networkConfig

    if (client && config) {
      const hasClaimed = await checkHasClaimed(client, address, config.airdropContractAddress)
      if (hasClaimed) {
        claimState.state.transitionTo(CLAIM_STATE.ALREADY_CLAIMED)
        return
      }
    }

    // User is eligible and hasn't claimed - hand off to ClaimFlow
    claimState.state.transitionTo(CLAIM_STATE.CLAIM)
  }

  // Listen to changes in wallet connection
  $effect(() => {
    if ($userAddress && claimState.state.current === CLAIM_STATE.CONNECT_WALLET) {
      handleWalletConnected($userAddress)
    }
  })

  onMount(async () => {
    // Reset state to INIT
    claimState.state.reset()

    // If wallet is already connected (from previous session)
    if ($userAddress) {
      console.log("[Claim] Wallet already connected on mount:", $userAddress)
      await handleWalletConnected($userAddress)
    } else {
      // No wallet connected, show connect wallet screen
      claimState.state.transitionTo(CLAIM_STATE.CONNECT_WALLET)
    }
  })
</script>

<WalletInfo />

<div class="claim-container">
  <div class="claim-inner">
    {#if claimState.state.current === CLAIM_STATE.CONNECT_WALLET}
      <ConnectWalletForm />
    {:else if claimState.state.current === CLAIM_STATE.CLAIM}
      <ClaimFlow />
    {:else if claimState.state.current === CLAIM_STATE.NOT_ELIGIBLE}
      <NotEligible />
    {:else if claimState.state.current === CLAIM_STATE.ALREADY_CLAIMED}
      <AlreadyClaimed />
    {:else if claimState.state.current === CLAIM_STATE.ERROR}
      <div class="error">Something went wrong</div>
    {/if}
  </div>
</div>

<style lang="scss">
  .claim-container {
    width: 100dvw;
    height: 100dvh;
    z-index: 1000;
    color: white;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;

    .claim-inner {
      width: 600px;
      max-width: 90dvw;
      height: auto;
    }
  }

  .error {
    text-align: center;
    color: orangered;
  }
</style>
