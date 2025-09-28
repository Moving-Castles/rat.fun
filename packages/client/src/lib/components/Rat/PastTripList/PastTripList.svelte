<script lang="ts">
  import { transitionTo, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { staticContent } from "$lib/modules/content"
  import { player, playerId, rat } from "$lib/modules/state/stores"

  import PastTripListItem from "./PastTripListItem.svelte"

  let pastTrips = $derived(
    $staticContent.outcomes
      .filter(
        o => o.ratId == $player.currentRat && $rat.name == o.ratName && o.playerId == $playerId
      )
      .sort((a, b) => {
        return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
      })
  )

  $inspect(pastTrips)
</script>

<div class="past-trip-list">
  <button class="back-button" onclick={() => transitionTo(RAT_BOX_STATE.HAS_RAT)}>
    <div>Back</div>
  </button>
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

    .back-button {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-grey-light);
      outline: none;
      border: none;
      border-bottom: 1px solid var(--color-grey-mid);
      padding: 0 12px;
      height: 60px;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-normal);
      text-transform: uppercase;
      background: var(--background-semi-transparent);
      flex-shrink: 0;

      &:hover {
        color: var(--white);
      }
    }

    .past-trip-list-container {
      width: 100%;
      height: 100%;
    }
  }
</style>
