<script lang="ts">
  import CreateRoom from "$lib/components/Admin/CreateRoom/CreateRoom.svelte"
  import { ChatBox } from "$lib/components/Shared"
</script>

<div class="admin-container">
  <CreateRoom />
  <ChatBox />
</div>

<style lang="scss">
  .admin-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    display: grid;
    grid-template-rows: 440px minmax(100px, 1fr);
  }
</style>
