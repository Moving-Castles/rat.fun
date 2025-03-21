import { PANE, LEFT_PANE, RIGHT_PANE } from "./enums"
import * as uiStores from "@modules/ui/stores"

// Internal state
// PANES
let leftPane = $state<LEFT_PANE>(LEFT_PANE.YOUR_RAT)
let rightPane = $state<RIGHT_PANE>(RIGHT_PANE.ROOMS)
let previewingPane = $state<PANE>(PANE.NONE)

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

  const previewRoom = (id: string, pane = PANE.RIGHT) => {
    uiStores.CurrentRoomId.set(id)
    previewingPane = pane
  }

  const goBackRoom = () => {
    setPane(PANE.RIGHT, RIGHT_PANE.ROOMS)
    uiStores.CurrentRoomId.set(null)
    previewingPane = PANE.NONE
  }

  const goToRoom = (id: string) => {
    uiStores.CurrentRoomId.set(id)
    setPane(PANE.RIGHT, RIGHT_PANE.ROOM_RESULT)
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
  }
}
