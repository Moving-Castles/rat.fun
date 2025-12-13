<script lang="ts">
  import type { NewOutcomeMessage } from "./types"
  import { goto } from "$app/navigation"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let { message }: { message: NewOutcomeMessage } = $props()

  function handleTripClick() {
    goto(`/${message.tripId}`)
  }

  function formatValueChange(value: number): string {
    const prefix = value > 0 ? "got" : "lost"
    const absValue = Math.abs(value)
    return `${prefix} ${absValue} ${CURRENCY_SYMBOL}`
  }
</script>

<div
  class="message-content outcome"
  class:positive={message.result === "survived"}
  class:negative={message.result === "died"}
>
  <button class="trip-link" onclick={handleTripClick}>
    <div class="outcome-details">
      <span class="outcome-line">
        <span class="rat-name">{message.ratName}</span>
        {message.result === "survived" ? "survived" : "died in"}
        Trip #{message.tripIndex}
      </span>
      <span class="value-line">
        <span
          class="player-name"
          class:positive={message.ratOwnerValueChange > 0}
          class:negative={message.ratOwnerValueChange < 0}
        >
          {message.ratOwnerName}
        </span>
        <span
          class="value-change"
          class:positive={message.ratOwnerValueChange > 0}
          class:negative={message.ratOwnerValueChange < 0}
        >
          {formatValueChange(message.ratOwnerValueChange)}
        </span>
      </span>
      <span class="value-line">
        <span
          class="player-name"
          class:positive={message.tripCreatorValueChange > 0}
          class:negative={message.tripCreatorValueChange < 0}
        >
          {message.tripCreatorName}
        </span>
        <span
          class="value-change"
          class:positive={message.tripCreatorValueChange > 0}
          class:negative={message.tripCreatorValueChange < 0}
        >
          {formatValueChange(message.tripCreatorValueChange)}
        </span>
      </span>
    </div>
  </button>
</div>

<style lang="scss">
  .outcome {
    flex: 1;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: baseline;
  }

  .trip-link {
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .outcome-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .outcome-line {
    .rat-name {
      font-weight: 600;
    }
  }

  .value-line {
    display: flex;
    gap: 4px;

    .player-name {
      &.positive {
        background: var(--color-up);
      }

      &.negative {
        background: var(--color-down);
      }
    }
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
</style>
