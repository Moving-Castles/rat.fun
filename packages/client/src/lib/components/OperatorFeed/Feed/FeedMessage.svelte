<script lang="ts">
  import type { FeedMessage } from "./types"
  import { FEED_MESSAGE_TYPE } from "./types"
  import ChatMessage from "./ChatMessage.svelte"
  import NewTripMessage from "./NewTripMessage.svelte"
  import NewOutcomeMessage from "./NewOutcomeMessage.svelte"

  let { message }: { message: FeedMessage } = $props()

  function formatTime(timestamp: number): string {
    const date = new Date(timestamp)
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  }
</script>

<div class="feed-message {message.type}">
  <span class="timestamp">{formatTime(message.timestamp)}</span>

  {#if message.type === FEED_MESSAGE_TYPE.CHAT}
    <ChatMessage {message} />
  {:else if message.type === FEED_MESSAGE_TYPE.NEW_TRIP}
    <NewTripMessage {message} />
  {:else if message.type === FEED_MESSAGE_TYPE.NEW_OUTCOME}
    <NewOutcomeMessage {message} />
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
    color: var(--color-grey-mid);
    font-family: var(--mono-font-stack);
    font-size: var(--font-size-tiny);
    flex-shrink: 0;
    width: 50px;
  }
</style>
