<script lang="ts">
  import type { Hex } from "viem"
  import { player, ratTotalValue } from "$lib/modules/state/stores"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { goto } from "$app/navigation"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { BigButton } from "$lib/components/Shared"
  import { strings } from "$lib/modules/strings"

  let { tripId, trip, disabled }: { tripId: Hex; trip: Trip; disabled: boolean } = $props()

  let minRatValueToEnter = getTripMinRatValueToEnter(trip.tripCreationCost)

  const onClick = async () => {
    backgroundMusic.stop()
    await goto(`/${tripId}/tripping?enter=true&rat=${$player.currentRat}&t=${Date.now()}`)
  }
</script>

<div class="trip-enter">
  {#if Number($minRatValueToEnter) > Number($ratTotalValue)}
    <BigButton
      disabled={true}
      text={strings.minRatValueWarning(Number($minRatValueToEnter))}
      onclick={onClick}
    />
  {:else}
    <BigButton {disabled} text={strings.sendRatToTrip} onclick={onClick} />
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
