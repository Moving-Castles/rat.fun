<script lang="ts">
  import type { Hex } from "viem"
  import {
    getTripMaxValuePerWin,
    getTripMinRatValueToEnter,
    getTripOwnerName
  } from "$lib/modules/state/utils"
  import { currentBlockNumber } from "$lib/modules/state/stores"
  import { CHALLENGE_ACTIVE_PERIOD_BLOCKS } from "$lib/modules/state/constants"
  import { isPhone } from "$lib/modules/ui/state.svelte"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { formatCountdown } from "@ratfun/shared-utils"

  // Block time on Base in milliseconds
  const BLOCK_TIME_MS = 2000

  let { trip, tripId }: { trip: Trip; tripId?: Hex } = $props()

  // svelte-ignore state_referenced_locally
  const maxValuePerWin = getTripMaxValuePerWin(
    trip.tripCreationCost,
    trip.balance,
    trip.challengeTrip,
    trip.overrideMaxValuePerWinPercentage
  )
  // svelte-ignore state_referenced_locally
  const minRatValueToEnter = getTripMinRatValueToEnter(
    trip.tripCreationCost,
    trip.challengeTrip,
    trip.fixedMinValueToEnter
  )

  // Calculate expiration block for active challenge based on creation block
  let expirationBlock = $derived(
    trip.creationBlock ? Number(trip.creationBlock) + CHALLENGE_ACTIVE_PERIOD_BLOCKS : 0
  )

  // Calculate blocks remaining until expiration
  let blocksRemaining = $derived.by(() => {
    if (!expirationBlock || !$currentBlockNumber) return 0
    return Math.max(0, expirationBlock - $currentBlockNumber)
  })

  // Calculate time remaining in milliseconds
  let timeRemainingMs = $derived(blocksRemaining * BLOCK_TIME_MS)

  // Countdown text derived from time remaining
  let countdownText = $derived.by(() => {
    if (timeRemainingMs <= 0) return ""
    return formatCountdown(timeRemainingMs)
  })

  // Data rows configuration with reactivity
  let infoRows = $derived([
    {
      label: UI_STRINGS.creator.toUpperCase(),
      value: getTripOwnerName(trip),
      hideOnPhone: false
    },
    ...(countdownText
      ? [
          {
            label: "TIME REMAINING",
            value: countdownText,
            className: "countdown"
          }
        ]
      : []),
    {
      label: "ATTEMPTS",
      value: `${String(trip.visitCount)}`,
      className: "visit-count"
    },

    {
      label: UI_STRINGS.minRatValueToEnter.toUpperCase(),
      value: `${$minRatValueToEnter ?? 0} ${CURRENCY_SYMBOL}`,
      className: "min-rat-value-to-enter",
      hideOnPhone: true
    },
    ...($maxValuePerWin > 0
      ? [
          {
            label: UI_STRINGS.maxValuePerWin.toUpperCase(),
            value: `${$maxValuePerWin} ${CURRENCY_SYMBOL}`,
            className: "max-value-per-win"
          }
        ]
      : [])
  ])
</script>

<div class="trip-preview-header">
  <!-- INFO -->
  <div class="info">
    {#each infoRows as row}
      {#if !$isPhone || !row.hideOnPhone}
        <div class="row {row.className || ''}">
          <div class="label">{row.label}</div>
          <div class="value">{row.value}</div>
        </div>
      {/if}
    {/each}
  </div>
</div>

<style lang="scss">
  .trip-preview-header {
    position: relative;
    display: flex;
    flex-direction: row;
    background: var(--color-restricted-trip-folder);

    &::before {
      content: "";
      position: absolute;
      inset: 0;
      background-image: url("/images/tot2.png");
      background-repeat: no-repeat;
      background-size: 100% 100%;
      opacity: 0.3;
      z-index: 0;
    }

    @media (max-width: 800px) {
      flex-direction: column;
      height: auto;
    }

    .info {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      flex: 1;

      @media (max-width: 800px) {
        order: 1;
        width: 100%;
      }

      .row {
        width: 100%;
        border-bottom: 1px solid var(--color-grey-dark);
        height: 40px;
        padding-left: 20px;
        padding-right: 20px;
        display: flex;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        font-size: var(--font-size-normal);
        color: var(--background);

        @media screen and (max-width: 800px) {
          padding-left: 10px;
          padding-right: 10px;
        }

        &:last-child {
          border-bottom: none;
        }

        @media (max-width: 800px) {
          height: 30px;
        }

        .value {
          font-family: var(--special-font-stack);
          font-size: var(--font-size-large);
          text-overflow: ellipsis;
          overflow: hidden;
          white-space: nowrap;
          max-width: 70%;
        }

        &.index {
          color: var(--color-grey-mid);
        }
      }
    }
  }
</style>
