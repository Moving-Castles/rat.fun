<script lang="ts">
  import { onMount } from "svelte"
  import type { Hex } from "viem"
  import type { PublicClient } from "drawbridge"
  import { getProofFromJson, type GetProofReturnType } from "merkle-tree-airdrop"
  import merkleTree from "merkle-tree-airdrop/static/test_tree.json" with { type: "json" }
  import { publicClient as publicClientStore } from "$lib/network"
  import { CLAIM_STATE, claimState } from "$lib/components/Claim/state.svelte"
  import { Available, ConnectWalletForm, Done } from "$lib/components/Claim"
  import { userAddress } from "$lib/modules/drawbridge"
  import { initErc20Listener } from "$lib/modules/erc20Listener"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"
  import { ERC20AirdropMerkleProofAbi } from "contracts/externalAbis"

  // TODO this is a test contract on base mainnet
  const airdropContractAddress = "0xD6d2e85bEfD703847cDBa78589c4c67b7a147020" as const

  let proof = $state<undefined | null | GetProofReturnType>(undefined)
  let hasClaimed = $state<undefined | boolean>(undefined)

  // Get proof when user connects
  $effect(() => {
    if ($userAddress && proof === undefined) {
      getProofFromJson($userAddress, merkleTree).then(result => {
        proof = result
      })
    }
  })

  // Check claim status
  async function checkClaimStatus(publicClient: PublicClient, playerAddress: Hex) {
    return await publicClient.readContract({
      address: airdropContractAddress,
      abi: ERC20AirdropMerkleProofAbi,
      functionName: "hasClaimed",
      args: [playerAddress]
    })
  }

  $effect(() => {
    const pubClient = $publicClientStore
    if ($userAddress && hasClaimed === undefined && pubClient) {
      checkClaimStatus(pubClient, $userAddress).then(result => {
        hasClaimed = result as boolean
      })
    }
  })

  // Listen to changes in wallet connection (for when user connects wallet)
  $effect(() => {
    if ($userAddress) {
      console.log("[Claim] Wallet connected:", $userAddress)

      // Initialize ERC20 listener (for balance display in WalletInfo)
      initErc20Listener()

      // Transition based on claim status
      if (proof === null) {
        claimState.state.transitionTo(CLAIM_STATE.NOT_AVAILABLE)
      } else if (proof === undefined || hasClaimed === undefined) {
        claimState.state.transitionTo(CLAIM_STATE.CHECKING)
      } else if (hasClaimed) {
        claimState.state.transitionTo(CLAIM_STATE.DONE)
      } else {
        claimState.state.transitionTo(CLAIM_STATE.AVAILABLE)
      }
    }
  })

  onMount(async () => {
    // Reset state to INIT
    claimState.state.reset()

    // If wallet is already connected (from previous session), transition to checking
    if ($userAddress) {
      console.log("[Claim] Wallet already connected on mount:", $userAddress)
      // Initialize listeners
      initErc20Listener()
      claimState.state.transitionTo(CLAIM_STATE.CHECKING)
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
    {:else if claimState.state.current === CLAIM_STATE.CHECKING || !proof}
      loading...
    {:else if claimState.state.current === CLAIM_STATE.AVAILABLE}
      <Available {proof} />
    {:else if claimState.state.current === CLAIM_STATE.DONE}
      <Done />
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
