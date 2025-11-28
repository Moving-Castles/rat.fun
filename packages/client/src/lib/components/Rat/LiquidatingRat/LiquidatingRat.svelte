<script lang="ts">
  import { onMount } from "svelte"
  import { sendLiquidateRat } from "$lib/modules/action-manager/index.svelte"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { erc20BalanceListenerActive } from "$lib/modules/erc20Listener/stores"
  import { refetchBalance } from "$lib/modules/erc20Listener"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"

  import { SmallSpinner, RatAvatar } from "$lib/components/Shared"
  import { selectedFolderId } from "$lib/modules/ui/state.svelte"

  onMount(async () => {
    // playSound("ratfunUI", "ratDeath")

    // Pause erc20 balance listener so we can control the update
    erc20BalanceListenerActive.set(false)

    // Send liquidation transaction
    await sendLiquidateRat()

    // Update balance after liquidation
    await refetchBalance()

    // Reset folder selection
    selectedFolderId.set("")

    // Resume erc20 balance listener
    erc20BalanceListenerActive.set(true)

    // RAT_BOX_STATE.LIQUIDATING_RAT -> RAT_BOX_STATE.DEAD_RAT
    ratState.state.transitionTo(RAT_BOX_STATE.NO_RAT)
  })
</script>

<div class="liquidating-rat">
  <div class="avatar">
    <RatAvatar grayscale animation="dead" />
  </div>
  <div class="loading">{UI_STRINGS.killInProgress} <SmallSpinner soundOn /></div>
</div>

<style lang="scss">
  .liquidating-rat {
    display: flex;
    flex-flow: column nowrap;
    justify-content: center;
    align-items: center;
    background-image: url("/images/texture-2.png");
    height: 100%;
    width: 100%;
    position: relative;

    .loading {
      background: black;
      padding: 10px;
    }
  }
</style>
