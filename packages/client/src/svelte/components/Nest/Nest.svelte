<script lang="ts">
  import {
    player,
    playerRat,
    playerRatTraits,
    rooms,
  } from "@modules/state/base/stores"
  import { UI } from "@modules/ui/enums"
  import { UIState } from "@modules/ui/stores"

  import { ENVIRONMENT } from "@mud/enums"

  import RoomItem from "@components/Nest/RoomItem.svelte"
  import NewRoom from "@components/Nest/NewRoom.svelte"
  import Inventory from "@components/Nest/Inventory/Inventory.svelte"
  import LoadOut from "@components/Nest/LoadOut/LoadOut.svelte"
  import Traits from "@components/Nest/Traits/Traits.svelte"

  export let environment: ENVIRONMENT

  function restart() {
    UIState.set(UI.CREATING_RAT)
  }
</script>

<div class="nest">
  <div class="column first">
    {#if $player}
      <div class="balance">
        Balance:
        <strong>${$player?.balance ?? 0}</strong>
      </div>
      <!-- INVENTORY -->
      <div class="stat-item">
        <Inventory />
      </div>
      <hr />
      <div class="image-container" class:dead={$playerRat?.dead ?? false}>
        <img class="rat" src="/images/rat.jpg" alt="nest" />
        <img class="stamp" src="/images/dead.png" alt="dead" />
      </div>
      {#if $playerRat.dead}
        <div class="restart">
          <button on:click={restart}>Get new rat</button>
        </div>
      {:else}
        <div class="stats">
          <div class="stat-item trait">
            <Traits />
          </div>
          <div class="stat-item">
            <strong>Dead:</strong>
            {$playerRat?.dead}
          </div>
          <div class="stat-item">
            <strong>Health:</strong>
            {$playerRat?.health ?? 0}
          </div>
          <hr />
          <!-- LOAD OUT -->
          <div class="stat-item">
            <LoadOut />
          </div>
        </div>
      {/if}
    {/if}
  </div>

  <div class="column second">
    <NewRoom />
    <!-- ROOM LIST -->
    <div class="room-list">
      {#each Object.entries($rooms).reverse() as [roomId, room]}
        <RoomItem {environment} {roomId} {room} />
      {/each}
    </div>
  </div>
</div>

<style lang="scss">
  .stats {
    margin-bottom: 20px;
  }

  img {
    margin-bottom: 20px;
  }

  .column {
    width: 50%;
    height: 100vh;
    float: left;
    padding: 20px;
    overflow-x: hidden;
    overflow-y: auto;

    &.first {
      background: blue;
    }

    &.second {
      background: red;
    }
  }

  .stat-item {
    margin-bottom: 1em;
  }

  .trait {
    background: lightcyan;
    color: black;
    display: flex;
    flex-wrap: wrap;
  }

  .balance {
    padding: 10px;
    background: yellow;
    font-size: 23px;
    margin-bottom: 20px;
    color: black;
  }

  .image-container {
    display: inline-block;
    position: relative;

    .stamp {
      width: 400px;
      display: none;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
    }

    &.dead {
      .rat {
        filter: grayscale(100%);
      }

      .stamp {
        display: block;
      }
    }
  }

  .restart {
    button {
      padding: 40px;
      background: lightgreen;
      font-size: 32px;
      cursor: pointer;
      &:hover {
        background: green;
      }
    }
  }
</style>
