<script lang="ts">
  import { fade } from "svelte/transition"
  import { goto } from "$app/navigation"
  import type { TripFolder } from "@sanity-types"
  import { playSound } from "$lib/modules/sound"

  const GRACE_PERIOD_MS = 30 * 60 * 1000 // 30 minutes
  const WINNER_DISPLAY_DURATION_MS = 60 * 60 * 1000 // 1 hour

  let {
    listingIndex,
    folder,
    challengeTripId,
    attemptCount,
    dailyChallengeTime,
    challengeTitle,
    lastWinnerName,
    lastWinTimestamp
  }: {
    listingIndex: number
    folder: TripFolder
    challengeTripId?: string
    attemptCount?: number
    dailyChallengeTime?: string | null
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

  /**
   * Calculate today's CET time (not rolling to next day).
   * @param timeStr - Time in "HH:MM" format (CET)
   * @returns Date object representing today's target time in user's local timezone
   */
  function getTodayCETTime(timeStr: string): Date {
    const now = new Date()

    // Format current date as YYYY-MM-DD in CET
    const cetFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
    const cetDateStr = cetFormatter.format(now)

    // Create the target time in CET
    const targetDateStr = `${cetDateStr}T${timeStr.padStart(5, "0")}:00`
    const cetDate = new Date(targetDateStr)

    // Get the CET offset for the target date
    const cetOffset = getCETOffset(cetDate)

    // Create UTC time from CET time
    const utcMs = cetDate.getTime() - cetOffset * 60 * 1000

    return new Date(utcMs)
  }

  /**
   * Calculate the next occurrence of a CET time.
   * If that time has already passed today, returns tomorrow's occurrence.
   * @param timeStr - Time in "HH:MM" format (CET)
   * @returns Date object representing the next occurrence in user's local timezone
   */
  function getNextCETTime(timeStr: string): Date {
    // Create a date in CET timezone for today
    // CET is UTC+1, CEST (summer) is UTC+2
    const now = new Date()

    // Format current date as YYYY-MM-DD in CET
    const cetFormatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Europe/Berlin",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    })
    const cetDateStr = cetFormatter.format(now)

    // Create the target time in CET
    // We construct an ISO string and use the Europe/Berlin timezone offset
    const targetDateStr = `${cetDateStr}T${timeStr.padStart(5, "0")}:00`

    // Parse this as a CET time by creating a formatter that can tell us the offset
    const cetDate = new Date(targetDateStr)

    // Get the CET offset for the target date
    const cetOffset = getCETOffset(cetDate)

    // Create UTC time from CET time
    const utcMs = cetDate.getTime() - cetOffset * 60 * 1000

    // If this time has already passed, add 24 hours
    if (utcMs <= now.getTime()) {
      return new Date(utcMs + 24 * 60 * 60 * 1000)
    }

    return new Date(utcMs)
  }

  /**
   * Get the CET/CEST offset in minutes for a given date
   * CET = UTC+1 (60 minutes), CEST = UTC+2 (120 minutes)
   */
  function getCETOffset(date: Date): number {
    // Create a date string in CET and parse the offset
    const cetStr = date.toLocaleString("en-US", {
      timeZone: "Europe/Berlin",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    })
    const utcStr = date.toLocaleString("en-US", {
      timeZone: "UTC",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit"
    })

    const [cetHour, cetMin] = cetStr.split(":").map(Number)
    const [utcHour, utcMin] = utcStr.split(":").map(Number)

    let diffMinutes = (cetHour - utcHour) * 60 + (cetMin - utcMin)

    // Handle day boundary crossing
    if (diffMinutes < -12 * 60) diffMinutes += 24 * 60
    if (diffMinutes > 12 * 60) diffMinutes -= 24 * 60

    return diffMinutes
  }

  function updateCountdown() {
    const now = Date.now()

    // Priority 1: Active challenge - show attempts
    if (hasActiveChallenge) {
      displayState = "active"
      countdownText = ""
      return
    }

    // Priority 2: Recent winner - show "Won by X" for 1 hour
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

    // Priority 4: Check if we're in grace period or countdown
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
      // Grace period expired - show countdown to next day
    }

    // Show countdown to next occurrence
    displayState = "countdown"
    const target = getNextCETTime(dailyChallengeTime).getTime()
    const diff = target - now

    if (diff <= 0) {
      countdownText = "Starting soon..."
      return
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((diff % (1000 * 60)) / 1000)

    if (days > 0) {
      countdownText = `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m`
    } else if (hours > 0) {
      countdownText = `${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
    } else if (minutes > 0) {
      countdownText = `${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
    } else {
      countdownText = `${seconds.toString().padStart(2, "0")}s`
    }
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
      <div class="challenge-title">{challengeTitle ?? "TRIP OR TRAP?"}</div>
      <div class="count">
        {#if displayState === "active"}
          {attemptCount ?? 0} attempt{attemptCount === 1 ? "" : "s"}
        {:else if displayState === "winner"}
          <span class="winner-text">Won by {lastWinnerName}</span>
        {:else if displayState === "grace"}
          <span class="countdown-time">{countdownText}</span>
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
        }

        .count {
          font-size: var(--font-size-normal);
          font-family: var(--typewriter-font-stack);
          margin-top: 10px;

          .countdown-time {
            font-size: var(--font-size-large);
          }

          .winner-text {
            font-size: var(--font-size-normal);
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
      }
    }
  }
</style>
