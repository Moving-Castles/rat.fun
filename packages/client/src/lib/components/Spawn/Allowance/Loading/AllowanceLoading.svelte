<script lang="ts">
  import { onMount } from "svelte"
  import { fade } from "svelte/transition"
  import { get } from "svelte/store"
  import { spawnState, SPAWN_STATE, determineNextState } from "$lib/components/Spawn/state.svelte"
  import { buildFlowContextSync } from "$lib/components/Spawn/flowContext"
  import { SmallSpinner } from "$lib/components/Shared"
  import { errorHandler } from "$lib/modules/error-handling"
  import { approveMax } from "$lib/modules/on-chain-transactions"
  import { externalAddressesConfig } from "$lib/modules/state/stores"
  import { userAddress } from "$lib/modules/drawbridge"
  import { publicNetwork } from "$lib/modules/network"
  import { readPlayerERC20Allowance } from "$lib/modules/erc20Listener"
  import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
  import type { Hex } from "viem"

  let error = $state<string | null>(null)

  const loadingText = "Rewiring in process"

  /**
   * Wait for externalAddressesConfig to be populated from chain sync
   */
  async function waitForAddresses(): Promise<{ gamePoolAddress: string; erc20Address: string }> {
    const maxWaitMs = 10000
    const checkIntervalMs = 100
    let waited = 0

    while (waited < maxWaitMs) {
      const addresses = get(externalAddressesConfig)
      if (addresses?.gamePoolAddress && addresses?.erc20Address) {
        return addresses as { gamePoolAddress: string; erc20Address: string }
      }
      await new Promise(resolve => setTimeout(resolve, checkIntervalMs))
      waited += checkIntervalMs
    }

    throw new Error("Timed out waiting for game pool address")
  }

  async function executeApproval() {
    console.log("[AllowanceLoading] Starting max allowance approval")

    try {
      const addresses = await waitForAddresses()

      await approveMax(addresses.gamePoolAddress)
      console.log("[AllowanceLoading] Approval transaction complete")

      // Explicitly update the allowance store since playerAddress may not be set yet
      // during the spawn flow (refetchAllowance in executeTransaction may have failed silently)
      const walletAddress = get(userAddress)
      if (walletAddress) {
        try {
          const allowance = await readPlayerERC20Allowance(
            get(publicNetwork),
            walletAddress as Hex,
            addresses.gamePoolAddress as Hex,
            addresses.erc20Address as Hex
          )
          playerERC20Allowance.set(allowance)
          console.log("[AllowanceLoading] Updated allowance store:", allowance)
        } catch (e) {
          console.warn("[AllowanceLoading] Failed to update allowance store:", e)
        }
      }

      // After approval, allowance is now true - determine next state
      const context = buildFlowContextSync(true) // hasAllowance = true after approval
      const nextState = determineNextState(context)

      console.log("[AllowanceLoading] Flow context:", context)
      console.log("[AllowanceLoading] Next state:", nextState)

      spawnState.state.transitionTo(nextState)
    } catch (err) {
      console.error("[AllowanceLoading] Approval failed:", err)
      error = err instanceof Error ? err.message : "Approval failed"

      // Send to Sentry and show user-friendly toast
      errorHandler(err, "Approval failed")

      // Wait a moment to show error, then go back to allowance screen
      setTimeout(() => {
        spawnState.state.transitionTo(SPAWN_STATE.ALLOWANCE)
      }, 2000)
    }
  }

  onMount(() => {
    console.log("[AllowanceLoading] Component mounted")
    executeApproval()
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    {#if error}
      <div class="message error" in:fade={{ duration: 200 }}>
        {error}
      </div>
    {:else}
      <div class="message" in:fade={{ duration: 200 }}>
        {loadingText}
        <SmallSpinner soundOn />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: var(--background);

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;
      max-width: 90dvw;

      .message {
        font-size: var(--font-size-large);
        font-family: var(--special-font-stack);
        background: var(--background);
        color: var(--foreground);
        padding: 20px;
        text-align: center;

        &.error {
          background: orangered;
          color: var(--background);
        }
      }
    }
  }
</style>
