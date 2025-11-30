<script lang="ts">
  import { get } from "svelte/store"
  import { formatUnits } from "viem"
  import { BigButton } from "$lib/components/Shared"
  import { prepareConnectorClientForTransaction } from "$lib/modules/drawbridge/connector"
  import { ERC20AirdropMerkleProofAbi } from "contracts/externalAbis"
  import { userAddress } from "$lib/modules/drawbridge"
  import { networkConfig } from "$lib/network"
  import { claimFlowState, CLAIM_FLOW_STATE } from "./state.svelte"
  import { waitForTransactionReceiptSuccess } from "$lib/modules/on-chain-transactions"

  async function sendClaim() {
    const address = get(userAddress)
    if (!address) throw new Error("wallet not connected")

    const config = get(networkConfig)
    if (!config) throw new Error("network not initialized")

    const proof = claimFlowState.data.proof
    if (!proof) throw new Error("no proof available")

    // Transition to claiming state
    claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.CLAIMING)

    try {
      const client = await prepareConnectorClientForTransaction()
      const txHash = await client.writeContract({
        address: config.airdropContractAddress,
        abi: ERC20AirdropMerkleProofAbi,
        functionName: "claim",
        args: [address, proof.value, proof.proof]
      })

      claimFlowState.data.setTxHash(txHash)

      // Wait for transaction to complete
      await waitForTransactionReceiptSuccess(txHash)

      // Success!
      claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.COMPLETE)
    } catch (error) {
      console.error("[Ready] Claim failed:", error)
      claimFlowState.data.setErrorMessage(error instanceof Error ? error.message : "Claim failed")
      claimFlowState.state.transitionTo(CLAIM_FLOW_STATE.ERROR)
    }
  }
</script>

<div class="ready">
  <p class="amount">
    You can claim: <strong>{formatUnits(claimFlowState.data.claimAmount, 18)} $RAT</strong>
  </p>

  <BigButton
    text="Claim"
    onclick={() => {
      sendClaim()
    }}
  />
</div>

<style lang="scss">
  .ready {
    text-align: center;
    display: flex;
    flex-flow: column nowrap;
    align-items: center;
    gap: 1rem;

    .amount {
      font-size: 1.2rem;
    }
  }
</style>
