<script lang="ts">
  import type { NewOutcomeMessage, FeedItem } from "./types"
  import { goto } from "$app/navigation"
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"

  let { message }: { message: NewOutcomeMessage } = $props()

  function handleTripClick() {
    goto(`/${message.tripId}`)
  }

  function formatValueChange(value: number): string {
    const prefix = value >= 0 ? "+" : ""
    return `${prefix}${value}`
  }

  function truncatePrompt(prompt: string, maxLen = 60): string {
    if (prompt.length <= maxLen) return prompt
    return prompt.slice(0, maxLen) + "..."
  }

  // Get all lost items, deduplicating between itemsLost and itemsLostOnDeath
  function getAllLostItems(): FeedItem[] {
    const lostIds = new Set<string>()
    const result: FeedItem[] = []

    // Add items lost during trip
    for (const item of message.itemsLost) {
      if (!lostIds.has(item.id)) {
        lostIds.add(item.id)
        result.push(item)
      }
    }

    // Add items lost on death (if any)
    for (const item of message.itemsLostOnDeath) {
      if (!lostIds.has(item.id)) {
        lostIds.add(item.id)
        result.push(item)
      }
    }

    return result
  }

  const allLostItems = $derived(getAllLostItems())
  const hasBalanceChange = $derived(message.ratBalanceChange !== 0)
  const hasItems = $derived(
    hasBalanceChange ||
      message.itemsOnEntrance.length > 0 ||
      message.itemsGained.length > 0 ||
      allLostItems.length > 0
  )
</script>

<button class="outcome" onclick={handleTripClick}>
  <div class="outcome-header">
    <span class="marker">****</span>
    <span class="owner-name">{message.ratOwnerName}</span>
    <span class="result">
      {message.result === "survived" ? "RAT SURVIVED" : "RAT DIED"}
    </span>
    <span
      class="value-change"
      class:positive={message.ratValueChange >= 0}
      class:negative={message.ratValueChange < 0}
    >
      {formatValueChange(message.ratValueChange)}
    </span>
    <span class="trip-index">#{message.tripIndex}</span>
  </div>

  <div class="outcome-details">
    <span class="trip-prompt">{truncatePrompt(message.tripPrompt)}</span>

    {#if hasItems}
      <div class="items">
        {#if hasBalanceChange}
          <span
            class="item balance"
            class:gained={message.ratBalanceChange > 0}
            class:lost={message.ratBalanceChange < 0}
          >
            {HEALTH_SYMBOL}
            {formatValueChange(message.ratBalanceChange)}
          </span>
        {/if}
        {#each message.itemsOnEntrance as item (item.id)}
          <span class="item brought">{item.name} ({item.value})</span>
        {/each}
        {#each message.itemsGained as item (item.id)}
          <span class="item gained">+ {item.name} ({item.value})</span>
        {/each}
        {#each allLostItems as item (item.id)}
          <span class="item lost">- {item.name} ({item.value})</span>
        {/each}
      </div>
    {/if}
  </div>
</button>

<style lang="scss">
  .outcome {
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

  .outcome-header {
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: baseline;
  }

  .marker {
    color: var(--color-grey-light);
    margin-right: 1ch;
  }

  .owner-name {
    color: var(--foreground);
  }

  .trip-index {
    font-family: var(--mono-font-stack);
    color: var(--foreground);
  }

  .result {
    text-transform: uppercase;
    color: var(--color-grey-light);
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

  .outcome-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .trip-prompt {
    display: block;
    margin-left: 4ch;
    padding-left: 1ch;
    color: var(--color-grey-light);
    border-left: 3px solid var(--color-grey-dark);
    max-width: 75ch;
  }

  .items {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-left: calc(5ch - 6px);
  }

  .item {
    padding: 1px 6px;
    border-radius: 3px;
    font-size: var(--font-size-tiny);

    &.brought {
      background: var(--color-grey-dark);
      color: var(--color-grey-lighter);
    }

    &.gained {
      background: color-mix(in srgb, var(--color-up) 30%, transparent);
      color: var(--color-up);
    }

    &.lost {
      background: color-mix(in srgb, var(--color-down) 30%, transparent);
      color: var(--color-down);
    }
  }
</style>
