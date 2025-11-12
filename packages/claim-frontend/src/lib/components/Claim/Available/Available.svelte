<script lang="ts">
  import { formatUnits } from "viem"
  import type { GetProofReturnType } from "merkle-tree-airdrop"
  import { BigButton } from "$lib/components/Shared"
  import { prepareConnectorClientForTransaction } from "$lib/modules/entry-kit/connector"
  import { ERC20AirdropMerkleProofAbi } from "contracts/externalAbis"
  import { entryKitSession } from "$lib/modules/entry-kit/stores"

  // TODO this is a test contract on base mainnet
  const airdropContractAddress = "0xD6d2e85bEfD703847cDBa78589c4c67b7a147020" as const

  let {
    proof
  }: {
    proof: GetProofReturnType
  } = $props()

  async function sendClaim() {
    if (!$entryKitSession) throw new Error("entrykit not connected")

    const client = await prepareConnectorClientForTransaction()
    client.writeContract({
      address: airdropContractAddress,
      abi: ERC20AirdropMerkleProofAbi,
      functionName: "claim",
      args: [$entryKitSession.userAddress, proof.value, proof.proof]
    })
  }
</script>

<div>
  available: {formatUnits(proof.value, 18)}

  <BigButton
    text="Claim"
    onclick={() => {
      sendClaim()
    }}
  />
</div>

<style lang="scss">
</style>
