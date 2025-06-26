<script lang="ts">
  import { websocketConnected, clientList } from "$lib/modules/off-chain-sync/stores"
  import { ratLevel } from "$lib/modules/state/base/stores"
</script>

<div class="chat-header">
  <div class="header-content">
    <span class="title">
      Floor #{$ratLevel?.index ?? 0}: {$ratLevel?.name ?? ""}
    </span>
    <span class="status" class:connected={$websocketConnected}>
      {$clientList.length ?? 0} operator{Object.keys($clientList).length > 1 ? "s" : ""} online
    </span>
  </div>
</div>

<style lang="scss">
  .chat-header {
    position: sticky;
    top: 0;
    z-index: var(--z-mid);
    background: var(--background);
    border-bottom: var(--dashed-border-style);
    padding: 6px;
    font-size: var(--font-size-small);
    font-family: var(--typewriter-font-stack);
    color: var(--foreground);
  }

  .header-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
</style>
