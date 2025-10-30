<script lang="ts">
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { staticContent } from "$lib/modules/content"
  import { player, playerId, rat } from "$lib/modules/state/stores"

  import PastTripListItem from "./PastTripListItem.svelte"
  import { BackButton } from "$lib/components/Shared"

  

  let pastTrips = $derived(
    $staticContent.outcomes
      .filter(
        o => o.ratId == $player.currentRat && $rat.name == o.ratName && o.playerId == $playerId
      )
      .sort((a, b) => {
        return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
      })
  )

  const onBackButtonClick = () => {
    ratState.state.transitionTo(RAT_BOX_STATE.HAS_RAT)
  }
</script>

<div class="past-trip-list">
  <div class="back-button-container">
    <BackButton onclick={onBackButtonClick} />
  </div>
  <div class="past-trip-list-container">
    {#each pastTrips as trip}
      <PastTripListItem {trip} />
    {/each}
  </div>
</div>

<style lang="scss">
  .past-trip-list {
    width: 100%;
    background-image: url("/images/texture-2.png");
    .back-button-container {
      display: block;
      border-bottom: 1px solid var(--color-grey-mid);
      position: sticky;
      height: 60px;
      top: 0;
      z-index: 10;
    }

    .past-trip-list-container {
      width: 100%;
      height: 100%;
    }
  }
</style>
