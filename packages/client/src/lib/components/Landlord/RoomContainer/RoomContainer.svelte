<script lang="ts">
  import { CreateRoom } from "$lib/components/Landlord"
  import { ChatRoom } from "$lib/components/Shared"
</script>

<div class="room-container">
  <div class="">
    <CreateRoom />
  </div>
  <!-- YOUR ROOM -->
  <div class="spacer"></div>
  <div class="remaining">
    <ChatRoom />
  </div>
</div>

<style lang="scss">
  .room-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    border-bottom: var(--default-border-style);
    display: grid;
    grid-template-rows: 440px 40px minmax(100px, 1fr);
    position: relative;
    background: black;
  }

  .spacer {
    height: 100%;
    width: 100%;
    background-image: url("/images/texture2.jpg");
    background-size: 100px;
  }

  .remaining {
    height: 100%;
    display: block;
  }
</style>
