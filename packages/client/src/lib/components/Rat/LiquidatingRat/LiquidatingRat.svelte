<script lang="ts">
  import { onMount } from "svelte"
  import { player, shouldUnlockAdmin, showAdminUnlockModal } from "$lib/modules/state/stores"
  import { sendLiquidateRat } from "$lib/modules/action-manager/index.svelte"
  import { sendLiquidateRatMessage } from "$lib/modules/off-chain-sync"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { erc20BalanceListenerActive } from "$lib/modules/erc20Listener/stores"
  import { refetchBalance } from "$lib/modules/erc20Listener"
  import { get } from "svelte/store"

  import { SmallSpinner } from "$lib/components/Shared"

  onMount(async () => {
    // playSound("ratfunUI", "ratDeath")

    // Pause erc20 balance listener so we can control the update
    erc20BalanceListenerActive.set(false)

    // Send liquidation transaction
    await sendLiquidateRat()

    // Send off-chain liquidation message
    sendLiquidateRatMessage($player?.currentRat ?? "")

    // Update balance after liquidation
    await refetchBalance()

    // Resume erc20 balance listener
    erc20BalanceListenerActive.set(true)

    // RAT_BOX_STATE.LIQUIDATING_RAT -> RAT_BOX_STATE.DEAD_RAT
    ratState.state.transitionTo(RAT_BOX_STATE.DEAD_RAT)

    // Check if admin should be unlocked
    if ($shouldUnlockAdmin) {
      showAdminUnlockModal.set(true)
    }
  })
</script>

<div class="liquidating-rat">
  <div class="loading">KILLING IN PROGRESS <SmallSpinner soundOn /></div>
</div>

<style lang="scss">
  .liquidating-rat {
    display: flex;
    justify-content: center;
    align-items: center;
    background-image: url("/images/texture-2.png");
    height: 100%;
    width: 100%;

    .loading {
      background: orangered;
      padding: 10px;
    }
  }
</style>
