import { PANE, LEFT_PANE, RIGHT_PANE } from "./enums"
import { rooms } from "@modules/state/base/stores"
import { get } from "svelte/store"
import * as uiStores from "@modules/ui/stores"
import { LOCATION } from "@modules/ui/enums"

// PANES
let leftPane = $state<LEFT_PANE>(LEFT_PANE.YOUR_RAT)
let rightPane = $state<RIGHT_PANE>(RIGHT_PANE.ROOMS)
// FLOORS
let floor = $state<number>(0)

// Get the updated

export const getUIState = () => {
  const setPane = (pane: PANE, option: LEFT_PANE | RIGHT_PANE) => {
    console.log("Called setPane", pane, option)
    if (pane === PANE.LEFT) {
      leftPane = option
    }
    if (pane === PANE.RIGHT) {
      rightPane = option
    }
  }

  const setFloor = (num: number) => {
    floor = num
  }

  const previewRoom = (id: string) => {
    uiStores.CurrentRoomId.set(id)
  }

  const goBackRoom = () => {
    uiStores.CurrentRoomId.set(null)
  }

  const goToRoom = (id: string) => {
    uiStores.CurrentRoomId.set(id)
    uiStores.UILocation.set(LOCATION.ROOM)
  }

  return {
    enums: {
      PANE,
      LEFT_PANE,
      RIGHT_PANE,
    },
    panes: {
      set: setPane,
      get left() {
        return leftPane
      },
      get right() {
        return rightPane
      },
    },
    floors: {
      set: setFloor,
      rooms: (level: number) => {
        return Object.entries(get(rooms)).filter(([_, r]) => r.level === level)
      },
      get current() {
        return floor
      },
    },
    rooms: {
      preview: previewRoom,
      back: goBackRoom,
      goto: goToRoom,
      get current() {
        return uiStores.CurrentRoomId
      },
    },
  }
}
