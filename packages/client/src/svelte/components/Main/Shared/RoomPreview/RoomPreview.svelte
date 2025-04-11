<script lang="ts">
  import type { Hex } from "viem"
  import { ratTotalValue, ratLevelIndex } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"
  import { playSound } from "@svelte/modules/sound"
  import { getRoomOwnerName } from "@svelte/modules/state/base/helpers"
  import { rat } from "@svelte/modules/state/base/stores"
  import { closeRoom } from "@svelte/modules/action"
  import { waitForCompletion } from "@svelte/modules/action/actionSequencer/utils"

  import Spinner from "@components/Main/Shared/Spinner/Spinner.svelte"

  let busy = $state(false)

  let {
    roomId,
    room,
    isOwnRoomListing,
  }: { roomId: Hex; room: Room; isOwnRoomListing: boolean } = $props()

  let { rooms } = getUIState()

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.navigate("room", { roomId })
  }

  async function sendCloseRoom() {
    if (busy) return
    playSound("tcm", "blink")
    busy = true
    const action = closeRoom(roomId)
    try {
      await waitForCompletion(action)
    } catch (e) {
      console.error(e)
    } finally {
      busy = false
      rooms.back(isOwnRoomListing)
    }
  }
</script>

{#if room}
  <div class="room-preview">
    <button class="back-button" onclick={() => rooms.back(isOwnRoomListing)}>
      {#if isOwnRoomListing}
        ← BACK TO YOUR ROOMS
      {:else}
        ← BACK TO FLOOR {$ratLevelIndex * -1}
      {/if}
    </button>

    <div class="room-inner-container">
      <!-- ROOM IMAGE -->
      <div class="room-image">
        <img src="/images/room3.jpg" alt={room.name} />
      </div>

      <!-- ROOM INFO -->
      <div class="room-info">
        <div class="room-info-row">
          <span class="index">Room #{room.index}</span>
        </div>

        <div class="room-info-row">
          <!-- NAME -->
          <span class="name">{room.name}</span>
        </div>

        <div class="room-info-row">
          <!-- OWNER -->
          <span class="owner">{getRoomOwnerName(room)}</span>
          <!-- DIVIDER -->
          <span class="divider">•</span>
          <!-- BALANCE -->
          <span class="balance">${room.balance}</span>
          <!-- DIVIDER -->
          <span class="divider">•</span>
          <!-- VISIT COUNT -->
          <span class="visit-count">{room.visitCount} visits</span>
          <!-- DIVIDER -->
          <span class="divider">•</span>
          <!-- KILL COUNT -->
          <span class="kill-count">{room.killCount} kills</span>
        </div>
      </div>

      <div class="room-prompt">
        {room.roomPrompt}
      </div>

      <!-- <div class="room-recent-events">TODO: RECENT EVENTS</div> -->

      {#if room.balance > 0 && $ratTotalValue > 0 && !isOwnRoomListing}
        <div class="room-enter">
          <button onclick={sendEnterRoom}>Send {$rat.name} to room</button>
        </div>
      {/if}

      {#if isOwnRoomListing}
        <div class="room-close">
          <button disabled={busy} onclick={sendCloseRoom}>
            {#if busy}
              <Spinner />
            {:else}
              Close room (get ${room.balance})
            {/if}
          </button>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .room-preview {
    display: flex;
    flex-direction: column;
    width: 100%;

    .back-button {
      width: 100%;
      height: 60px;
      background: transparent;
      border: none;
      color: white;
      text-transform: uppercase;
      border-bottom: 1px solid white;

      &:hover {
        background-color: #222;
      }
    }

    .room-inner-container {
      padding: 15px;

      .room-image {
        margin-bottom: 5px;
        img {
          width: 300px;
          aspect-ratio: 4/3;
          object-fit: cover;
          border: 1px solid var(--color-grey-mid);
        }
      }

      .room-info {
        border-bottom: 1px solid var(--color-grey-mid);
        padding-bottom: 5px;
        margin-bottom: 5px;

        .room-info-row {
          display: flex;
          margin-bottom: 5px;
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
        }

        .name {
          background: var(--color-alert);
          color: black;
          padding: 5px;
        }

        .balance {
          background: var(--color-value);
          color: black;
          padding: 5px;
        }

        .owner {
          background: var(--color-grey-light);
          color: black;
          padding: 5px;
        }

        .index {
          color: var(--color-grey-mid);
        }
      }
    }

    .room-prompt {
      margin-top: 15px;
      padding-bottom: 15px;
      border-bottom: 1px solid var(--color-grey-mid);
      margin-bottom: 15px;
    }

    .room-recent-events {
      background: var(--color-grey-mid);
      height: 200px;
    }

    button {
      width: 100%;
      height: 100%;
      background: var(--color-alert);
      padding: 20px;
    }
  }
</style>
