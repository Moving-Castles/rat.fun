<script lang="ts">
  import { fade } from "svelte/transition"
  import { goto } from "$app/navigation"
  import { playSound } from "$lib/modules/sound"
  import { formatCountdown } from "@ratfun/shared-utils"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  // Challenge active period in blocks (24h at 2s/block on Base)
  const CHALLENGE_ACTIVE_PERIOD_BLOCKS = 43200
  // Block time on Base in milliseconds
  const BLOCK_TIME_MS = 2000
  // How long to show winner after challenge ends
  const WINNER_DISPLAY_DURATION_MS = 15 * 60 * 1000 // 15 minutes

  let {
    listingIndex = 0,
    challengeTripId,
    attemptCount,
    challengeCreationBlock,
    currentBlockNumber,
    challengeTitle,
    lastWinnerName,
    lastWinTimestamp,
    creatorName,
    maxReward
  }: {
    listingIndex?: number
    challengeTripId?: string
    attemptCount?: number
    challengeCreationBlock?: number
    currentBlockNumber?: number
    challengeTitle?: string | null
    lastWinnerName?: string | null
    lastWinTimestamp?: number | null
    creatorName?: string | null
    maxReward?: number | null
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

  // Disabled when no active challenge or challenge has expired
  let disabled = $derived(!hasActiveChallenge || blocksRemaining <= 0)

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

<div class="challenge-card" in:fade={{ duration: 100, delay: listingIndex * 30 }}>
  <button
    class:disabled
    class:countdown={displayState === "countdown"}
    class:winner={displayState === "winner"}
    onclick={handleClick}
    {onmouseup}
    {onmousedown}
  >
    <div class="content">
      {#if displayState === "winner"}
        <div class="challenge-title winner">Won by {lastWinnerName}</div>
      {:else}
        <div class="challenge-title">{challengeTitle ?? "TRIP OR TRAP?"}</div>
      {/if}

      {#if displayState === "active"}
        <div class="challenge-meta">
          {#if creatorName}
            <div class="meta-row creator">
              <span class="label">CREATED BY</span>
              <span class="value">{creatorName}</span>
            </div>
          {/if}
          {#if maxReward}
            <div class="reward-amount">{maxReward} {CURRENCY_SYMBOL}</div>
          {/if}
        </div>
      {/if}

      <div class="count">
        {#if displayState === "active"}
          <span class="countdown-time">{countdownText}</span>
        {:else}
          <span class="countdown-time">No active challenge</span>
        {/if}
      </div>
    </div>
  </button>
</div>

<style lang="scss">
  .challenge-card {
    display: flex;
    justify-content: center;
    align-items: center;
    text-align: center;
    overflow: visible;
    width: 100%;

    button {
      position: relative;
      width: 100%;
      height: 180px;
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
      padding: 16px;

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
        min-height: 160px;
      }

      .content {
        position: relative;
        z-index: 1;
        display: flex;
        flex-direction: column;
        gap: 12px;
        width: 100%;

        .challenge-title {
          font-size: var(--font-size-large);
          line-height: 1em;

          &.winner {
            font-size: var(--font-size-super-large);
            line-height: 1em;
          }
        }

        .challenge-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .meta-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            gap: 8px;

            .label {
              font-family: var(--typewriter-font-stack);
              font-size: var(--font-size-xsmall);
              opacity: 0.8;
              color: var(--foreground);
            }

            .value {
              font-family: var(--special-font-stack);
              font-size: var(--font-size-large);
              color: var(--background);
            }
          }

          .reward-amount {
            font-family: var(--special-font-stack);
            font-size: var(--font-size-extra-large);
            color: var(--background);
          }
        }

        .count {
          font-family: var(--special-font-stack);
          display: flex;
          flex-direction: column;
          gap: 4px;

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
