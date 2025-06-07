<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { PlotPoint } from "@components/Main/Shared/RoomStats/types"

  import { onMount } from "svelte"
  import { ratLevelIndex } from "@modules/state/base/stores"
  import { getUIState } from "@modules/ui/state.svelte"
  import { playSound } from "@modules/sound"
  import { getRoomOwnerName } from "@modules/state/base/utils"
  import { staticContent, lastUpdated } from "@modules/content"
  import { urlFor } from "@modules/content/sanity"
  import { rat } from "@modules/state/base/stores"

  import { clickToCopy, renderSafeString } from "@modules/utils"

  import LiquidateRoom from "@components/Main/RoomContainer/YourRooms/LiquidateRoom.svelte"
  import RoomStats from "@components/Main/Shared/RoomStats/RoomStats.svelte"
  import RoomEventLog from "@components/Main/Shared/RoomEventLog/RoomEventLog.svelte"
  import NoImage from "@components/Main/Shared/NoImage/NoImage.svelte"

  let {
    roomId,
    room,
    isOwnRoomListing,
  }: { roomId: Hex; room: Room; isOwnRoomListing: boolean } = $props()

  let sanityRoomContent = $derived(
    $staticContent?.rooms?.find(r => r.title == roomId)
  )

  let { rooms } = getUIState()

  let shareText = $state<"Share" | "Copied" | "Failed">("Share")
  let plotData: PlotPoint[] = $state([])
  let roomOutcomes = $state<Outcome[]>()

  let oncopysuccess = () => {
    shareText = "Copied"
    setTimeout(() => {
      shareText = "Share"
    }, 3000)
  }

  let oncopyfail = () => {
    shareText = "Failed"
    setTimeout(() => {
      shareText = "Share"
    }, 3000)
  }

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.navigate("room", { roomId })
  }

  let copyShareLink = $derived(
    `${window.location.protocol + "//" + window.location.host + window.location.pathname}#${roomId}`
  )

  onMount(() => {
    const outcomes =
      $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []

    // Sort the outcomes in order of creation
    outcomes.sort((a, b) => {
      return new Date(b._createdAt).getTime() - new Date(a._createdAt).getTime()
    })

    roomOutcomes = outcomes.reverse()

    // Map the values
    const computed = [
      {
        time: 0,
        roomValue: 250,
        meta: sanityRoomContent,
      },
      ...roomOutcomes,
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
    <div class="room-inner-container">
      <!-- HEADER -->
      <div class="room-header">
        <!-- IMAGE -->
        <div class="room-image">
          {#key $lastUpdated}
            {#if sanityRoomContent}
              <img
                src={urlFor(sanityRoomContent?.image)
                  .width(600)
                  .auto("format")
                  // .saturation(-100)
                  .url()}
                alt={`room #${room.index}`}
              />
            {:else}
              <div class="image-placeholder">
                <NoImage />
              </div>
            {/if}
          {/key}
        </div>
        <!-- INFO -->
        <div class="room-info">
          <!-- INDEX -->
          <div class="row index">
            <div class="label">Room</div>
            <div class="value">#{room.index}</div>
          </div>
          <!-- OWNER -->
          <div class="row">
            <div class="label">Owner</div>
            <div class="value">{getRoomOwnerName(room)}</div>
          </div>
          <!-- BALANCE -->
          <div class="row balance" class:depleted={Number(room.balance) == 0}>
            <div class="label">Balance</div>
            <div class="value">${room.balance}</div>
          </div>
          <!-- VISIT COUNT -->
          <div class="row visit-count">
            <div class="label">Visits</div>
            <div class="value">
              {room.visitCount} visit{#if room.visitCount > 1}s{/if}
            </div>
          </div>
          <!-- KILL COUNT -->
          {#if room?.killCount > 0}
            <div class="row kill-count">
              <div class="label">Kills</div>
              <div class="value">{room?.killCount} kills</div>
            </div>
          {/if}
          <!-- <button
            use:clickToCopy={copyShareLink}
            {oncopysuccess}
            {oncopyfail}
            class:success={shareText === "Copied"}
            class:failed={shareText === "Failed"}
            class="share-button"
          >
            {shareText}
          </button> -->
        </div>
      </div>

      <!-- Room prompt -->
      <div class="room-prompt">
        <div class="content">
          {renderSafeString(room.prompt)}
        </div>
      </div>

      <!-- Room stats with graph -->
      <div class="room-stats">
        <div class="header">Room balance over time</div>
        <div class="content" class:empty={plotData.length == 1}>
          <RoomStats {plotData} empty={plotData.length == 1} />
        </div>
      </div>

      <!-- Room event log -->
      {#if roomOutcomes}
        <div class="room-event-log">
          <RoomEventLog {roomId} initialOutcomes={roomOutcomes} />
        </div>
      {/if}

      <!-- Liquidate Room -->
      {#if isOwnRoomListing && room.balance > 0}
        <LiquidateRoom {roomId} {room} {isOwnRoomListing} />
      {/if}
    </div>

    {#if ($rat?.health ?? 0) <= 0 && !isOwnRoomListing}
      <div class="no-rat-warning">Deploy a rat to access this room</div>
    {/if}

    <!--
     Show enter button if:
     * - Not in own room listing
     * - Room is not depleted
     * - Rat exists and is alive
     * - Room is at the same level as the rat
     -->
    {#if !isOwnRoomListing && room.balance > 0 && ($rat?.health ?? 0) > 0 && room.level == $rat.level}
      <div class="room-enter">
        <button onclick={sendEnterRoom}>Send {$rat.name} to room</button>
      </div>
    {/if}
  </div>
{/if}

<style lang="scss">
  .room-preview {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;

    .room-inner-container {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      height: 100%;
      padding-bottom: calc(
        var(--pane-switch-height) + var(--world-prompt-box-height) + 20px
      );

      .room-header {
        border-bottom: var(--default-border-style);
        display: flex;
        flex-direction: row;

        .room-image {
          border: 15px solid transparent;
          border-image: url("/images/border-2.png") 20 repeat;
          aspect-ratio: 1/1;
          width: 330px;
          line-height: 0;

          img {
            height: 300px;
            aspect-ratio: 1/1;
            object-fit: cover;
            border: var(--default-border-style);
          }

          .image-placeholder {
            height: 300px;
            aspect-ratio: 1/1;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 15px;
          }
        }

        .room-info {
          display: flex;
          flex-direction: column;
          width: 100%;

          .row {
            width: 100%;
            border-bottom: var(--default-border-style);
            height: 40px;
            padding-inline: 5px;
            display: flex;
            flex-direction: row;
            justify-content: space-between;
            align-items: center;

            .label {
              font-size: var(--font-size-small);
            }
          }
        }

        .name {
          background: var(--color-alert);
          color: var(--background);
          padding: 5px;
        }

        .balance {
          background: var(--color-value);
          color: var(--background);
          padding: 5px;

          &.depleted {
            background: var(--color-death);
            color: var(--background);
          }
        }

        .owner {
          background: var(--color-grey-light);
          color: var(--background);
          padding: 5px;
        }

        .share-button {
          background: var(--color-alert);
          color: var(--white);
          width: auto;
          padding: 5px;
          margin: 0;

          &.success {
            background: var(--color-alert-priority);
          }
          &.failed {
            background: var(--color-death);
          }
        }

        .index {
          color: var(--color-grey-mid);
        }
      }

      .room-prompt {
        padding-bottom: 15px;
        border-bottom: 1px solid var(--color-grey-mid);
        word-break: break-word; /* Break long words if needed */
        overflow-wrap: anywhere; /* Break anywhere if necessary to prevent overflow */
        width: 100%;
        font-family: var(--special-font-stack);
        font-size: 24px;
        background: var(--color-alert);
        min-height: 100px;
        background: url("/images/bg-test.jpg");

        .content {
          max-width: 55ch;
          padding: 5px;
        }
      }

      .room-stats {
        margin-bottom: 15px;

        .header {
          border-left: 1px solid var(--color-grey-mid);
          border-top: 1px solid var(--color-grey-mid);
          border-right: 1px solid var(--color-grey-mid);
          border-bottom: 1px dashed var(--color-grey-mid);
          padding: 12px;
          display: flex;
          justify-content: space-between;
          top: 0;
          background: var(--background);
        }

        .content {
          height: 300px;
          border-right: 1px solid var(--color-grey-mid);

          &.empty {
            height: 100px;
          }
        }
      }

      .room-recent-events {
        background: var(--color-grey-mid);
        height: 200px;
      }
    }

    button {
      width: 100%;
      height: 100%;
      background: var(--color-alert-priority);
      padding: 20px;
      margin-bottom: 20px;
      border: none;
      border-top: var(--default-border-style);

      &:hover {
        background: var(--color-alert);
        color: var(--foreground);
      }
    }
  }

  .no-rat-warning {
    background: var(--color-death);
    padding: 20px 20px;
    color: var(--foreground);
    text-align: center;
  }

  .share-button {
    display: inline-block;
    padding: 0;
    margin: 0;
  }

  .no-rat-warning,
  .room-enter {
    position: sticky;
    bottom: 80px;
    z-index: 100;
  }
</style>
