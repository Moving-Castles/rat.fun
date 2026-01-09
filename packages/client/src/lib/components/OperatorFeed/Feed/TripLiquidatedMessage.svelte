<script lang="ts">
  import type { TripLiquidatedMessage } from "./types"
  import { goto } from "$app/navigation"

  let { message }: { message: TripLiquidatedMessage } = $props()

  function handleTripClick() {
    goto(`/${message.tripId}`)
  }

  function truncatePrompt(prompt: string, maxLen = 60): string {
    if (prompt.length <= maxLen) return prompt
    return prompt.slice(0, maxLen) + "..."
  }
</script>

<button class="trip-liquidated" onclick={handleTripClick}>
  <div class="trip-header">
    <span class="arrow">$$$$</span>
    <span class="owner-name">{message.ownerName.toUpperCase()}</span>
    <span class="action">LIQUIDATED TRIP</span>
    <span class="trip-index">#{message.tripIndex}</span>
    <span class="value">+{message.liquidationValue}</span>
  </div>
  <div class="trip-prompt">{truncatePrompt(message.tripPrompt)}</div>
</button>

<style lang="scss">
  .trip-liquidated {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
    background: none;
    border: none;
    padding: 0;
    color: inherit;
    font: inherit;
    cursor: pointer;
    text-align: left;
  }

  .trip-header {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: baseline;
  }

  .arrow {
    color: var(--color-up);
    margin-right: 1ch;
  }

  .owner-name {
    color: var(--foreground);
  }

  .action {
    text-transform: uppercase;
    color: var(--color-grey-light);
  }

  .trip-index {
    font-family: var(--mono-font-stack);
    color: var(--foreground);
  }

  .value {
    color: var(--color-up);
    font-family: var(--mono-font-stack);
  }

  .trip-prompt {
    display: block;
    margin-left: 4ch;
    padding-left: 1ch;
    color: var(--color-grey-light);
    border-left: 3px solid var(--color-grey-dark);
    max-width: 75ch;
  }
</style>
