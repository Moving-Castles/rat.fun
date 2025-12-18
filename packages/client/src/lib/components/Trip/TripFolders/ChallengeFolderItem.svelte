<script lang="ts">
  import { fade } from "svelte/transition"
  import { goto } from "$app/navigation"
  import type { TripFolder } from "@sanity-types"
  import { playSound } from "$lib/modules/sound"

  let {
    listingIndex,
    folder,
    challengeTripId,
    attemptCount,
    nextChallenge
  }: {
    listingIndex: number
    folder: TripFolder
    challengeTripId?: string
    attemptCount?: number
    nextChallenge?: string | null
  } = $props()

  // Show countdown when no active challenge trip but has nextChallenge date
  let showCountdown = $derived(!challengeTripId && !!nextChallenge)
  let hasActiveChallenge = $derived(!!challengeTripId)

  // Countdown state
  let countdownText = $state("")
  let countdownInterval: ReturnType<typeof setInterval> | null = null

  function updateCountdown() {
    if (!nextChallenge) {
      countdownText = ""
      return
    }

    const now = new Date().getTime()
    const target = new Date(nextChallenge).getTime()
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
      countdownText = `${days}d ${hours}h ${minutes}m`
    } else if (hours > 0) {
      countdownText = `${hours}h ${minutes}m ${seconds}s`
    } else if (minutes > 0) {
      countdownText = `${minutes}m ${seconds}s`
    } else {
      countdownText = `${seconds}s`
    }
  }

  $effect(() => {
    if (showCountdown) {
      updateCountdown()
      countdownInterval = setInterval(updateCountdown, 1000)
    } else if (countdownInterval) {
      clearInterval(countdownInterval)
      countdownInterval = null
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval)
      }
    }
  })

  // Disabled when showing countdown (no challenge to navigate to)
  let disabled = $derived(showCountdown)

  let title = "TRIP OR TRAP?"

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

<div class="tile wide" in:fade|global={{ duration: 100, delay: listingIndex * 30 }}>
  <button
    class:disabled
    class:countdown={showCountdown}
    onclick={handleClick}
    {onmouseup}
    {onmousedown}
  >
    <div class="title">
      {title}
      <span class="count">
        {#if showCountdown}
          <br />
          <span class="countdown-time">{countdownText}</span>
        {:else if hasActiveChallenge}
          <br />
          {attemptCount ?? 0} attempt{attemptCount === 1 ? "" : "s"}
        {/if}
      </span>
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
    }

    button {
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

      @media (max-width: 768px) {
        font-size: var(--font-size-normal);
      }

      .title {
        position: relative;

        .count {
          font-size: var(--font-size-normal);

          .countdown-label {
            font-size: var(--font-size-small);
          }

          .countdown-time {
            font-size: var(--font-size-extra-large);
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

      background: var(--color-restricted-trip-folder);

      &.disabled {
        opacity: 0.5;
        pointer-events: none;
      }
    }
  }
</style>
