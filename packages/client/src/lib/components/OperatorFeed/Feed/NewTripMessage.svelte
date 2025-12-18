<script lang="ts">
  import type { NewTripMessage } from "./types"
  import { goto } from "$app/navigation"
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"

  let { message }: { message: NewTripMessage } = $props()

  function handleTripClick() {
    goto(`/${message.tripId}`)
  }
</script>

<button class="new-trip" onclick={handleTripClick}>
  <div class="trip-header">
    <span class="arrow">&gt;&gt;&gt;&gt;</span>
    <span class="creator-name">{message.creatorName.toUpperCase()}</span>
    <span class="action">CREATED TRIP</span>
    <span class="trip-index">#{message.tripIndex}</span>
    {#if message.tripCreationCost > 0}
      <span class="cost">{HEALTH_SYMBOL}-{message.tripCreationCost}</span>
    {/if}
  </div>
  <div class="trip-prompt">{message.tripPrompt}</div>
</button>

<style lang="scss">
  .new-trip {
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
    color: var(--color-good);
    margin-right: 1ch;
  }

  .creator-name {
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

  .cost {
    color: var(--color-down);
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
