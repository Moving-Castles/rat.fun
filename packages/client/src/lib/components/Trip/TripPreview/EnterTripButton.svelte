<script lang="ts">
  import type { Hex } from "viem"
  import { player, ratTotalValue } from "$lib/modules/state/stores"
  import { playerERC20Allowance } from "$lib/modules/erc20Listener/stores"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { goto } from "$app/navigation"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { BigButton } from "$lib/components/Shared"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { openAllowanceModal } from "$lib/modules/ui/allowance-modal.svelte"

  let { tripId, trip, disabled }: { tripId: Hex; trip: Trip; disabled: boolean } = $props()

  let minRatValueToEnter = getTripMinRatValueToEnter(trip.tripCreationCost)

  // Check if user has enough allowance to enter the trip
  // Trip entry costs rat's value, so we check against rat total value
  const hasEnoughAllowance = $derived($playerERC20Allowance >= Number($ratTotalValue))

  const onClick = async () => {
    // Check allowance before proceeding
    if (!hasEnoughAllowance) {
      openAllowanceModal(UI_STRINGS.insufficientAllowance)
      return
    }

    backgroundMusic.stop()
    await goto(`/${tripId}/tripping?enter=true&rat=${$player.currentRat}&t=${Date.now()}`)
  }
</script>

<div class="trip-enter">
  {#if Number($minRatValueToEnter) > Number($ratTotalValue)}
    <BigButton
      disabled={true}
      text={UI_STRINGS.minRatValueWarning(Number($minRatValueToEnter))}
      onclick={onClick}
    />
  {:else}
    <BigButton {disabled} text={UI_STRINGS.sendRatToTrip} onclick={onClick} />
  {/if}
</div>

<style>
  .trip-enter {
    display: block;
    height: 100%;
    padding: 5px;
    width: 100%;
  }
</style>
