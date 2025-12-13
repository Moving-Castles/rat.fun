<script lang="ts">
  import type { PlayerJoinedMessage } from "./types"

  let { message }: { message: PlayerJoinedMessage } = $props()
</script>

<div class="message-content player-joined">
  <span class="icon">*</span>
  <span class="text">
    <span class="highlight">{message.playerName}</span> joined
  </span>
</div>

<style lang="scss">
  .player-joined {
    flex: 1;
    display: flex;
    gap: 4px;
    flex-wrap: wrap;
    align-items: baseline;
    opacity: 0.7;

    .icon {
      font-family: var(--mono-font-stack);
      flex-shrink: 0;
      width: 12px;
      color: var(--color-accent);
    }

    .highlight {
      color: var(--color-accent);
    }
  }
</style>
