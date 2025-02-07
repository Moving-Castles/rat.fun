<script lang="ts">
  import { rooms } from "@modules/state/base/stores"
  import NewRoomAdmin from "@components/Admin/NewRoomAdmin.svelte"
  import RoomItemAdmin from "@components/Admin/RoomItemAdmin.svelte"

  let adminActive = false
  let levelFilter: number | null = null

  function toggleAdmin() {
    adminActive = !adminActive
  }

  function filteredRooms() {
    return Object.entries($rooms).filter(([_, room]) => {
      return levelFilter === null || room.level == levelFilter
    })
  }
</script>

<button class="admin-button" on:click={toggleAdmin}>ADMIN</button>

{#if adminActive}
  <div class="admin">
    <div class="container">
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
    top: 0;
    right: 0;
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
