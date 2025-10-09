<script lang="ts">
  import { getTripMaxValuePerWin, getTripOwnerName } from "$lib/modules/state/utils"
  import { lastUpdated } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { getModalState } from "$lib/components/Shared/Modal/state.svelte"
  import { NoImage, ModalTarget } from "$lib/components/Shared"
  import { TripPreviewPrompt } from "$lib/components/Trip"

  let { trip, sanityTripContent }: { trip: Trip; sanityTripContent: any } = $props()
  let { modal } = getModalState()
  let showImageModal = $state(false)

  let maxValuePerWin = getTripMaxValuePerWin(trip.tripCreationCost, trip.balance)
</script>

<div class="trip-preview-header">
  <!-- IMAGE -->
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="image" onclick={() => (showImageModal = true)}>
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
    <div class="row visit-count">
      <div class="label">VISITS</div>
      <div class="value">{trip.visitCount}</div>
    </div>
    <!-- KILL COUNT -->
    {#if trip?.killCount > 0}
      <div class="row kill-count">
        <div class="label">KILLS</div>
        <div class="value">{trip?.killCount}</div>
      </div>
    {/if}
    {#if trip?.minRatValueToEnter > 0}
      <div class="row min-rat-value-to-enter">
        <div class="label">MIN RAT VALUE TO ENTER</div>
        <div class="value">${trip?.minRatValueToEnter}</div>
      </div>
    {/if}
    {#if $maxValuePerWin > 0}
      <div class="row max-value-per-win">
        <div class="label">MAX VALUE PER WIN</div>
        <div class="value">${$maxValuePerWin}</div>
      </div>
    {/if}
    <!-- BALANCE -->
    {#if !trip.liquidationBlock}
      <div class="row balance" class:depleted={Number(trip.balance) == 0}>
        <div class="label">BALANCE</div>
        <div class="value">${trip.balance}</div>
      </div>
    {/if}
  </div>
  <div class="prompt">
    <TripPreviewPrompt {trip} />
  </div>
</div>

{#snippet tripImageModal()}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div class="image-modal" onclick={() => modal.close()}>
    {#if sanityTripContent?.image?.asset}
      <img
        src={urlFor(sanityTripContent?.image).width(1200).auto("format").url()}
        alt="trip #{trip.index}"
      />
    {/if}
  </div>
{/snippet}

{#if showImageModal && sanityTripContent}
  <ModalTarget
    fullscreen={true}
    onclose={() => (showImageModal = false)}
    content={tripImageModal}
  />
{/if}

<style lang="scss">
  .trip-preview-header {
    border-bottom: var(--default-border-style);
    display: flex;
    flex-direction: row;
    background: var(--background);

    .image {
      aspect-ratio: 1/1;
      width: 50%;
      line-height: 0;
      cursor: pointer;

      img {
        width: 100%;
        aspect-ratio: 1/1;
        object-fit: contain;
        filter: grayscale(100%);
        mix-blend-mode: screen;
      }

      .image-placeholder {
        width: 100%;
        aspect-ratio: 1/1;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 15px;
      }
    }

    .prompt {
      width: 420px;
      // aspect-ratio: 3 /4;
      // height: 100%;
    }

    .info {
      display: flex;
      flex-direction: column;
      width: 50%;

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

        // &.balance {
        //   background: var(--color-value);
        //   color: var(--background);
        //   padding: 5px;
        //   height: auto;
        //   flex: 1;
        //   display: flex;
        //   flex-direction: column;
        //   align-items: center;
        //   justify-content: center;

        //   &.depleted {
        //     background: var(--color-death);
        //     color: var(--background);
        //   }

        //   .value {
        //     font-size: var(--font-size-normal);
        //   }
        // }

        &.index {
          color: var(--color-grey-mid);
        }
      }
    }
  }

  .image-modal {
    width: var(--game-window-width);
    height: var(--game-window-height);
    display: flex;
    justify-content: center;
    align-items: center;
    cursor: pointer;

    img {
      max-width: 90%;
      max-height: 90%;
      object-fit: contain;
      border: var(--default-border-style);
      transition: opacity 0.2s ease;
    }
  }
</style>
