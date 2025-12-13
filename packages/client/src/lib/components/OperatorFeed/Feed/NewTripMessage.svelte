<script lang="ts">
  import type { NewTripMessage } from "./types"
  import { goto } from "$app/navigation"

  let { message }: { message: NewTripMessage } = $props()

  function handleTripClick() {
    goto(`/${message.tripId}`)
  }
</script>

<div class="message-content new-trip">
  <button class="trip-link" onclick={handleTripClick}>
    <div class="trip-details">
      <span class="trip-header">
        <span class="creator-name">{message.creatorName}</span> created trip #{message.tripIndex}
      </span>
      <span class="trip-prompt">"{message.tripPrompt}"</span>
    </div>
  </button>
</div>

<style lang="scss">
  .new-trip {
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

  .trip-details {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .trip-header {
    .creator-name {
      color: var(--color-accent);
    }
  }

  .trip-prompt {
    font-style: italic;
    opacity: 0.9;
  }
</style>
