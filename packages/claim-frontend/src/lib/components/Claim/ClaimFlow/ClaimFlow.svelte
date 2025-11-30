<script lang="ts">
  import { onMount } from "svelte"
  import type { Hex } from "viem"
  import type { PublicClient } from "drawbridge"
  import { getProofFromJson } from "merkle-tree-airdrop"
  import merkleTree from "merkle-tree-airdrop/static/test_tree.json" with { type: "json" }
  import { ERC20AirdropMerkleProofAbi } from "contracts/externalAbis"
  import { publicClient as publicClientStore, networkConfig } from "$lib/network"
  import { userAddress } from "$lib/modules/drawbridge"
  import { claimFlowState, CLAIM_FLOW_STATE } from "./state.svelte"
  import { Checking, Ready, Claiming, Complete, Error as ErrorComponent } from "./index"

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

  onMount(async () => {
    // Reset state
    claimFlowState.state.reset()
    claimFlowState.data.reset()

    // Transition to checking
    claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.CHECKING)

    const client = $publicClientStore
    const config = $networkConfig
    const address = $userAddress

    if (!client || !config || !address) {
      claimFlowState.data.setErrorMessage("Network or wallet not initialized")
      claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.ERROR)
      return
    }

    try {
      // 1. Get proof from merkle tree
      const proof = await getProofFromJson(address, merkleTree)

      if (!proof) {
        // This shouldn't happen - outer state should have caught this
        claimFlowState.data.setErrorMessage("No proof found for this address")
        claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.ERROR)
        return
      }

      claimFlowState.data.setProof(proof)

      // 2. Check if already claimed
      const hasClaimed = await checkHasClaimed(client, address, config.airdropContractAddress)

      if (hasClaimed) {
        // Already claimed - go straight to complete
        claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.COMPLETE)
      } else {
        // Ready to claim
        claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.READY)
      }
    } catch (error) {
      console.error("[ClaimFlow] Error during initialization:", error)
      claimFlowState.data.setErrorMessage(error instanceof Error ? error.message : "Unknown error")
      claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.ERROR)
    }
  })
</script>

<div class="claim-flow-container">
  {#if claimFlowState.state.current === CLAIM_FLOW_STATE.CHECKING}
    <Checking />
  {:else if claimFlowState.state.current === CLAIM_FLOW_STATE.READY}
    <Ready />
  {:else if claimFlowState.state.current === CLAIM_FLOW_STATE.CLAIMING}
    <Claiming />
  {:else if claimFlowState.state.current === CLAIM_FLOW_STATE.COMPLETE}
    <Complete />
  {:else if claimFlowState.state.current === CLAIM_FLOW_STATE.ERROR}
    <ErrorComponent />
  {/if}
</div>

<style lang="scss">
  .claim-flow-container {
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    justify-content: center;
  }
</style>
