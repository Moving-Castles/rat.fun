<script lang="ts">
  import { CreateRoom } from "$lib/components/Admin"
  import { ChatBox } from "$lib/components/Shared"
  import { collapsed } from "$lib/modules/ui/state.svelte"
</script>

<div class="admin-container" class:collapsed={$collapsed}>
  <!-- <CreateRoom /> -->
  <!-- <ChatBox /> -->
</div>

<style lang="scss">
  .admin-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    display: grid;
    grid-template-rows: 440px minmax(100px, 1fr);
    grid-column: 1 / 4;
    transition: grid-template-rows 0.1s ease;

    &.collapsed {
      grid-template-rows: calc(var(--game-window-height) - 110px) minmax(100px, 1fr);
    }
  }
</style>
