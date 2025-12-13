import { AuctionParams, getPoolKey, Permit2PermitData } from "doppler"
import { Client, Hex, maxUint128, zeroAddress } from "viem"
import { simulateContract } from "viem/actions"
import { getDrawbridge } from "$lib/modules/drawbridge"
import { deltaRouterAddress, wethCurrency, getAerodromePath } from "./currency"
import { ActionConstants, V4ActionType, V4DeltaActionBuilder } from "./V4DeltaActionBuilder"
import { deltaRouterAbi } from "./deltaRouterAbi"

// DEBUG: Set to true to simulate swap before sending to wallet
const DEBUG_SIMULATE_SWAP = true

export async function swapExactIn(
  fromCurrencyAddress: Hex,
  auctionParams: AuctionParams,
  amountIn: bigint,
  amountOutMinimum: bigint,
  permit?: Permit2PermitData,
  permitSignature?: Hex
) {
  const client = await getDrawbridge().getConnectorClient()

  let value = 0n
  const actionBuilder = new V4DeltaActionBuilder()

  if (fromCurrencyAddress === wethCurrency.address) {
    // ETH swap needs value and wrap to WETH
    value = amountIn
    actionBuilder.addAction(V4ActionType.WRAP, [ActionConstants.CONTRACT_BALANCE])
  } else {
    // ERC20 swap needs permit2 and transfer from user to router
    // (so that delta router can approve its tokens for aerodrome router before calling it)
    if (!permit || !permitSignature)
      throw new Error("Permit2 data and signature required for token swap")

    actionBuilder
      .addAction(V4ActionType.PERMIT2_PERMIT, [permit, permitSignature])
      .addAction(V4ActionType.PERMIT2_TRANSFER_FROM, [
        fromCurrencyAddress,
        ActionConstants.ADDRESS_THIS,
        amountIn
      ])
  }

  actionBuilder
    .addAction(V4ActionType.AERODROME_SWAP_EXACT_IN, [
      {
        path: getAerodromePath(fromCurrencyAddress, false),
        amountIn,
        amountOutMinimum: 0n
      }
    ])
    .addAction(V4ActionType.SWAP_EXACT_IN_SINGLE, [
      {
        poolKey: getPoolKey(auctionParams),
        zeroForOne: !auctionParams.isToken0,
        amountIn: ActionConstants.SWAP_CONTRACT_BALANCE,
        amountOutMinimum,
        hookData: "0x"
      }
    ])
    // payerIsUser = false because router is paying the delta with funds from aerodrome swap
    .addAction(V4ActionType.SETTLE, [
      auctionParams.numeraire.address,
      ActionConstants.OPEN_DELTA,
      false
    ])
    .addAction(V4ActionType.TAKE_ALL, [auctionParams.token.address, 0n])

  const args = actionBuilder.buildExecuteArgs()

  // DEBUG: Simulate first to get revert reason
  if (DEBUG_SIMULATE_SWAP) {
    try {
      console.log("[swapExactIn] Simulating swap...")
      await simulateContract(client as Client, {
        address: deltaRouterAddress,
        abi: deltaRouterAbi,
        functionName: "execute",
        args,
        value
      })
      console.log("[swapExactIn] Simulation successful")
    } catch (e) {
      console.error("[swapExactIn] Simulation failed:", e)
      throw e // Re-throw so the UI shows the error
    }
  }

  // Execute swap
  return await client.writeContract({
    address: deltaRouterAddress,
    abi: deltaRouterAbi,
    functionName: "execute",
    args,
    value
  })
}

export async function swapExactOut(
  fromCurrencyAddress: Hex,
  auctionParams: AuctionParams,
  amountOut: bigint,
  amountInMaximum: bigint,
  permit?: Permit2PermitData,
  permitSignature?: Hex
) {
  const client = await getDrawbridge().getConnectorClient()

  let value = 0n
  const actionBuilder = new V4DeltaActionBuilder()

  if (fromCurrencyAddress === wethCurrency.address) {
    // ETH swap needs value and wrap to WETH
    value = amountInMaximum
    actionBuilder.addAction(V4ActionType.WRAP, [ActionConstants.CONTRACT_BALANCE])
  } else {
    // ERC20 swap needs permit2 and transfer from user to router
    // (so that delta router can approve its tokens for aerodrome router before calling it)
    if (!permit || !permitSignature)
      throw new Error("Permit2 data and signature required for token swap")

    actionBuilder
      .addAction(V4ActionType.PERMIT2_PERMIT, [permit, permitSignature])
      .addAction(V4ActionType.PERMIT2_TRANSFER_FROM, [
        fromCurrencyAddress,
        ActionConstants.ADDRESS_THIS,
        amountInMaximum
      ])
  }

  actionBuilder
    .addAction(V4ActionType.SWAP_EXACT_OUT_SINGLE, [
      {
        poolKey: getPoolKey(auctionParams),
        zeroForOne: !auctionParams.isToken0,
        amountOut,
        amountInMaximum: maxUint128,
        hookData: "0x"
      }
    ])
    .addAction(V4ActionType.AERODROME_SWAP_EXACT_OUT, [
      {
        path: getAerodromePath(fromCurrencyAddress, true),
        amountOut: ActionConstants.OPEN_DELTA,
        amountInMaximum
      }
    ])
    // payerIsUser = false because router is paying the delta with funds from aerodrome swap
    .addAction(V4ActionType.SETTLE, [
      auctionParams.numeraire.address,
      ActionConstants.OPEN_DELTA,
      false
    ])
    .addAction(V4ActionType.TAKE_ALL, [auctionParams.token.address, 0n])

  if (fromCurrencyAddress === wethCurrency.address) {
    // Unwrap WETH and return excess ETH to user (ETH is zeroAddress)
    actionBuilder.addAction(V4ActionType.UNWRAP, [ActionConstants.CONTRACT_BALANCE])
    actionBuilder.addAction(V4ActionType.SWEEP, [zeroAddress, ActionConstants.MSG_SENDER])
  } else {
    // Return excess ERC20 to user
    actionBuilder.addAction(V4ActionType.SWEEP, [fromCurrencyAddress, ActionConstants.MSG_SENDER])
  }

  // Execute swap
  return await client.writeContract({
    address: deltaRouterAddress,
    abi: deltaRouterAbi,
    functionName: "execute",
    args: actionBuilder.buildExecuteArgs(),
    value
  })
}
