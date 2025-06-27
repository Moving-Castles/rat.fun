<script lang="ts">
  import { player, playerERC20Balance } from "$lib/modules/state/base/stores"
  // import YourRat from "$lib/components/Main/RatContainer/YourRat/YourRat.svelte"
  import CreateRoom from "$lib/components/Main/RoomContainer/CreateRoom/CreateRoom.svelte"
  import CreateRoomButton from "$lib/components/Main/Shared/RoomListing/CreateRoomButton.svelte"
  import ChatRoom from "$lib/components/Main/Shared/ChatRoom/ChatRoom.svelte"

  let showCreateRoom = $state(false)
</script>

<div class="room-container">
  <div class="">
    {#if !showCreateRoom}
      <div class="plot">
        <div class="top">
          <span>
            Welcome back, {$player.name}
          </span>
        </div>
        <CreateRoomButton onclick={() => (showCreateRoom = true)} />
      </div>
    {:else}
      <CreateRoom />
    {/if}
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

  .plot {
    display: flex;
    justify-content: space-between;
    flex-flow: column nowrap;
    height: 100%;

    .top {
      padding: 12px;
    }
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
