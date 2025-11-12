<script lang="ts">
  import { onMount } from "svelte"
  import type { Hex } from "viem"
  import { getProofFromJson, type GetProofReturnType } from "merkle-tree-airdrop"
  import merkleTree from "merkle-tree-airdrop/static/test_tree.json" with { type: "json" }
  import { publicNetwork } from "$lib/modules/network"
  import { CLAIM_STATE, claimState } from "$lib/components/Claim/state.svelte"
  import { Available, ConnectWalletForm, Done } from "$lib/components/Claim"
  import { WALLET_TYPE } from "$lib/mud/enums"
  import { setupWalletNetwork } from "$lib/mud/setupWalletNetwork"
  import { initWalletNetwork } from "$lib/initWalletNetwork"
  import { entryKitSession } from "$lib/modules/entry-kit/stores"
  import WalletInfo from "$lib/components/WalletInfo/WalletInfo.svelte"
  import { ERC20AirdropMerkleProofAbi } from "contracts/externalAbis"
  import type { SetupPublicNetworkResult } from "$lib/mud/setupPublicNetwork"

  // TODO this is a test contract on base mainnet
  const airdropContractAddress = "0xD6d2e85bEfD703847cDBa78589c4c67b7a147020" as const

  let proof = $state<undefined | null | GetProofReturnType>(undefined)
  let hasClaimed = $state<undefined | boolean>(undefined)

  $effect(() => {
    if ($entryKitSession && proof === undefined) {
      getProofFromJson($entryKitSession.userAddress, merkleTree).then((result) => {
        proof = result
      })
    }
  })

  async function checkClaimStatus(
    publicNetwork: SetupPublicNetworkResult,
    playerAddress: Hex,
  ) {
    return await publicNetwork.publicClient.readContract({
      address: airdropContractAddress,
      abi: ERC20AirdropMerkleProofAbi,
      functionName: "hasClaimed",
      args: [playerAddress]
    })
  }

  $effect(() => {
    if ($entryKitSession && hasClaimed === undefined) {
      checkClaimStatus($publicNetwork, $entryKitSession.userAddress).then((result) => {
        hasClaimed = result as boolean
      })
    }
  })

  // Listen to changes in the entrykit session (for when user connects wallet)
  $effect(() => {
    if ($entryKitSession) {
      if ($entryKitSession?.account?.client && $entryKitSession.userAddress) {
        const wallet = setupWalletNetwork($publicNetwork, $entryKitSession)
        initWalletNetwork(wallet, $entryKitSession.userAddress, WALLET_TYPE.ENTRYKIT)
        
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
    }
  })

  onMount(async () => {
    // Reset state to INIT
    claimState.state.reset()

    claimState.state.transitionTo(CLAIM_STATE.CONNECT_WALLET)

    // // If wallet is already connected (from previous session), wait for balance to load
    // if ($entryKitSession?.account?.client && $entryKitSession.userAddress) {
    //   // Wait for fake token balance to be updated
    //   const startTime = Date.now()
    //   while (Date.now() < startTime + 1000) {
    //     if ($playerFakeTokenBalance > 0) {
    //       break
    //     }
    //     await new Promise(resolve => setTimeout(resolve, 50))
    //   }

    //   // Determine initial state based on balance and allowance
    //   if ($playerFakeTokenBalance === 0) {
    //     claimState.state.transitionTo(CLAIM_STATE.NO_TOKENS)
    //   } else if ($playerFakeTokenAllowance === 0) {
    //     claimState.state.transitionTo(CLAIM_STATE.APPROVE)
    //   } else {
    //     claimState.state.transitionTo(CLAIM_STATE.EXCHANGE)
    //   }
    // } else {
    //   // No wallet connected, show connect wallet screen
    //   claimState.state.transitionTo(CLAIM_STATE.CONNECT_WALLET)
    // }
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
      <Available proof={proof} />
    {:else if claimState.state.current === CLAIM_STATE.DONE}
      <Done />
    {/if}
  </div>
</div>

<style lang="scss">
  .claim-container {
    width: 100vw;
    height: 100vh;
    z-index: 1000;
    color: white;
  }
</style>
