<script lang="ts">
  import { fade } from "svelte/transition"
  import { goto } from "$app/navigation"
  import type { TripFolder } from "@sanity-types"
  import { playSound } from "$lib/modules/sound"
  import { formatCountdown } from "@ratfun/shared-utils"

  // Challenge active period in blocks (24h at 2s/block on Base)
  const CHALLENGE_ACTIVE_PERIOD_BLOCKS = 43200
  // Block time on Base in milliseconds
  const BLOCK_TIME_MS = 2000
  // How long to show winner after challenge ends
  const WINNER_DISPLAY_DURATION_MS = 15 * 60 * 1000 // 15 minutes

  let {
    listingIndex,
    folder,
    challengeTripId,
    attemptCount,
    challengeCreationBlock,
    currentBlockNumber,
    challengeTitle,
    lastWinnerName,
    lastWinTimestamp
  }: {
    listingIndex: number
    folder: TripFolder
    challengeTripId?: string
    attemptCount?: number
    challengeCreationBlock?: number
    currentBlockNumber?: number
    challengeTitle?: string | null
    lastWinnerName?: string | null
    lastWinTimestamp?: number | null // Unix timestamp in ms
  } = $props()

  let hasActiveChallenge = $derived(!!challengeTripId)

  // Calculate expiration block for active challenge
  let expirationBlock = $derived(
    challengeCreationBlock ? challengeCreationBlock + CHALLENGE_ACTIVE_PERIOD_BLOCKS : 0
  )

  // Calculate blocks remaining until expiration
  let blocksRemaining = $derived.by(() => {
    if (!expirationBlock || !currentBlockNumber) return 0
    return Math.max(0, expirationBlock - currentBlockNumber)
  })

  // Calculate time remaining in milliseconds
  let timeRemainingMs = $derived(blocksRemaining * BLOCK_TIME_MS)

  // Countdown text derived from time remaining
  let countdownText = $derived.by(() => {
    if (timeRemainingMs <= 0) return ""
    return formatCountdown(timeRemainingMs)
  })

  // Display state - determines what to show
  let displayState = $derived.by<"countdown" | "winner" | "active">(() => {
    const now = Date.now()

    // Priority 1: Active challenge - show countdown to expiration
    if (hasActiveChallenge && blocksRemaining > 0) {
      return "active"
    }

    // Priority 2: Recent winner - show "Won by X" for 15 minutes
    if (lastWinnerName && lastWinTimestamp) {
      const timeSinceWin = now - lastWinTimestamp
      if (timeSinceWin < WINNER_DISPLAY_DURATION_MS) {
        return "winner"
      }
    }

    // Default: show countdown placeholder (no active challenge)
    return "countdown"
  })

  // Disabled when not showing active challenge (nothing to navigate to)
  let disabled = $derived(!hasActiveChallenge)

  const handleClick = () => {
    if (challengeTripId) {
      goto(`/${challengeTripId}`)
    }
  }

  const onmousedown = () => {
    playSound({ category: "ratfunUI", id: "smallButtonDown" })
  }

  const onmouseup = () => {
    playSound({ category: "ratfunUI", id: "smallButtonUp" })
  }
</script>

<div class="tile wide" in:fade={{ duration: 100, delay: listingIndex * 30 }}>
  <button
    class:disabled
    class:countdown={displayState === "countdown"}
    class:winner={displayState === "winner"}
    onclick={handleClick}
    {onmouseup}
    {onmousedown}
  >
    <div class="title">
      {#if displayState === "winner"}
        <div class="challenge-title winner">Won by {lastWinnerName}</div>
      {:else}
        <div class="challenge-title">{challengeTitle ?? "TRIP OR TRAP?"}</div>
      {/if}
      <div class="count">
        {#if displayState === "active"}
          <span class="countdown-time">{countdownText}</span>
          <span class="attempts">{attemptCount ?? 0} attempt{attemptCount === 1 ? "" : "s"}</span>
        {:else}
          <span class="countdown-time">No active challenge</span>
        {/if}
      </div>
    </div>
  </button>
</div>

<style lang="scss">
  .tile {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    overflow: visible;

    &.wide {
      grid-column: span 2;

      @media (max-width: 800px) {
        grid-column: span 1;
        grid-row: span 2;
      }
    }

    button {
      position: relative;
      width: 100%;
      height: 100%;
      font-family: var(--special-font-stack);
      font-size: var(--font-size-large);
      box-shadow: 0 0px 10px 0px var(--color-restricted-trip-folder-transparent);

      border-style: outset;
      border-width: 10px;
      border-color: var(--background-light-transparent);
      color: var(--background);

      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;

      background-color: var(--color-restricted-trip-folder);

      &::before {
        content: "";
        position: absolute;
        inset: 0;
        background-image: url("/images/tot2.png");
        background-repeat: no-repeat;
        background-size: 100% 100%;
        opacity: 0.5;
        z-index: 0;
      }

      @media (max-width: 768px) {
        font-size: var(--font-size-normal);
      }

      .title {
        position: relative;
        z-index: 1;

        .challenge-title {
          font-size: var(--font-size-extra-large);
          line-height: 0.8em;

          &.winner {
            font-size: var(--font-size-super-large);
            line-height: 0.8em;
          }
        }

        .count {
          font-size: var(--font-size-normal);
          font-family: var(--typewriter-font-stack);
          margin-top: 10px;
          display: flex;
          flex-direction: column;
          gap: 4px;

          .countdown-time {
            font-size: var(--font-size-large);
          }

          .attempts {
            font-size: var(--font-size-small);
            opacity: 0.8;
          }
        }
      }
      transition: transform 0.1s ease-in-out;

      @media (min-width: 800px) {
        &:hover {
          border-color: var(--background-light-transparent);
          transform: scale(0.97);
        }
      }

      &:active {
        filter: invert(1);
        transform: scale(0.95);
      }

      &.disabled {
        opacity: 0.7;
        pointer-events: none;
        box-shadow: unset;
      }
    }
  }
</style>
