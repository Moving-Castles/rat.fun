<script lang="ts">
  import { fade } from "svelte/transition"
  import { goto } from "$app/navigation"
  import type { TripFolder } from "@sanity-types"
  import { playSound } from "$lib/modules/sound"
  import { getTodayCETTime, getTargetCETTime, formatCountdown } from "@ratfun/shared-utils"

  const GRACE_PERIOD_MS = 10 * 60 * 1000 // 10 minutes
  const WINNER_DISPLAY_DURATION_MS = 15 * 60 * 1000 // 15 minutes

  let {
    listingIndex,
    folder,
    challengeTripId,
    attemptCount,
    dailyChallengeTime,
    nextChallengeDay,
    challengeTitle,
    lastWinnerName,
    lastWinTimestamp
  }: {
    listingIndex: number
    folder: TripFolder
    challengeTripId?: string
    attemptCount?: number
    dailyChallengeTime?: string | null
    nextChallengeDay?: number | null // Days from today (1 = tomorrow)
    challengeTitle?: string | null
    lastWinnerName?: string | null
    lastWinTimestamp?: number | null // Unix timestamp in ms
  } = $props()

  let hasActiveChallenge = $derived(!!challengeTripId)

  // Countdown state
  let countdownText = $state("")
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  // Display state - determines what to show
  let displayState = $state<"countdown" | "grace" | "winner" | "active">("countdown")

  function updateCountdown() {
    const now = Date.now()

    // Priority 1: Active challenge - show attempts
    if (hasActiveChallenge) {
      displayState = "active"
      countdownText = ""
      return
    }

    // Priority 2: Recent winner - show "Won by X" for 10 minutes
    if (lastWinnerName && lastWinTimestamp) {
      const timeSinceWin = now - lastWinTimestamp
      if (timeSinceWin < WINNER_DISPLAY_DURATION_MS) {
        displayState = "winner"
        countdownText = ""
        return
      }
    }

    // Priority 3: No dailyChallengeTime - nothing to show
    if (!dailyChallengeTime) {
      displayState = "countdown"
      countdownText = ""
      return
    }

    // If nextChallengeDay is set and > 1, show countdown to that specific day
    // (values of 0, 1, null, undefined all mean "tomorrow or today" - original behavior)
    const targetDays = nextChallengeDay && nextChallengeDay > 1 ? nextChallengeDay : null

    if (targetDays !== null) {
      // Fixed target day in the future - just show countdown
      displayState = "countdown"
      const target = getTargetCETTime(dailyChallengeTime, targetDays).getTime()
      const diff = target - now

      if (diff <= 0) {
        countdownText = "Starting soon..."
        return
      }

      countdownText = formatCountdown(diff)
      return
    }

    // Original behavior: Check if we're in grace period or countdown to tomorrow
    const todayTarget = getTodayCETTime(dailyChallengeTime).getTime()
    const timeSinceTarget = now - todayTarget

    // If target time has passed today
    if (timeSinceTarget >= 0) {
      // Within grace period - show "Starting soon..."
      if (timeSinceTarget < GRACE_PERIOD_MS) {
        displayState = "grace"
        countdownText = "Starting soon..."
        return
      }
      // Grace period expired - show countdown to tomorrow
    }

    // Show countdown to tomorrow (1 day from today)
    displayState = "countdown"
    const target = getTargetCETTime(dailyChallengeTime, 1).getTime()
    const diff = target - now

    if (diff <= 0) {
      countdownText = "Starting soon..."
      return
    }

    countdownText = formatCountdown(diff)
  }

  $effect(() => {
    // Always run the update to determine display state
    updateCountdown()
    countdownInterval = setInterval(updateCountdown, 1000)

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
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
    class:countdown={displayState === "countdown" || displayState === "grace"}
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
          {attemptCount ?? 0} attempt{attemptCount === 1 ? "" : "s"}
        {:else}
          <span class="countdown-time">{countdownText}</span>
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

          .countdown-time {
            font-size: var(--font-size-large);
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
