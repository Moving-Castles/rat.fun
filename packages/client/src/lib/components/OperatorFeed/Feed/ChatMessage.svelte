<script lang="ts">
  import type { ChatMessage } from "./types"

  let { message }: { message: ChatMessage } = $props()
</script>

<div class="message-content chat">
  <span class="player-name">{message.playerName}</span>
  <span class="text">{message.content}</span>
</div>

<style lang="scss">
  .chat {
    flex: 1;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: baseline;

    .player-name {
      color: var(--color-grey-light);

      margin-right: 1ch;
    }

    .text {
      word-break: break-word;
      color: var(--foreground);
    }
  }
</style>
