<script lang="ts">
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { staticContent } from "$lib/modules/content"
  import { player, playerId } from "$lib/modules/state/stores"

  let pastTrips = $derived(
    $staticContent.outcomes.filter(o => o.ratId == $player.currentRat && o.playerId == $playerId)
  )
</script>

<div class="past-trip-list">
  <button class="back-button" onclick={() => transitionTo(RAT_BOX_STATE.HAS_RAT)}> Go Back </button>
  <div class="past-trip-list-container">
    {#each pastTrips as trip}
      <div class="past-trip-item">
        <div class="past-trip-item-header">
          <a href="/tripopedia/{trip._id}">{trip._id}</a>
        </div>
      </div>
    {/each}
  </div>
</div>

<style lang="scss">
</style>
