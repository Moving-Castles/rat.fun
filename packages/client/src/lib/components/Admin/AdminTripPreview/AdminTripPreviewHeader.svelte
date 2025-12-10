<script lang="ts">
  import type { Hex } from "viem"
  import { derived } from "svelte/store"
  import { getTripMaxValuePerWin, getTripOwnerName } from "$lib/modules/state/utils"
  import { playerIsWhitelisted, entities } from "$lib/modules/state/stores"
  import { lastUpdated } from "$lib/modules/content"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import type { Trip as SanityTrip } from "@sanity-types"
  import AdminTripPreviewPrompt from "./AdminTripPreviewPrompt.svelte"

  let {
    tripId,
    sanityTripContent,
    onAddBalance
  }: {
    tripId: Hex
    sanityTripContent: SanityTrip
    onAddBalance?: () => void
  } = $props()

  // Create a derived store that extracts a shallow copy of the trip
  // This ensures reactivity when any property changes
  const tripStore = derived(entities, $entities => {
    const t = $entities[tripId] as Trip | undefined
    return t ? { ...t } : undefined
  })

  // Use the store value
  let trip = $derived($tripStore)

  let maxValuePerWin = $derived(
    trip ? getTripMaxValuePerWin(trip.tripCreationCost, trip.balance) : undefined
  )

  // Show add balance button if trip is not liquidated, callback is provided, and player is whitelisted
  const showAddBalanceButton = $derived(
    trip && !trip.liquidationBlock && onAddBalance && $playerIsWhitelisted
  )
</script>

{#if trip}
  <div class="trip-preview-header">
    <!-- IMAGE -->
    <!-- svelte-ignore a11y_click_events_have_key_events -->
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    {#key $lastUpdated}
      {#if sanityTripContent?.image?.asset}
        <!-- <img class="background-image" src={backgroundImageUrl} alt={`trip #${trip.index}`} /> -->
      {/if}
    {/key}
    <!-- INFO -->
    <div class="info">
      <!-- INDEX -->
      <div class="row index hide-mobile">
        <div class="label">{UI_STRINGS.trip}</div>
        <div class="value">#{trip.index}</div>
      </div>
      <!-- OWNER -->
      <div class="row hide-mobile">
        <div class="label">{UI_STRINGS.creator}</div>
        <div class="value">{getTripOwnerName(trip)}</div>
      </div>
      <!-- VISIT COUNT -->
      <div class="row visit-count">
        <div class="label">{UI_STRINGS.visits}</div>
        <div class="value">{trip.visitCount}</div>
      </div>
      <!-- KILL COUNT -->
      {#if trip.killCount > 0}
        <div class="row kill-count">
          <div class="label">{UI_STRINGS.kills}</div>
          <div class="value">{trip.killCount}</div>
        </div>
      {/if}
      {#if Number(trip.minRatValueToEnter ?? 0) > 0}
        <div class="row min-rat-value-to-enter">
          <div class="label">{UI_STRINGS.minRatValueToEnter}</div>
          <div class="value">{trip.minRatValueToEnter}</div>
        </div>
      {/if}
      {#if maxValuePerWin && ($maxValuePerWin ?? 0) > 0}
        <div class="row max-value-per-win">
          <div class="label">{UI_STRINGS.maxValuePerWin}</div>
          <div class="value">{$maxValuePerWin}</div>
        </div>
      {/if}
      <!-- BALANCE -->
      {#if !trip.liquidationBlock}
        <div class="row balance" class:depleted={Number(trip.balance) == 0}>
          <div class="label">{UI_STRINGS.balance}</div>
          <div class="value-with-action">
            <span class="value">{trip.balance}</span>
            {#if showAddBalanceButton}
              <button
                class="add-balance-button"
                onclick={onAddBalance}
                title={UI_STRINGS.addBalance}
              >
                + Add {CURRENCY_SYMBOL}
              </button>
            {/if}
          </div>
        </div>
      {/if}
    </div>
    <div class="prompt">
      <div class="prompt-header-mobile">
        @{getTripOwnerName(trip)}
        {UI_STRINGS.trip} #{trip.index}
      </div>
      <AdminTripPreviewPrompt {trip} />
    </div>
  </div>
{/if}

<style lang="scss">
  .trip-preview-header {
    position: relative;
    display: flex;
    flex-direction: column-reverse;
    overflow: hidden;
    height: 100%;

    @media screen and (min-width: 800px) {
      flex-direction: row;
    }

    .prompt {
      width: 100%;
      @media screen and (min-width: 800px) {
        width: 420px;
      }

      .prompt-header-mobile {
        display: flex;
        padding: 4px 10px;
        border-bottom: var(--default-border-style);
        margin-bottom: 10px;
        font-family: var(--special-font-stack);
        @media screen and (min-width: 800px) {
          display: none;
        }
      }
    }

    .info {
      display: flex;
      width: 100%;
      flex-direction: row;
      height: 100%;
      border-bottom: var(--default-border-style);

      @media screen and (min-width: 800px) {
        width: 300px;
        flex-direction: column;
      }

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

        &.hide-mobile {
          display: none;

          @media screen and (min-width: 800px) {
            display: flex;
          }
        }

        .value {
          font-family: var(--special-font-stack);
          font-size: var(--font-size-normal);
        }

        .value-with-action {
          display: flex;
          align-items: center;
          gap: 8px;

          .value {
            font-family: var(--special-font-stack);
            font-size: var(--font-size-normal);
          }
        }

        .add-balance-button {
          background: var(--color-good);
          color: var(--background);
          border: none;
          width: auto;
          height: 24px;
          font-family: var(--special-font-stack);
          font-size: var(--font-size-normal);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0;

          &:hover {
            background: var(--color-grey-light);
            color: var(--background);
          }
        }

        &.index {
          color: var(--color-grey-mid);
        }
      }
    }
  }
</style>
