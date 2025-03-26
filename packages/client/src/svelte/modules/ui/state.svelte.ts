import { PANE, LEFT_PANE, RIGHT_PANE } from "./enums"
import * as uiStores from "@modules/ui/stores"
import { Tween } from "svelte/motion"

// Internal state
// PANES
let leftPane = $state<LEFT_PANE>(LEFT_PANE.YOUR_RAT)
let rightPane = $state<RIGHT_PANE>(RIGHT_PANE.ROOMS)
let previewingPane = $state<PANE>(PANE.NONE)
let route = $state("main")
const transition = $state({
  active: false,
  progress: new Tween(0, { duration: 1000 }),
  to: "main",
})

// Exports
export const getUIState = () => {
  const setPane = (pane: PANE, option: LEFT_PANE | RIGHT_PANE) => {
    if (pane === PANE.LEFT) {
      leftPane = option as LEFT_PANE
    }
    if (pane === PANE.RIGHT) {
      rightPane = option as RIGHT_PANE
    }
  }

  const transitionTo = async (to: string) => {
    transition.active = true
    await transition.progress.set(1)
    transition.active = false
    route = to
  }

  const previewRoom = (id: string, pane = PANE.RIGHT) => {
    uiStores.CurrentRoomId.set(id)
    previewingPane = pane
  }

  const goBackRoom = () => {
    setPane(PANE.RIGHT, RIGHT_PANE.ROOMS)
    uiStores.CurrentRoomId.set(null)
    previewingPane = PANE.NONE
    route = "main"
  }

  const goToRoom = (id: string) => {
    uiStores.CurrentRoomId.set(id)
    // setPane(PANE.RIGHT, RIGHT_PANE.ROOM_RESULT)
    transitionTo("room")
  }

  return {
    enums: {
      PANE,
      LEFT_PANE,
      RIGHT_PANE,
    },
    panes: {
      set: setPane,
      get previewing() {
        return previewingPane
      },
      get left() {
        return leftPane
      },
      get right() {
        return rightPane
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
    route: {
      get current() {
        return route
      },
    },
    get transition() {
      return transition
    },
  }
}
