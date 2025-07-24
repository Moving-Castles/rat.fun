<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Room as SanityRoom } from "@sanity-types"

  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { rat } from "$lib/modules/state/stores"

  import {
    RoomPreviewHeader,
    RoomPreviewPrompt,
    RoomPreviewGraph,
    RoomPreviewEventLog,
    NoRatWarning,
    EnterRoomButton,
    LiquidateRoom
  } from "$lib/components/Shared"

  let {
    roomId,
    room,
    isOwnRoomListing,
    sanityRoomContent
  }: { roomId: Hex; room: Room; isOwnRoomListing: boolean; sanityRoomContent: SanityRoom } =
    $props()

  let roomOutcomes = $state<Outcome[]>()

  //  Show enter button if:
  //  * - Not in own room listing
  //  * - Room is not depleted
  //  * - Rat exists and is alive
  //  * - Room is at the same level as the rat
  let showEnterButton = $derived(
    !isOwnRoomListing && room.balance > 0 && ($rat?.health ?? 0) > 0 && room.level == $rat.level
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
    const outcomes = $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []

    // Sort the outcomes in order of creation
    roomOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<div class="room-inner-container">
  {#if isOwnRoomListing}
    <a class="back-button" href="/admin">Back</a>
  {:else}
    <a class="back-button" href="/">Back</a>
  {/if}
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

<style lang="scss">
  .room-inner-container {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    padding-bottom: calc(var(--pane-switch-height) + var(--world-prompt-box-height) + 20px);
    overflow-x: hidden;
  }

  .back-button {
    display: block;
    color: var(--color-grey-light);
    border-bottom: 1px solid var(--color-grey-mid);
    padding: 0 12px;
    position: sticky;
    height: 60px;
    top: 0;
    line-height: 60px;
    font-family: var(--special-font-stack);
    font-size: 20px;
    text-transform: uppercase;
    background: var(--background-semi-transparent);

    &:hover {
      color: var(--white);
    }
  }
</style>
