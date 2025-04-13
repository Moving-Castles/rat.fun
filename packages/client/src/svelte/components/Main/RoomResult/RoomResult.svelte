<script lang="ts">
  import type { ServerReturnValue } from "@components/Main/RoomResult/types"
  import {
    player,
    rooms as roomsState,
    rat as ratState,
  } from "@modules/state/base/stores"
  import { enterRoom } from "@components/Main/RoomResult"
  import { ENVIRONMENT } from "@mud/enums"
  import { walletNetwork } from "@modules/network"

  import { freezeObjects } from "@svelte/components/Main/RoomResult/state.svelte"

  import Log from "@components/Main/RoomResult/Log/Log.svelte"
  import RoomMeta from "@svelte/components/Main/RoomResult/RoomMeta/RoomMeta.svelte"
  import RatInfoBox from "@svelte/components/Main/RoomResult/InfoBox/Rat/RatInfoBox.svelte"
  import RoomInfoBox from "@svelte/components/Main/RoomResult/InfoBox/Room/RoomInfoBox.svelte"

  import { getUIState } from "@modules/ui/state.svelte"
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
  let frozen = $state(false)
  let error = $state("")

  let result: ServerReturnValue | undefined = $state(undefined)

  $effect(() => {
    if (animationstart) animationstarted = true
  })

  $effect(() => {
    if (animationstarted && !frozen) {
      freezeAndMetaAnimation()
    }
  })

  function freezeAndMetaAnimation() {
    // Snapshot room and rat
    // We want the pre-result state to gradually apply changes to
    // without reactivity from on chain changes
    freezeObjects($ratState, $roomsState[roomId ?? ""])
    frozen = true
  }

  const processRoom = async () => {
    console.time("Process")
    if (!roomId) return
    try {
      console.log("start result")
      const ret = enterRoom(
        environment,
        $walletNetwork,
        roomId,
        $player.ownedRat
      )

      try {
        console.log("start outcome ")
        result = await ret
      } catch (err) {
        console.log("catch outcome error", err)
        throw err
      }
    } catch (error) {
      console.log("catch result error", error)
      rooms.close()
    }
  }

  $effect(() => {
    if (start && !busy) {
      busy = true
      console.log("start")
      processRoom()
    }
  })
</script>

<div class="room-result">
  <RoomMeta />
  <!-- INFO BOXES -->
  <div class="info-boxes">
    <RatInfoBox />
    <RoomInfoBox />
  </div>
  <!-- LOG -->
  <Log {result} {animationstarted} />
  <!-- ERROR -->
  {#if error}
    <div class="error">
      {error}
    </div>
  {/if}
</div>

<style lang="scss">
  .room-result {
    height: 100%;
    color: var(--white);
    z-index: 10000;
    padding: 20px;
    padding-bottom: 0;
    font-size: var(--font-size-normal);
    overflow-y: auto;
  }

  .info-boxes {
    display: flex;
    justify-content: space-between;
    width: 100%;
    height: 200px;
  }
</style>
