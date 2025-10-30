<script lang="ts">
  import { staticContent } from "$lib/modules/content"
  import { getRatState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"

  import { BackButton } from "$lib/components/Shared"
  import { FlashbackEntry } from "$lib/components/Flashback"

  let ratState = getRatState()

  let { outcomeId }: { outcomeId: string } = $props()

  let result = $derived($staticContent.outcomes.find(o => o._id == outcomeId))
  let trip = $derived($staticContent.trips.find(r => r._id == result?.tripId))

  const onBackButtonClick = () => {
    ratState.state.transitionTo(RAT_BOX_STATE.PAST_TRIP_LIST)
  }
</script>

<div class="past-trip-entry">
  <div class="back-button-container">
    <BackButton onclick={onBackButtonClick} />
  </div>
  <FlashbackEntry {trip} {result} />
</div>

<style lang="scss">
  .back-button-container {
    display: block;
    border-bottom: 1px solid var(--color-grey-mid);
    position: sticky;
    height: 60px;
    top: 0;
    z-index: 10;
  }
</style>
