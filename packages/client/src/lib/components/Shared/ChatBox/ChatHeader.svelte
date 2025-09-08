<script lang="ts">
  import { websocketConnected, clientList } from "$lib/modules/off-chain-sync/stores"
  let { onclick, collapsed } = $props()
</script>

<div {onclick} class="chat-header" class:collapsed>
  <div class="header-content">
    <div class="chat-label">TRIP SITTERS</div>
    <span class="status" class:connected={$websocketConnected}>
      {$clientList.length ?? 0} online
    </span>
  </div>
</div>

<style lang="scss">
  .chat-header {
    position: sticky;
    top: 0;
    z-index: var(--z-mid);
    border-bottom: var(--dashed-border-style);
    padding: 6px;
    font-size: var(--font-size-small);
    font-family: var(--typewriter-font-stack);
    color: var(--foreground);
    cursor: pointer;

    .chat-label {
      color: var(--background);
      background-color: var(--foreground);
    }
    &:hover {
      background: var(--foreground);
      .status,
      .chat-label {
        color: var(--foreground);
        background-color: var(--background);
      }
    }

    &.collapsed {
    }
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
