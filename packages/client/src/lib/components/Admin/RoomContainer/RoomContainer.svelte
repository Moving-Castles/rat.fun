<script lang="ts">
  import { CreateRoom } from "$lib/components/Admin"
  import { ChatBox } from "$lib/components/Shared"
</script>

<div class="room-container">
  <CreateRoom />
  <ChatBox />
</div>

<style lang="scss">
  .room-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    display: grid;
    grid-template-rows: 440px minmax(100px, 1fr);
  }
</style>
