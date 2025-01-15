<script lang="ts">
  import { player, rats, rooms } from "@svelte/modules/state/base/stores"
  import RoomItem from "./RoomItem.svelte"
  import { ENVIRONMENT } from "@mud/enums"

  import NewRoom from "./NewRoom.svelte"

  export let environment: ENVIRONMENT
</script>

<div class="nest">
  <div class="column first">
    {#if $player}
      <!-- <div class="stats">
        <strong>PLAYER</strong>
        <br />Currency:{$player.currency ?? 0}
      </div> -->
      <img src="/images/rat.jpg" alt="nest" />
      <div class="stats">
        <!-- <br />id: {$player.ownedRat} -->
        <div class="stat-item trait">
          <strong>Traits:</strong>
          {$rats[$player.ownedRat]?.trait ?? ""}
        </div>
        <div class="stat-item">
          <strong>Dead:</strong>
          {$rats[$player.ownedRat]?.dead}
        </div>
        <div class="stat-item">
          <strong>Health:</strong>
          {$rats[$player.ownedRat]?.health ?? 0}
        </div>
        <div class="stat-item">
          <strong>Intelligence:</strong>
          {$rats[$player.ownedRat]?.intelligence ?? 0}
        </div>
        <div class="stat-item">
          <strong>Strength:</strong>
          {$rats[$player.ownedRat]?.strength ?? 0}
        </div>
        <div class="stat-item">
          <strong>Sanity:</strong>
          {$rats[$player.ownedRat]?.sanity ?? 0}
        </div>
        <div class="stat-item">
          <strong>Luck:</strong>
          {$rats[$player.ownedRat]?.luck ?? 0}
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
  }
</style>
