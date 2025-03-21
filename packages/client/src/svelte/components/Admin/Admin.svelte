<script lang="ts">
  import { rooms, levels } from "@modules/state/base/stores"
  import NewRoomAdmin from "@components/Admin/NewRoomAdmin.svelte"
  import RoomItemAdmin from "@components/Admin/RoomItemAdmin.svelte"
  import LevelItemAdmin from "@components/Admin/LevelItemAdmin.svelte"
  import LevelHeader from "@components/Admin/LevelHeader.svelte"

  let adminActive = false
  let levelFilter: string | null = null

  function toggleAdmin() {
    adminActive = !adminActive
  }

  function filteredRooms() {
    return Object.entries($rooms).filter(([_, room]) => {
      return levelFilter === null || room.level == levelFilter
    })
  }
</script>

<button class="admin-button" onclick={toggleAdmin}>ADMIN</button>

{#if adminActive}
  <div class="admin">
    <div class="container">
      <!-- LEVELS  -->
      <div class="title">LEVELS</div>
      <div class="level-list">
        <LevelHeader />
        {#each Object.entries($levels) as [levelId, level]}
          <LevelItemAdmin {levelId} {level} />
        {/each}
      </div>
      <!-- CREATE ROOM  -->
      <div class="title">Create room</div>
      <NewRoomAdmin />
      <!-- TOTAL ROOM COUNT -->
      <div class="total-rooms title">
        Rooms shown: {filteredRooms().length}/{Object.keys($rooms).length}
      </div>

      <!-- FILTER ROOMS BY LEVEL -->
      <div class="room-level-filter">
        <label for="level-filter">Filter rooms by level:</label>
        <input
          type="number"
          id="level-filter"
          bind:value={levelFilter}
          placeholder="Level"
        />
      </div>

      <!-- ROOM LIST -->
      <div class="room-list">
        {#each filteredRooms().reverse() as [roomId, room]}
          <RoomItemAdmin {roomId} {room} />
        {/each}
      </div>
    </div>
  </div>
{/if}

<style lang="scss">
  .admin-button {
    position: fixed;
    bottom: 0;
    left: 0;
    background-color: var(--color-secondary);
    color: white;
    padding: 10px;
    cursor: pointer;
    z-index: 1000;
    font-size: 6px;
  }

  .admin {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-color: var(--black);
    display: flex;
    justify-content: center;
    padding-top: 40px;
    z-index: 100;

    .container {
      width: 700px;
      max-width: 90vw;
      overflow-y: auto;

      .title {
        text-align: center;
        background: var(--white);
        color: var(--black);
        padding: 10px;
        font-weight: normal;
        margin-bottom: 20px;
        margin-top: 20px;
      }

      .room-level-filter {
        display: flex;
        flex-direction: column;
        align-items: center;
        margin-bottom: 20px;

        input {
          padding: 5px;
          font-size: 14px;
        }
      }
    }
  }
</style>
