<script lang="ts">
  import type { Hex } from "viem"
  import type { Outcome } from "@sanity-types"
  import type { Room as SanityRoom } from "@sanity-types"

  import { onMount } from "svelte"
  import { staticContent } from "$lib/modules/content"
  import { page } from "$app/state"
  import { goto } from "$app/navigation"

  import {
    RoomPreviewHeader,
    RoomPreviewPrompt,
    RoomPreviewGraph,
    RoomPreviewEventLog,
    RoomConfirmLiquidation,
    LiquidateRoom
  } from "$lib/components/Room"

  let {
    roomId,
    room,
    sanityRoomContent
  }: { roomId: Hex; room: Room; sanityRoomContent: SanityRoom } = $props()

  let roomOutcomes = $state<Outcome[]>()

  // Show liquidate button if:
  //  * - Room is not depleted
  let showLiquidateButton = $derived(room.balance > 0)

  let liquidating = $state(false)

  onMount(() => {
    liquidating = page.url.searchParams.has("liquidate")
    const outcomes = $staticContent?.outcomes?.filter(o => o.roomId == roomId) || []

    // Sort the outcomes in order of creation
    roomOutcomes = outcomes.sort((a, b) => {
      return new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    })
  })
</script>

<a class="back-button" href="/admin">Back</a>
{#if !liquidating}
  <div class="room-inner-container" class:depleted={!showLiquidateButton}>
    <RoomPreviewGraph {room} {roomOutcomes} {sanityRoomContent} />
    <RoomPreviewPrompt {room} />

    {#if showLiquidateButton}
      <LiquidateRoom onclick={() => (liquidating = true)} {roomId} {room} isOwnRoomListing={true} />
    {/if}

    <RoomPreviewEventLog {roomId} {roomOutcomes} />
  </div>
{:else}
  <RoomConfirmLiquidation
    {room}
    roomContent={sanityRoomContent}
    onDone={async () => {
      await goto("/admin")
      liquidating = false
    }}
    onAbort={() => {
      liquidating = false
    }}
  />
{/if}

<style lang="scss">
  .room-inner-container {
    overflow-y: auto;
    flex: 1;
    min-height: 0;
    height: 100%;
    max-height: 100%;
    padding-bottom: calc(var(--pane-switch-height) + var(--world-prompt-box-height) + 20px);
    overflow-x: hidden;

    &.depleted {
      filter: grayscale(0.8) contrast(0.7);
    }
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
    font-size: var(--font-size-normal);
    text-transform: uppercase;
    background: var(--background-semi-transparent);
    z-index: 10;

    &:hover {
      color: var(--white);
    }
  }
</style>
