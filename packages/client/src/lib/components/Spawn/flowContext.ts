/**
 * ========================================
 *  Spawn/flowContext.ts
 * ========================================
 * Helper functions to build FlowContext for state transitions.
 * This module provides utilities to check the current state of
 * wallet connection, session, allowance, and spawn status.
 */

import { get } from "svelte/store"
import type { FlowContext } from "./state.svelte"
import { publicNetwork } from "$lib/modules/network"
import { getDrawbridge, isDrawbridgeInitialized } from "$lib/modules/drawbridge"
import { externalAddressesConfig } from "$lib/modules/state/stores"
import { readPlayerERC20Allowance } from "$lib/modules/erc20Listener"
import { checkIsSpawned } from "$lib/initWalletNetwork"

const ALLOWANCE_THRESHOLD = 100

/**
 * Check if user has sufficient allowance (> 100 tokens)
 * Returns false if unable to check (no wallet, no addresses configured)
 */
export async function checkHasAllowance(walletAddress: string): Promise<boolean> {
  const addresses = get(externalAddressesConfig)
  if (!addresses?.erc20Address || !addresses?.gamePoolAddress) {
    console.log("[FlowContext] Cannot check allowance: external addresses not configured")
    return false
  }

  try {
    const allowance = await readPlayerERC20Allowance(
      get(publicNetwork),
      walletAddress as `0x${string}`,
      addresses.gamePoolAddress,
      addresses.erc20Address
    )
    console.log("[FlowContext] Current allowance:", allowance)
    return allowance > ALLOWANCE_THRESHOLD
  } catch (err) {
    console.error("[FlowContext] Failed to check allowance:", err)
    return false
  }
}

/**
 * Build the current flow context for state transitions.
 * This checks all conditions needed to determine the next state.
 *
 * NOTE: Reads directly from drawbridge.getState() instead of svelte stores
 * to avoid race conditions where stores haven't synced yet.
 *
 * @returns FlowContext with current wallet, session, allowance, and spawn status
 */
export async function buildFlowContext(): Promise<FlowContext> {
  if (!isDrawbridgeInitialized()) {
    console.log("[FlowContext] Drawbridge not initialized")
    return {
      walletConnected: false,
      sessionReady: false,
      hasAllowance: false,
      isSpawned: false
    }
  }

  const state = getDrawbridge().getState()
  const walletConnected = !!state.userAddress
  const sessionReady = state.isReady
  const walletAddress = state.userAddress

  console.log("[FlowContext] Drawbridge raw values:", {
    walletConnected,
    sessionReady,
    walletAddress
  })

  if (!walletConnected || !walletAddress) {
    console.log("[FlowContext] Drawbridge: No wallet connected")
    return {
      walletConnected: false,
      sessionReady: false,
      hasAllowance: false,
      isSpawned: false
    }
  }

  const hasAllowance = await checkHasAllowance(walletAddress)

  // Debug: check isSpawned with detailed logging
  console.log("[FlowContext] Checking isSpawned for:", walletAddress)
  const isSpawned = checkIsSpawned(walletAddress as `0x${string}`)
  console.log("[FlowContext] isSpawned result:", isSpawned)

  console.log("[FlowContext] Drawbridge context:", {
    walletConnected: true,
    sessionReady,
    hasAllowance,
    isSpawned
  })

  return {
    walletConnected: true,
    sessionReady,
    hasAllowance,
    isSpawned
  }
}

/**
 * Build flow context synchronously (without allowance check).
 * Useful when allowance is already known or for quick checks.
 *
 * NOTE: Reads directly from drawbridge.getState() instead of svelte stores
 * to avoid race conditions where stores haven't synced yet.
 */
export function buildFlowContextSync(hasAllowance: boolean): FlowContext {
  if (!isDrawbridgeInitialized()) {
    return {
      walletConnected: false,
      sessionReady: false,
      hasAllowance: false,
      isSpawned: false
    }
  }

  const state = getDrawbridge().getState()
  const walletConnected = !!state.userAddress
  const sessionReady = state.isReady
  const walletAddress = state.userAddress
  const isSpawned = walletAddress ? checkIsSpawned(walletAddress as `0x${string}`) : false

  return {
    walletConnected,
    sessionReady,
    hasAllowance,
    isSpawned
  }
}
