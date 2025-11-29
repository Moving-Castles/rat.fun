<script lang="ts">
  import { permit2AllowMax } from "doppler"
  import { BigButton } from "$lib/components/Shared"
  import { prepareConnectorClientForTransaction } from "$lib/modules/drawbridge/connector"
  import { publicClient as publicClientStore } from "$lib/network"
  import { asPublicClient, asWalletClient } from "$lib/utils/clientAdapter"
  import { swapState, SWAP_STATE } from "../state.svelte"

  let isProcessing = $state(false)

  // TODO this should be called based on fromCurrency, after user initiates swap
  // eth doesn't need permit2 at all, usdc does
  // eurc isn't planned to be used, so it's just usdc for now
  async function sendPermit2AllowMax() {
    if (isProcessing) return
    isProcessing = true

    try {
      const client = await prepareConnectorClientForTransaction()
      const { receipt } = await permit2AllowMax(
        asPublicClient($publicClientStore!),
        asWalletClient(client),
        swapState.data.fromCurrency.address
      )
      if (receipt.status === "success") {
        // Update state and transition to next state
        swapState.data.setIsPermit2Req(false)
        swapState.state.transitionTo(SWAP_STATE.SIGN_AND_SWAP)
      }
    } catch (error) {
      console.error("[Permit2AllowMax] Error approving token:", error)
      throw error
    } finally {
      isProcessing = false
    }
  }
</script>

<div class="permit2-container">
  <div class="permit2-explanation">
    <h3>One-Time Token Approval</h3>
    <p>
      To enable swapping, you need to approve Uniswap's Permit2 contract to access your tokens. This
      is a one-time setup that allows for gasless approvals on future swaps.
    </p>
  </div>

  <div class="button-container">
    <BigButton
      text={isProcessing ? "Approving..." : "Approve Token Access"}
      disabled={isProcessing}
      onclick={() => {
        sendPermit2AllowMax()
      }}
    />
  </div>
</div>

<style lang="scss">
  .permit2-container {
    display: flex;
    flex-flow: column nowrap;
    padding: 20px;
    padding-top: 0;

    .permit2-explanation {
      margin-bottom: 20px;

      h3 {
        font-size: var(--font-size-large);
        color: white;
        margin-bottom: 12px;
        font-weight: bold;
      }

      p {
        font-size: var(--font-size-normal);
        color: rgba(255, 255, 255, 0.85);
        line-height: 1.5;
        margin: 0;
      }
    }

    .button-container {
      width: 100%;
      height: 160px;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
