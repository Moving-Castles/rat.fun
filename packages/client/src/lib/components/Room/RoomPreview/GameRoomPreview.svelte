<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Room as SanityRoom } from "@sanity-types"

  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { rat, ratTotalValue } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"
  import { getRoomMinRatValueToEnter } from "$lib/modules/state/utils"

  import {
    RoomPreviewHeader,
    RoomPreviewPrompt,
    EnterRoomButton,
    NoRatWarning
  } from "$lib/components/Room"

  let {
    roomId,
    room,
    sanityRoomContent
  }: { roomId: Hex; room: Room; sanityRoomContent: SanityRoom } = $props()

  let minRatValueToEnter = getRoomMinRatValueToEnter(room.roomCreationCost)

  let roomOutcomes = $state<Outcome[]>()

  //  Show enter button if:
  //  * - Room is not depleted
  //  * - Rat exists and is alive
  //  * - TODO: rat has min value to enter
  let showEnterButton = $derived((room?.balance ?? 0) > 0 && !$rat?.dead)

  // Show no rat warning if:
  //  * - Rat does not exist or is dead
  let showNoRatWarning = $derived($rat?.dead)

  onMount(() => {
    const outcomes = $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []

    // Sort the outcomes in order of creation
    roomOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<div class="game-room-preview">
  <!-- Back Button -->
  <a class="back-button" href="/">
    <div>Back</div>
  </a>

  <!-- Header -->
  <div class="room-header">
    <RoomPreviewHeader {room} {sanityRoomContent} />
  </div>

  <!-- Prompt -->
  <div class="room-prompt">
    <RoomPreviewPrompt {room} />
  </div>

  <!-- Bottom section -->
  <div class="room-bottom">
    {#if showNoRatWarning}
      <NoRatWarning />
    {/if}

    {#if showEnterButton}
      <EnterRoomButton
        {room}
        disabled={busy.LiquidateRat.current != 0 || ($ratTotalValue || 0) < $minRatValueToEnter}
        {roomId}
      />
    {/if}
  </div>

  <!-- <RoomPreviewGraph {room} {roomOutcomes} {sanityRoomContent} /> -->
  <!-- <RoomPreviewEventLog {roomId} {roomOutcomes} /> -->
</div>

<style lang="scss">
  .game-room-preview {
    display: flex;
    flex-direction: column;
    flex-shrink: 0;
    height: 100%;
    width: 100%;
    max-height: 100%;
    overflow: hidden;

    .room-header {
      width: 100%;
      border-bottom: var(--default-border-style);
      flex-shrink: 0;
      overflow: hidden;
    }

    .room-prompt {
      flex: 1; /* Take remaining space */
      width: 100%;
      overflow-y: auto;
      overflow-x: hidden;
      min-height: 0;
    }

    .room-bottom {
      height: var(--liquidate-rat-height);
      width: 100%;
      border-top: var(--default-border-style);
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .back-button {
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--color-grey-light);
    border-bottom: 1px solid var(--color-grey-mid);
    padding: 0 12px;
    height: 60px;
    font-family: var(--special-font-stack);
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    background: var(--background-semi-transparent);
    flex-shrink: 0;

    &:hover {
      color: var(--white);
    }
  }
</style>
