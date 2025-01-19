import { get, writable } from "svelte/store"
import type { Writable } from "svelte/store"
import { player as playerStore } from "@modules/state/base/stores"
import { blockNumber } from "@modules/network"
import { UILocation } from "@modules/ui/stores"
import { LOCATION } from "@modules/ui/enums"

export const newEvent: Writable<GameEvent | null> = writable(null)

const BLOCK_MARGIN = 0

// let lastEventBlock = 0;

export function initPlayerEventsListener() {
  playerStore.subscribe(player => {
    // console.log("In event listener")

    if (!player?.event) {
      // console.log("No event")
      return
    }

    // console.log('Number(player?.event?.blockNumber ?? 0)', Number(player?.event?.blockNumber ?? 0))
    // console.log('lastEventBlock', lastEventBlock)

    // if(Number(player?.event?.blockNumber ?? 0) < lastEventBlock) {
    //     console.log('Event already processed');
    //     return;
    // }

    if (
      Number(player?.event?.blockNumber ?? 0) <
      Number(get(blockNumber)) - BLOCK_MARGIN
    ) {
      // console.log(
      //   "Event is stale...",
      //   "Event block:",
      //   player.event.blockNumber,
      //   "Current block:",
      //   get(blockNumber)
      // )
      return
    }

    // console.log("!!!!! New event received", player.event)

    // newEvent.set(player.event)
    // UILocation.set(LOCATION.RESULT)
  })
}
