<script lang="ts">
  // import YourRat from "$lib/components/Main/RatContainer/YourRat/YourRat.svelte"
  import ChatRoom from "$lib/components/Main/Shared/ChatRoom/ChatRoom.svelte"
</script>

<div class="room-container">
  <!-- YOUR ROOM -->
  <div class="spacer"></div>
  <div class="remaining"></div>
  <ChatRoom />
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
