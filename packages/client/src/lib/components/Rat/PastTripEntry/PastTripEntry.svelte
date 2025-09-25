<script lang="ts">
  import { staticContent } from "$lib/modules/content"
  import { TripopediaEntry } from "$lib/components/Tripopedia"
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  let { outcomeId }: { outcomeId: string } = $props()

  let result = $derived($staticContent.outcomes.find(o => o._id == outcomeId))
  let room = $derived($staticContent.rooms.find(r => r._id == result?.roomId))
</script>

<div class="past-trip-entry">
  <button class="back-button" onclick={() => transitionTo(RAT_BOX_STATE.PAST_TRIP_LIST)}>
    Go Back
  </button>
  <TripopediaEntry {room} {result} />
</div>

<style lang="scss">
</style>
