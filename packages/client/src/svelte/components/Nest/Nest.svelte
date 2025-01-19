<script lang="ts">
  import {
    player,
    playerRat,
    playerRatTraits,
    rooms,
  } from "@modules/state/base/stores"

  import { ENVIRONMENT } from "@mud/enums"

  import RoomItem from "@components/Nest/RoomItem.svelte"
  import NewRoom from "@components/Nest/NewRoom.svelte"
  import Inventory from "@svelte/components/Nest/Inventory/Inventory.svelte"
  import LoadOut from "@svelte/components/Nest/LoadOut/LoadOut.svelte"

  export let environment: ENVIRONMENT
</script>

<div class="nest">
  <div class="column first">
    {#if $player}
      <div class="balance">
        Balance:
        <strong>{$player?.balance ?? 0}</strong>
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
      <div class="stats">
        <div class="stat-item trait">
          <strong>Traits:</strong>
          {#if $playerRatTraits}
            {#each $playerRatTraits as trait}
              <div class="trait-item">{trait.name}</div>
            {/each}
          {/if}
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

    .trait-item {
      margin-right: 5px;
      margin-bottom: 5px;
      padding: 4px;
      border-radius: 5px;
      background: lightsalmon;
      font-size: 14px;
    }
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
</style>
