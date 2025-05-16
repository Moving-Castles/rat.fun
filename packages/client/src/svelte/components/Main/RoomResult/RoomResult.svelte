<script lang="ts">
  import type { EnterRoomReturnValue } from "@server/modules/types"
  import type { Hex } from "viem"
  import { RESULT_POPUP_STATE } from "@modules/ui/enums"
  import ModalTarget from "@components/Main/Modal/ModalTarget.svelte"

  import {
    player,
    rooms as roomsState,
    rat as ratState,
  } from "@modules/state/base/stores"
  import { enterRoom } from "@components/Main/RoomResult"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"

  import Log from "@components/Main/RoomResult/Log/Log.svelte"
  import RoomMeta from "@components/Main/RoomResult/RoomMeta/RoomMeta.svelte"
  import RatInfoBox from "@components/Main/RoomResult/InfoBox/Rat/RatInfoBox.svelte"
  import RoomInfoBox from "@components/Main/RoomResult/InfoBox/Room/RoomInfoBox.svelte"
  import { getUIState } from "@modules/ui/state.svelte"
  import RoomEventPopup from "../Shared/RoomEventPopup/RoomEventPopup.svelte"
  import { staticContent } from "@modules/content"

  const { rooms } = getUIState()

  let {
    start,
    animationstart,
    environment,
    roomId,
  }: {
    start: boolean
    animationstart: boolean
    environment: ENVIRONMENT
    roomId: string | null
  } = $props()

  let animationstarted = $state(false)

  let busy = $state(false)
  let error = $state("")

  let entering = $state(true)
  let result: EnterRoomReturnValue | null = $state(null)

  let popupState: RESULT_POPUP_STATE = $state(RESULT_POPUP_STATE.NONE)

  let room = $derived($roomsState?.[roomId ?? ""])

  let sanityRoomContent = $derived(
    $staticContent.rooms.find(r => r._id == (roomId ?? ""))
  )

  $effect(() => {
    if (animationstart) animationstarted = true
  })

  const checkEvents = async () => {
    // console.log("CHecking result")
    // console.log($state.snapshot(result))
    // console.log($state.snapshot($frozenRat))
    // Rat death 1st priority
    // Room depleted 2nd
    // Level up / Level Down 3rd
    if (result.ratDead) {
      popupState = RESULT_POPUP_STATE.RAT_DEAD
    } else if (result.roomDepleted) {
      popupState = RESULT_POPUP_STATE.ROOM_DEPLETED
    } else if (result.levelUp) {
      popupState = RESULT_POPUP_STATE.LEVEL_UP
    } else if (result.levelDown) {
      popupState = RESULT_POPUP_STATE.LEVEL_DOWN
    }

    // Testing. Remove this
    popupState = RESULT_POPUP_STATE.LEVEL_UP
  }

  const processRoom = async () => {
    console.time("Process")
    if (!roomId) return
    try {
      // console.log("start result")
      const ret = enterRoom(
        environment,
        $walletNetwork,
        roomId,
        $player.ownedRat
      )

      await new Promise(resolve => setTimeout(resolve, 5000))

      entering = false

      try {
        // console.log("start outcome ")
        result = await ret // add here just in case the entering transition would be faster
      } catch (err) {
        console.log("catch outcome error", err)
        throw err
      }
    } catch (error) {
      console.log("catch result error", error)
      entering = false
      rooms.close()
    }
  }

  $effect(() => {
    if (start && !busy) {
      busy = true
      // console.log("start")
      processRoom()
    }
  })
</script>

<div class="room-result">
  {#if entering && animationstarted}
    <RoomMeta rat={$ratState} {room} roomId={roomId as Hex} />
  {:else}
    <!-- INFO BOXES -->
    <div class="info-boxes">
      <RatInfoBox />
      <div class="divider"></div>
      <RoomInfoBox roomId={roomId as Hex} />
    </div>
    <!-- LOG -->
    <Log {result} {animationstarted} onComplete={checkEvents} />
    <!-- ERROR -->
    {#if error}
      <div class="error">
        {error}
      </div>
    {/if}
  {/if}
</div>

{#snippet event()}
  <RoomEventPopup {result} {popupState} {room} {sanityRoomContent} />
{/snippet}

{#if popupState !== RESULT_POPUP_STATE.NONE && result !== null}
  <ModalTarget content={event} />
{/if}

<style lang="scss">
  .room-result {
    height: 100%;
    color: var(--white);
    z-index: 10000;
    padding: 20px;
    padding-bottom: 0;
    font-size: var(--font-size-normal);
    overflow-y: auto;
    border: var(--default-border-style);
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
