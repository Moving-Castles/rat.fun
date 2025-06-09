<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"

  import { onMount } from "svelte"
  import { staticContent } from "@modules/content"
  import { rat } from "@modules/state/base/stores"

  import RoomPreviewHeader from "@components/Main/Shared/RoomPreview/RoomPreviewHeader.svelte"
  import RoomPreviewPrompt from "@components/Main/Shared/RoomPreview/RoomPreviewPrompt.svelte"
  import RoomPreviewGraph from "@components/Main/Shared/RoomPreview/RoomPreviewGraph.svelte"
  import RoomPreviewEventLog from "@components/Main/Shared/RoomPreview/RoomPreviewEventLog.svelte"
  import NoRatWarning from "@components/Main/Shared/RoomPreview/NoRatWarning.svelte"
  import EnterRoomButton from "@components/Main/Shared/RoomPreview/EnterRoomButton.svelte"
  import LiquidateRoom from "@components/Main/Shared/RoomPreview/LiquidateRoom.svelte"

  let {
    roomId,
    room,
    isOwnRoomListing,
  }: { roomId: Hex; room: Room; isOwnRoomListing: boolean } = $props()

  let sanityRoomContent = $derived(
    $staticContent?.rooms?.find(r => r.title == roomId)
  )

  let roomOutcomes = $state<Outcome[]>()

  //  Show enter button if:
  //  * - Not in own room listing
  //  * - Room is not depleted
  //  * - Rat exists and is alive
  //  * - Room is at the same level as the rat
  let showEnterButton = $derived(
    !isOwnRoomListing &&
      room.balance > 0 &&
      ($rat?.health ?? 0) > 0 &&
      room.level == $rat.level
  )

  // Show no rat warning if:
  //  * - Not in own room listing
  //  * - Rat does not exist or is dead
  let showNoRatWarning = $derived(!isOwnRoomListing && ($rat?.health ?? 0) <= 0)

  // Show liquidate button if:
  //  * - In own room listing
  //  * - Room is not depleted
  let showLiquidateButton = $derived(isOwnRoomListing && room.balance > 0)

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

      {#if showLiquidateButton}
        <LiquidateRoom {roomId} {room} {isOwnRoomListing} />
      {/if}

      {#if showNoRatWarning}
        <NoRatWarning />
      {/if}

      {#if showEnterButton}
        <EnterRoomButton {roomId} />
      {/if}

      <RoomPreviewGraph {roomOutcomes} {sanityRoomContent} />
      <RoomPreviewEventLog {roomId} {roomOutcomes} />
    </div>
  </div>
{/if}

<style lang="scss">
  .room-preview {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    background-image: url("/images/texture2.jpg");
    background-size: 100px;

    .room-inner-container {
      overflow-y: auto;
      flex: 1;
      min-height: 0;
      height: 100%;
      padding-bottom: calc(
        var(--pane-switch-height) + var(--world-prompt-box-height) + 20px
      );
    }
  }
</style>
