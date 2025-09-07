<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Room as SanityRoom } from "@sanity-types"

  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { rat } from "$lib/modules/state/stores"
  import { busy } from "$lib/modules/action-manager/index.svelte"

  import {
    RoomPreviewHeader,
    RoomPreviewPrompt,
    RoomPreviewGraph,
    RoomPreviewEventLog,
    NoRatWarning,
    EnterRoomButton
  } from "$lib/components/Room"

  let {
    roomId,
    room,
    sanityRoomContent
  }: { roomId: Hex; room: Room; sanityRoomContent: SanityRoom } = $props()

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

<a class="back-button" href="/">Back</a>
<div class="room-inner-container">
  <RoomPreviewHeader {room} {sanityRoomContent} />
  <RoomPreviewPrompt {room} />

  {#if showNoRatWarning}
    <NoRatWarning />
  {/if}

  {#if showEnterButton}
    <EnterRoomButton
      disabled={busy.LiquidateRat.current != 0 || $rat.balance < room.minRatValueToEnter}
      {roomId}
    />
  {/if}

  <RoomPreviewGraph {room} {roomOutcomes} {sanityRoomContent} />
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
