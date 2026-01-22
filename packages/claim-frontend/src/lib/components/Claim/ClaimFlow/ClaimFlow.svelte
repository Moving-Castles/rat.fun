<script lang="ts">
  import { onMount } from "svelte"
  import { getProofFromJson } from "merkle-tree-airdrop"
  import merkleTree from "merkle-tree-airdrop/static/tree.json" with { type: "json" }
  import { userAddress } from "$lib/modules/drawbridge"
  import { claimFlowState, CLAIM_FLOW_STATE } from "./state.svelte"
  import { Checking, Ready, Claiming, Complete, Error as ErrorComponent } from "./index"

  onMount(async () => {
    // Reset state
    claimFlowState.state.reset()
    claimFlowState.data.reset()

    // Transition to checking
    claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.CHECKING)

    const address = $userAddress

    if (!address) {
      claimFlowState.data.setErrorMessage("Wallet not initialized")
      claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.ERROR)
      return
    }

    try {
      // Get proof from merkle tree
      const proof = await getProofFromJson(address, merkleTree)

      if (!proof) {
        // This shouldn't happen - outer state should have caught this
        claimFlowState.data.setErrorMessage("No proof found for this address")
        claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.ERROR)
        return
      }

      claimFlowState.data.setProof(proof)

      // Ready to claim (hasClaimed check is done before entering ClaimFlow)
      claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.READY)
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
