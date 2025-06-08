<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"

  import { onMount } from "svelte"
  import { getUIState } from "@modules/ui/state.svelte"
  import { playSound } from "@modules/sound"
  import { staticContent } from "@modules/content"
  import { rat } from "@modules/state/base/stores"

  import RoomPreviewHeader from "@components/Main/Shared/RoomPreview/RoomPreviewHeader.svelte"
  import RoomPreviewPrompt from "@components/Main/Shared/RoomPreview/RoomPreviewPrompt.svelte"
  import RoomPreviewGraph from "@components/Main/Shared/RoomPreview/RoomPreviewGraph.svelte"
  import LiquidateRoom from "@components/Main/RoomContainer/YourRooms/LiquidateRoom.svelte"
  import RoomPreviewEventLog from "@components/Main/Shared/RoomPreview/RoomPreviewEventLog.svelte"

  let {
    roomId,
    room,
    isOwnRoomListing,
  }: { roomId: Hex; room: Room; isOwnRoomListing: boolean } = $props()

  let sanityRoomContent = $derived(
    $staticContent?.rooms?.find(r => r.title == roomId)
  )

  let { rooms } = getUIState()

  let roomOutcomes = $state<Outcome[]>()

  const sendEnterRoom = () => {
    playSound("tcm", "enteredPod")
    rooms.navigate("room", { roomId })
  }

  onMount(() => {
    const outcomes =
      $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []

    // Sort the outcomes in order of creation
    roomOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

{#if room}
  <div class="room-preview">
    <div class="room-inner-container">
      <RoomPreviewHeader {room} {sanityRoomContent} />
      <RoomPreviewPrompt {room} />
      <RoomPreviewGraph {roomOutcomes} {sanityRoomContent} />
      <RoomPreviewEventLog {roomId} {roomOutcomes} />

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

  .no-rat-warning,
  .room-enter {
    position: sticky;
    bottom: 80px;
    z-index: var(--z-high);
  }
</style>
