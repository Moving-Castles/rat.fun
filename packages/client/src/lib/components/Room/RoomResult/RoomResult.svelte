<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import { onDestroy } from "svelte"
  import { rooms as roomsState } from "$lib/modules/state/stores"
  import {
    ROOM_RESULT_STATE,
    SHOW_INFO_BOXES,
    SHOW_LOG
  } from "$lib/components/Room/RoomResult/state.svelte"
  import {
    SplashScreen,
    WaitingForResult,
    Log,
    RatInfoBox,
    RoomInfoBox,
    NormalResultSummary,
    RatDeadResultSummary,
    LevelUpResultSummary,
    LevelDownResultSummary
  } from "$lib/components/Room"
  import { staticContent } from "$lib/modules/content"
  import { sendEnterRoom } from "$lib/modules/action-manager/index.svelte"
  import { RoomError } from "$lib/modules/error-handling/errors"

  let {
    roomId,
    entryState,
    transitionTo,
    transitionToResultSummary
  }: {
    roomId: string
    entryState: App.PageState["entryState"]
    transitionTo: (newState: ROOM_RESULT_STATE) => void
    transitionToResultSummary: (result: EnterRoomReturnValue) => void
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

{#if import.meta.DEV}
  <p>
    ROom state {entryState.state}
  </p>
{/if}

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
  {#if entryState?.state === ROOM_RESULT_STATE.SHOWING_RESULTS && result}
    BOTH THERE
    <Log
      {result}
      onComplete={() => {
        console.log(performance.now() + " Completed")
        timeout = setTimeout(() => {
          if (result) {
            transitionToResultSummary(result)
          }
        }, 500)
      }}
    />
  {/if}

  <!-- Result Summary: Normal -->
  {#if entryState?.state === ROOM_RESULT_STATE.RESULT_SUMMARY_NORMAL}
    <NormalResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Rat Dead -->
  {#if entryState?.state === ROOM_RESULT_STATE.RESULT_SUMMARY_RAT_DEAD}
    <RatDeadResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Level Up -->
  {#if entryState?.state === ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_UP}
    <LevelUpResultSummary {result} {room} {staticRoomContent} />
  {/if}

  <!-- Result Summary: Level Down -->
  {#if entryState?.state === ROOM_RESULT_STATE.RESULT_SUMMARY_LEVEL_DOWN}
    <LevelDownResultSummary {result} {room} {staticRoomContent} />
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
