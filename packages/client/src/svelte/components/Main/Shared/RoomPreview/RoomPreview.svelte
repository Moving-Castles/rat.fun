<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { PlotPoint } from "@components/Main/Shared/RoomStats/types"

  import { onMount } from "svelte"
  import { ratLevelIndex } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"
  import { playSound } from "@modules/sound"
  import { getRoomOwnerName } from "@modules/state/base/helpers"
  import { staticContent, lastUpdated, urlFor } from "@modules/content"
  import { rat } from "@modules/state/base/stores"
  import { loadData } from "@modules/content/sanity"
  import { queries } from "@modules/content/sanity/groq"

  import LiquidateRoom from "@components/Main/LeftContainer/YourRooms/LiquidateRoom.svelte"
  import RoomStats from "@components/Main/Shared/RoomStats/RoomStats.svelte"
  import RoomEventLog from "@components/Main/Shared/RoomEventLog/RoomEventLog.svelte"

  let {
    roomId,
    room,
    isOwnRoomListing,
  }: { roomId: Hex; room: Room; isOwnRoomListing: boolean } = $props()

  let sanityRoomContent = $derived(
    $staticContent.rooms.find(r => r.title == roomId)
  )

  let { rooms } = getUIState()

  let plotData: PlotPoint[] = $state([])
  let roomOutcomes = $state<Outcome[]>()

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.navigate("room", { roomId })
  }

  onMount(async () => {
    // Test to get outcomes for room
    const outcomes = (await loadData(queries.outcomesForRoom, {
      roomId,
    })) as Outcome[]

    // Sort the outcomes in order of creation
    outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
    roomOutcomes = outcomes
    // Map the values
    const computed = [
      {
        time: 0,
        roomValue: 250,
        meta: sanityRoomContent,
      },
      ...outcomes,
    ].map((o, i) => {
      return {
        time: i,
        value: o?.roomValue || 0,
        meta: o,
      }
    })

    plotData = computed
  })
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
        {#key $lastUpdated}
          {#if sanityRoomContent}
            <img
              src={urlFor(sanityRoomContent?.image)
                .width(600)
                .auto("format")
                .saturation(-100)
                .url()}
              alt={room.name}
            />
          {:else}
            <img src="/images/room3.jpg" alt={room.name} />
          {/if}
        {/key}
      </div>

      <!-- ROOM INFO -->
      <div class="room-info">
        <div class="room-info-row">
          <span class="index">Room #{room.index}</span>
          <!-- DIVIDER -->
          <span class="divider">•</span>
          <!-- OWNER -->
          <span class="owner">{getRoomOwnerName(room)}</span>
        </div>

        <div class="room-info-row">
          <!-- BALANCE -->
          <span class="balance">${room.balance}</span>
          <!-- DIVIDER -->
          <span class="divider">•</span>
          <!-- VISIT COUNT -->
          <span class="visit-count"
            >{room.visitCount} visit{#if room.visitCount > 1}s{/if}</span
          >
          <!-- KILL COUNT -->
          {#if room?.killCount > 0}
            <!-- DIVIDER -->
            <span class="divider">•</span>
            <span class="kill-count small">{room?.killCount}kills</span>
          {/if}
        </div>
      </div>

      <!-- Room prompt -->
      <div class="room-prompt">
        <div class="content">
          {room.roomPrompt}
        </div>
      </div>

      <!-- Enter Room -->
      {#if room.balance > 0 && ($rat?.health ?? 0) > 0 && !isOwnRoomListing}
        <div class="room-enter">
          <button onclick={sendEnterRoom}>Send {$rat.name} to room</button>
        </div>
      {/if}

      <!-- Room stats with graph -->
      <div class="room-stats">
        <RoomStats content={sanityRoomContent} data={plotData} />
      </div>

      <!-- Room event log -->
      {#if sanityRoomContent && roomOutcomes}
        <div class="room-event-log">
          <RoomEventLog
            room={sanityRoomContent}
            initialOutcomes={roomOutcomes}
          />
        </div>
      {/if}

      {#if ($rat?.health ?? 0) <= 0 && !isOwnRoomListing}
        <div class="no-rat-warning">Deploy a rat to access this room</div>
      {/if}

      <!-- Liquidate Room -->
      {#if isOwnRoomListing}
        <LiquidateRoom {roomId} {room} {isOwnRoomListing} />
      {/if}
    </div>
  </div>
{/if}

<style lang="scss">
  .room-preview {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow-y: hidden;

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
      overflow-y: scroll;

      .room-image {
        margin-bottom: 5px;
        img {
          width: 400px;
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
      word-break: break-word; /* Break long words if needed */
      overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */
      width: 100%;

      .content {
        max-width: 55ch;
        background: var(--color-alert);
        padding: 5px;
      }
    }

    .room-stats {
      height: 200px;
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
      margin-bottom: 20px;
    }
  }

  .no-rat-warning {
    background: var(--color-death);
    padding: 20px;
    margin-top: 15px;
    color: white;
    text-align: center;
  }

  .room-enter {
    position: sticky;
    bottom: 0;
    z-index: 1;
  }
</style>
