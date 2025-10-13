<script lang="ts">
  import { getTripMaxValuePerWin, getTripOwnerName } from "$lib/modules/state/utils"
  import { lastUpdated } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { NoImage } from "$lib/components/Shared"

  let { trip, sanityTripContent }: { trip: Trip; sanityTripContent: any } = $props()

  const maxValuePerWin = getTripMaxValuePerWin(trip.tripCreationCost, trip.balance)
</script>

<div class="trip-preview-header">
  <!-- IMAGE -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="image">
    {#key $lastUpdated}
      {#if sanityTripContent?.image?.asset}
        <img
          src={urlFor(sanityTripContent?.image)?.width?.(600)?.height(600)?.url() ?? ""}
          alt={`trip #${trip.index}`}
        />
      {:else}
        <div class="image-placeholder">
          <NoImage />
        </div>
      {/if}
    {/key}
  </div>
  <!-- INFO -->
  <div class="info">
    <!-- INDEX -->
    <div class="row index">
      <div class="label">TRIP</div>
      <div class="value">#{trip.index}</div>
    </div>
    <!-- OWNER -->
    <div class="row">
      <div class="label">Creator</div>
      <div class="value">{getTripOwnerName(trip)}</div>
    </div>
    <!-- VISIT COUNT -->
    <!-- <div class="row visit-count">
      <div class="label">VISITS</div>
      <div class="value">{trip.visitCount}</div>
    </div> -->
    <!-- KILL COUNT -->
    <!-- {#if trip?.killCount > 0}
      <div class="row kill-count">
        <div class="label">KILLS</div>
        <div class="value">{trip?.killCount}</div>
      </div>
    {/if} -->
    <!-- {#if trip?.minRatValueToEnter > 0}
      <div class="row min-rat-value-to-enter">
        <div class="label">MIN RAT VALUE TO ENTER</div>
        <div class="value">${trip?.minRatValueToEnter}</div>
      </div>
    {/if} -->
    {#if $maxValuePerWin > 0}
      <div class="row max-value-per-win">
        <div class="label">MAX VALUE PER WIN</div>
        <div class="value">${$maxValuePerWin}</div>
      </div>
    {/if}
    <!-- BALANCE -->
    <!-- <div class="row balance" class:depleted={Number(trip.balance) == 0}>
      <div class="label">BALANCE</div>
      <div class="value">${trip.balance}</div>
    </div> -->
  </div>
</div>

<style lang="scss">
  .trip-preview-header {
    border-bottom: var(--default-border-style);
    display: flex;
    flex-direction: row;
    background: var(--background);
    height: 200px;

    .image {
      line-height: 0;
      cursor: pointer;
      height: 100%;
      flex-shrink: 0;

      img {
        height: 100%;
        width: auto;
        object-fit: contain;
        mix-blend-mode: screen;
      }

      .image-placeholder {
        height: 100%;
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
      }
    }

    .info {
      display: flex;
      flex-direction: column;
      flex: 1;

      .row {
        width: 100%;
        border-bottom: var(--default-border-style);
        height: 40px;
        padding-left: 5px;
        padding-right: 10px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-small);

        .value {
          font-family: var(--special-font-stack);
          font-size: var(--font-size-normal);
        }

        &.index {
          color: var(--color-grey-mid);
        }
      }
    }
  }
</style>
