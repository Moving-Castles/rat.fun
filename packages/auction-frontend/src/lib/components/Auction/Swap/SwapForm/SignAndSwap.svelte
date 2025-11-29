<script lang="ts">
  import { signPermit2, waitForDopplerSwapReceipt } from "doppler"
  import { BigButton, Checkbox } from "$lib/components/Shared"
  import { prepareConnectorClientForTransaction } from "$lib/modules/drawbridge/connector"
  import { userAddress } from "$lib/modules/drawbridge"
  import { publicClient as publicClientStore } from "$lib/network"
  import { ratRouterAddress, swapExactIn } from "$lib/modules/swap-router"
  import { signTypedData } from "viem/actions"
  import { asPublicClient } from "$lib/utils/clientAdapter"
  import { swapState, SWAP_STATE } from "../state.svelte"

  let isProcessing = $state(false)
  let waiveWithdrawal = $state(false)

  /**
   * Sign permit2 and execute swap in one flow
   * This is a two-step process:
   * 1. Sign permit (offline, no gas)
   * 2. Execute swap (on-chain transaction)
   */
  async function signAndSwap() {
    if (isProcessing) return
    isProcessing = true

    try {
      if (!$userAddress) throw new Error("wallet not connected")

      const auctionParams = swapState.data.auctionParams
      const amountIn = swapState.data.amountIn
      const amountOut = swapState.data.amountOut
      const isExactOut = swapState.data.isExactOut

      if (!auctionParams) throw new Error("auction params not initialized")
      if (amountIn === undefined) throw new Error("amountIn is undefined")

      console.log("[SignAndSwap] Starting sign and swap flow")

      // * * * * * * * * * * * * * * * * *
      // * * * * * * * * * * * * * * * * *
      // Step 1: Sign permit (offline)
      // * * * * * * * * * * * * * * * * *
      // * * * * * * * * * * * * * * * * *

      console.log("[SignAndSwap] Step 1: Signing permit...")
      const client = await prepareConnectorClientForTransaction()

      // TODO ensure signTypedData in a less hacky way
      const extendedClient = (client as any).extend((client: any) => ({
        signTypedData: (args: any) => signTypedData(client, args)
      }))

      // For exact out give 10% padding to permit amount to account for price variance and imprecise conversion
      // (because permit is always for input currency)
      const amountPadded = isExactOut ? (amountIn * 110n) / 100n : amountIn
      const result = await signPermit2(
        asPublicClient($publicClientStore!),
        extendedClient,
        swapState.data.fromCurrency.address,
        ratRouterAddress,
        amountPadded
      )

      // Update swapState with permit data
      swapState.data.setPermit(result.permit)
      swapState.data.setPermitSignature(result.permitSignature)

      console.log("[SignAndSwap] Permit signed successfully")

      // * * * * * * * * * * * * * * * * *
      // * * * * * * * * * * * * * * * * *
      // Step 2: Execute swap (on-chain)
      // * * * * * * * * * * * * * * * * *
      // * * * * * * * * * * * * * * * * *

      console.log("[SignAndSwap] Step 2: Executing swap...")
      const swapTxHash = await swapExactIn(
        swapState.data.fromCurrency.address,
        auctionParams,
        // TODO add swapExactOut or consider padding amountIn for isExactOut
        amountIn,
        result.permit,
        result.permitSignature
      )
      const swapResult = await waitForDopplerSwapReceipt(
        asPublicClient($publicClientStore!),
        swapTxHash
      )
      console.log("[SignAndSwap] Swap executed successfully:", swapResult)

      // Store receipt in state
      swapState.data.setSwapReceipt(swapResult)

      // Reset checkbox for next swap
      waiveWithdrawal = false

      // Transition to swap complete state
      swapState.state.transitionTo(SWAP_STATE.SWAP_COMPLETE)
    } catch (error) {
      console.error("[SignAndSwap] Error during sign and swap:", error)
      throw error
    } finally {
      isProcessing = false
    }
  }
</script>

<div class="withdrawal-container">
  <label class="withdrawal-label">
    <Checkbox bind:checked={waiveWithdrawal} />
    <span class="withdrawal-text">
      I want immediate delivery and waive my 14-day withdrawal right for this purchase.
    </span>
  </label>
</div>

<div class="button-container">
  <BigButton
    disabled={!swapState.data.amountIn || isProcessing || !waiveWithdrawal}
    text={isProcessing ? "Processing..." : "Swap"}
    onclick={() => {
      signAndSwap()
    }}
  />
</div>

<style lang="scss">
  .withdrawal-container {
    display: flex;
    flex-flow: column nowrap;
    align-items: flex-start;
    justify-content: center;
    padding: 10px;
    margin-bottom: 10px;
  }

  .withdrawal-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    user-select: none;
  }

  .withdrawal-text {
    font-size: var(--font-size-normal);
    line-height: 1.2;
    color: white;
  }

  .button-container {
    width: 100%;
    height: 160px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
