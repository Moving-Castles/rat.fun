<script lang="ts">
  import { type Hex, maxUint128, formatUnits } from "viem"
  import {
    signPermit2,
    waitForDopplerSwapReceipt,
    isPermit2AllowanceRequired,
    permit2AllowMax
  } from "doppler"
  import { BigButton, Checkbox } from "$lib/components/Shared"
  import { getDrawbridge, userAddress } from "$lib/modules/drawbridge"
  import { publicClient as publicClientStore } from "$lib/network"
  import {
    deltaRouterAddress,
    swapExactIn,
    isPermit2Required,
    swapExactOut
  } from "$lib/modules/swap-router"
  import { signTypedData } from "viem/actions"
  import { asPublicClient, asWalletClient } from "$lib/utils/clientAdapter"
  import { swapState, SWAP_STATE } from "../state.svelte"
  import { balanceListeners, tokenBalances } from "$lib/modules/balances"

  let isProcessing = $state(false)
  let processingStep = $state("")
  let waiveWithdrawal = $state(false)

  /**
   * Check if the current input amount exceeds the user's balance
   */
  function isAmountExceedsBalance(): boolean {
    const fromCurrency = swapState.data.fromCurrency
    const amountIn = swapState.data.amountIn
    if (!fromCurrency || amountIn === undefined) return false

    const balance = $tokenBalances[fromCurrency.address]
    if (!balance) return false

    return amountIn > balance.balance
  }

  /**
   * Check if output amount is below minimum (1 $RAT)
   * Also returns true if input is so small it rounds to 0
   */
  function isBelowMinimum(): boolean {
    const amountIn = swapState.data.amountIn
    const amountOut = swapState.data.amountOut
    const auctionParams = swapState.data.auctionParams
    if (!auctionParams) return false

    // If input rounds to 0, it's below minimum (user entered something too small)
    if (amountIn === 0n) return true

    // If no output yet, not below minimum
    if (amountOut === undefined) return false

    // If output is 0 or less than 1 $RAT, it's below minimum
    const ratAmount = Number(formatUnits(amountOut, auctionParams.token.decimals))
    return ratAmount < 1
  }

  function withSlippage(amount: bigint, isOut: boolean): bigint {
    // Slippage is in basis points (10000 bps = 100%)
    // TODO could be user-configurable if desired
    // 200 bps = 2%
    const maxSlippageBps: bigint = 200n

    // For amountOut limit minimum slippage
    // For amountIn limit maximum slippage
    return (amount * (10000n + (isOut ? -1n : 1n) * maxSlippageBps)) / 10000n
  }

  /**
   * Check and approve Permit2 if needed, sign permit, and execute swap
   * This can be a three-step process:
   * 1. Approve Permit2 (on-chain, if needed for this currency)
   * 2. Sign permit (offline, no gas)
   * 3. Execute swap (on-chain transaction)
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
      const fromCurrency = swapState.data.fromCurrency

      if (!auctionParams) throw new Error("auction params not initialized")
      if (amountIn === undefined) throw new Error("amountIn is undefined")
      if (amountOut === undefined) throw new Error("amountOut is undefined")

      console.log("[SignAndSwap] Starting swap flow for", fromCurrency.symbol)

      const client = await getDrawbridge().getConnectorClient()
      const adaptedPublicClient = asPublicClient($publicClientStore!)

      // Steps 1 and 2 may be skipped for ETH
      if (isPermit2Required(fromCurrency.address)) {
        // * * * * * * * * * * * * * * * * * * * * * * * * *
        // Step 1: Check and approve Permit2 if needed
        // * * * * * * * * * * * * * * * * * * * * * * * * *
        const needsPermit2Approval = await isPermit2AllowanceRequired(
          adaptedPublicClient,
          $userAddress,
          fromCurrency.address,
          maxUint128
        )

        if (needsPermit2Approval) {
          console.log("[SignAndSwap] Step 1: Approving Permit2...")
          processingStep = "Approving token access..."

          const { receipt } = await permit2AllowMax(
            adaptedPublicClient,
            asWalletClient(client),
            fromCurrency.address
          )

          if (receipt.status !== "success") {
            throw new Error("Permit2 approval failed")
          }
          console.log("[SignAndSwap] Permit2 approved")
        }

        // * * * * * * * * * * * * * * * * * * * * * * * * *
        // Step 2: Sign permit (offline)
        // * * * * * * * * * * * * * * * * * * * * * * * * *
        console.log("[SignAndSwap] Step 2: Signing permit...")
        processingStep = "Sign permit"

        // TODO ensure signTypedData in a less hacky way
        const extendedClient = (client as any).extend((client: any) => ({
          signTypedData: (args: any) => signTypedData(client, args)
        }))

        // For exact out use amountInMaximum (with slippage padding)
        const amountPadded = isExactOut ? withSlippage(amountIn, false) : amountIn
        const result = await signPermit2(
          adaptedPublicClient,
          extendedClient,
          fromCurrency.address,
          deltaRouterAddress,
          amountPadded
        )

        // Update swapState with permit data
        swapState.data.setPermit(result.permit)
        swapState.data.setPermitSignature(result.permitSignature)

        console.log("[SignAndSwap] Permit signed successfully")
      }

      // * * * * * * * * * * * * * * * * * * * * * * * * *
      // Step 2: Execute swap (on-chain)
      // * * * * * * * * * * * * * * * * * * * * * * * * *

      console.log("[SignAndSwap] Step 3: Executing swap...")
      processingStep = "Confirm transaction"

      let txHash: Hex
      if (isExactOut) {
        txHash = await swapExactOut(
          fromCurrency.address,
          auctionParams,
          amountOut,
          withSlippage(amountIn, false),
          swapState.data.permit,
          swapState.data.permitSignature
        )
      } else {
        txHash = await swapExactIn(
          fromCurrency.address,
          auctionParams,
          amountIn,
          withSlippage(amountOut, true),
          swapState.data.permit,
          swapState.data.permitSignature
        )
      }

      // Store txHash in state for basescan link
      swapState.data.setSwapTxHash(txHash)

      const swapResult = await waitForDopplerSwapReceipt(adaptedPublicClient, txHash)
      console.log("[SignAndSwap] Swap executed successfully:", swapResult)

      // Store receipt in state
      swapState.data.setSwapReceipt(swapResult)

      // Reset checkbox for next swap
      waiveWithdrawal = false

      // Transition to swap complete state
      swapState.state.transitionTo(SWAP_STATE.SWAP_COMPLETE)

      // Manually trigger balance updates for relevant tokens
      for (const { listener, currency } of $balanceListeners) {
        if ([auctionParams.token.address, fromCurrency.address].includes(currency.address)) {
          listener.triggerUpdate()
        }
      }
    } catch (error) {
      console.error("[SignAndSwap] Error during swap:", error)
      throw error
    } finally {
      isProcessing = false
      processingStep = ""
    }
  }
</script>

<div class="withdrawal-container">
  <label class="withdrawal-label">
    <Checkbox checked={waiveWithdrawal} onchange={() => (waiveWithdrawal = !waiveWithdrawal)} />
    <span class="withdrawal-text">
      I want immediate delivery and waive my 14-day withdrawal right for this purchase.
    </span>
  </label>
</div>

<div class="button-container">
  <BigButton
    disabled={!swapState.data.amountIn ||
      swapState.data.amountOut === undefined ||
      isProcessing ||
      !waiveWithdrawal ||
      isAmountExceedsBalance() ||
      isBelowMinimum()}
    text={isProcessing ? processingStep || "Processing..." : "Buy $RAT"}
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
    padding: 10px 8px;
    margin-bottom: 10px;
    width: 100%;
  }

  .withdrawal-label {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    cursor: pointer;
    user-select: none;
  }

  .withdrawal-text {
    font-size: var(--font-size-small);
    line-height: 1.2;
    color: white;
    padding-top: 3px;

    @media (max-width: 768px) {
      font-size: var(--font-size-small);
    }
  }

  .button-container {
    width: 100%;
    height: 120px;
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
