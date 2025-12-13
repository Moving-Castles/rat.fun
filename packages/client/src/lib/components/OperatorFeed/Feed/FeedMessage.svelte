<script lang="ts">
  import type { FeedMessage } from "./types"
  import { FEED_MESSAGE_TYPE } from "./types"
  import { goto } from "$app/navigation"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let { message }: { message: FeedMessage } = $props()

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }

  function handleTripClick(tripId: string) {
    goto(`/${tripId}`)
  }
</script>

<div class="feed-message {message.type}">
  <span class="timestamp">{formatTime(message.timestamp)}</span>

  {#if message.type === FEED_MESSAGE_TYPE.CHAT}
    <div class="message-content chat">
      <span class="player-name">{message.playerName}:</span>
      <span class="text">{message.content}</span>
    </div>
  {:else if message.type === FEED_MESSAGE_TYPE.NEW_TRIP}
    <div class="message-content new-trip">
      <span class="icon">+</span>
      <button class="trip-link" onclick={() => handleTripClick(message.tripId)}>
        <span class="text">
          <span class="highlight">{message.creatorName}</span> created trip
          <span class="trip-title">{message.tripTitle}</span>
        </span>
      </button>
    </div>
  {:else if message.type === FEED_MESSAGE_TYPE.NEW_OUTCOME}
    <div
      class="message-content outcome"
      class:positive={message.result === "survived"}
      class:negative={message.result === "died"}
    >
      <span class="icon">{message.result === "survived" ? "+" : "-"}</span>
      <button class="trip-link" onclick={() => handleTripClick(message.tripId)}>
        <span class="text">
          <span class="rat-name">{message.ratName}</span>
          {message.result === "survived" ? "survived" : "died in"}
          <span class="trip-title">{message.tripTitle}</span>
          <span
            class="value-change"
            class:positive={message.valueChange > 0}
            class:negative={message.valueChange < 0}
          >
            ({message.valueChange > 0 ? "+" : ""}{message.valueChange}
            {CURRENCY_SYMBOL})
          </span>
        </span>
      </button>
    </div>
  {:else if message.type === FEED_MESSAGE_TYPE.PLAYER_JOINED}
    <div class="message-content player-joined">
      <span class="icon">*</span>
      <span class="text">
        <span class="highlight">{message.playerName}</span> joined
      </span>
    </div>
  {/if}
</div>

<style lang="scss">
  .feed-message {
    display: flex;
    gap: 8px;
    padding: 8px 16px;
    border-bottom: 1px solid var(--color-grey-dark);
    font-size: var(--font-size-small);
    line-height: 1.4;

    &:hover {
      background: var(--color-grey-darker);
    }

    @media (max-width: 800px) {
      padding: 8px 12px;
    }
  }

  .timestamp {
    color: var(--color-grey-light);
    font-family: var(--mono-font-stack);
    font-size: var(--font-size-tiny);
    flex-shrink: 0;
    width: 50px;
  }

  .message-content {
    flex: 1;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: baseline;

    .icon {
      font-family: var(--mono-font-stack);
      flex-shrink: 0;
      width: 12px;
    }
  }

  .chat {
    .player-name {
      font-weight: 600;
      color: var(--color-accent);
    }

    .text {
      word-break: break-word;
    }
  }

  .new-trip {
    .icon {
      color: var(--color-good);
    }

    .highlight {
      color: var(--color-accent);
    }

    .trip-title {
      font-style: italic;
      opacity: 0.9;
    }
  }

  .outcome {
    &.positive .icon {
      color: var(--color-up);
    }

    &.negative .icon {
      color: var(--color-down);
    }

    .rat-name {
      font-weight: 600;
    }

    .trip-title {
      font-style: italic;
      opacity: 0.9;
    }

    .value-change {
      font-family: var(--mono-font-stack);

      &.positive {
        color: var(--color-up);
      }

      &.negative {
        color: var(--color-down);
      }
    }
  }

  .player-joined {
    opacity: 0.7;

    .icon {
      color: var(--color-accent);
    }

    .highlight {
      color: var(--color-accent);
    }
  }

  .trip-link {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: left;

    &:hover {
      text-decoration: underline;
    }
  }
</style>
