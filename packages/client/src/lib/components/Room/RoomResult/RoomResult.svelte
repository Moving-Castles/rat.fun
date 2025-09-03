<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { onDestroy } from "svelte"
  import { rooms as roomsState } from "$lib/modules/state/stores"
  import { ROOM_RESULT_STATE, SHOW_INFO_BOXES } from "$lib/components/Room/RoomResult/state.svelte"
  import {
    SplashScreen,
    WaitingForResult,
    Log,
    RatInfoBox,
    RoomInfoBox,
    NormalResultSummary,
    RatDeadResultSummary
  } from "$lib/components/Room"
  import { staticContent } from "$lib/modules/content"

  let {
    roomId,
    entryState,
    transitionTo,
    transitionToResultSummary
  }: {
    roomId: string
    entryState: App.PageState["entryState"]
    transitionTo: (newState: ROOM_RESULT_STATE) => void
    transitionToResultSummary: (result?: EnterRoomReturnValue) => void
  } = $props()

  let timeout: ReturnType<typeof setTimeout> = $state()
  let destroyed = false

  // Get room info from global store based on id
  let room = $derived($roomsState?.[roomId ?? ""])
  let result = $derived(entryState?.result)

  // Get static room content from cms
  let staticRoomContent = $derived($staticContent.rooms.find(r => r._id == (roomId ?? "")))

  onDestroy(() => {
    destroyed = true
    clearTimeout(timeout)
  })
</script>

<div class="room-result">
  <!-- SPLASH SCREEN -->
  {#if entryState?.state === ROOM_RESULT_STATE.SPLASH_SCREEN}
    <SplashScreen
      {staticRoomContent}
      onComplete={() => {
        if (destroyed) return
        transitionTo(ROOM_RESULT_STATE.WAITING_FOR_RESULT)
      }}
    />
  {/if}

  <!-- INFO BOXES -->
  {#if SHOW_INFO_BOXES.includes(entryState?.state || ROOM_RESULT_STATE.SPLASH_SCREEN)}
    <div class="info-boxes">
      <RatInfoBox />
      <div class="divider"></div>
      <RoomInfoBox {staticRoomContent} />
    </div>
  {/if}

  <!-- WAITING FOR RESULT -->
  {#if entryState?.state === ROOM_RESULT_STATE.WAITING_FOR_RESULT}
    <WaitingForResult />
  {/if}

  <!-- LOG -->
  {#if entryState?.state === ROOM_RESULT_STATE.SHOWING_RESULTS || (entryState?.state
      ?.toLowerCase()
      .includes("summary") && result)}
    <Log
      {result}
      onComplete={() => {
        console.log("COMPLETE")
        transitionToResultSummary(result)
      }}
    />
  {/if}

  {#if entryState?.state === ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL}
    <NormalResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Rat Dead -->
  {#if entryState?.state === ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD}
    <RatDeadResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Error -->
  {#if entryState?.state === ROOM_RESULT_STATE.ERROR}
    <div class="error">
      {entryState?.errorMessage}
    </div>
  {/if}
</div>

<style lang="scss">
  .room-result {
    height: 100%;
    color: var(--white);
    z-index: var(--z-high);
    font-size: var(--font-size-normal);
    overflow-y: auto;
    top: 32px;
  }

  .info-boxes {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: var(--info-box-height);
  }

  .divider {
    width: 100px;
    height: 100%;
    background: repeating-linear-gradient(
      45deg,
      #000000,
      #000000 20px,
      var(--color-grey-dark) 20px,
      var(--color-grey-dark) 40px
    );
    border: var(--default-border-style);
  }
</style>
