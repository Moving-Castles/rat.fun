<script lang="ts">
  import type { Hex } from "viem"
  import { player, ratTotalValue } from "$lib/modules/state/stores"
  import { getTripMinRatValueToEnter } from "$lib/modules/state/utils"
  import { goto } from "$app/navigation"
  import { BigButton } from "$lib/components/Shared"

  let { tripId, trip, disabled }: { tripId: Hex; trip: Trip; disabled: boolean } = $props()

  let minRatValueToEnter = getTripMinRatValueToEnter(trip.tripCreationCost)

  const onClick = async () => {
    await goto(`/${tripId}/tripping?enter=true&rat=${$player.currentRat}&t=${Date.now()}`)
  }
</script>

<div class="trip-enter">
  {#if Number($minRatValueToEnter) > Number($ratTotalValue)}
    <BigButton
      disabled={true}
      text={`Rat value too low (at least ${Number($minRatValueToEnter)})`}
      onclick={onClick}
    />
  {/if}
  <BigButton id="send_rat" {disabled} text="Send rat to trip" onclick={onClick} />
</div>

<style>
  .trip-enter {
    display: block;
    height: 100%;
    padding: 5px;
    width: 100%;
  }
</style>
