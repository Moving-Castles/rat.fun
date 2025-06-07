/**
 * Structure of this file
 *
 * 1. Internal state
 * 2. State modifications
 * 3. Exporting state
 *
 */

import { PANE, RAT_CONTAINER, ROOM_CONTAINER } from "./enums"
import { quadInOut } from "svelte/easing"
import { Tween } from "svelte/motion"
import { get } from "svelte/store"
import * as uiStores from "@modules/ui/stores"

export const ROUTES = [
  {
    id: "main",
    params: [],
  },
  {
    id: "room",
    params: ["id"],
  },
]

/** 1.1 Internal State
 *
 * Internal state is the one source of truth for your data.
 * !! Note that, instead of exporting state directly as we would with stores
 * we define *getters* and *setters* inside the return section of the getUIState() function
 * Internal state is modified by functions. See section 2 comments
 */
// 1.2 Simple state. Strings, numbers, etc.
let ratContainer = $state<RAT_CONTAINER>(RAT_CONTAINER.YOUR_RAT)
let roomContainer = $state<ROOM_CONTAINER>(ROOM_CONTAINER.ALL_ROOMS)
let previewingPane = $state<PANE>(PANE.NONE)
let previewAnimated = $state(true)

// Current route
let route = $state("main")
let params = $state({})

// 1.3 More complex objects are also fully reactive once properly initialised
const transition = $state({
  active: false,
  from: "",
  to: "main",
  type: "none",
  progress: new Tween(0, { duration: 600, easing: quadInOut }),
})

const getTransitionType = (from: string, to: string) => {
  if (from === "main" && to === "room") {
    return "doorsOpen"
  }

  if (from === "room" && to === "main") {
    return "doorsClose"
  }

  return "none"
}

/** Note: Consuming state in your files
 *
 * Parts of the state can be imported in your files as follows
 *
 * import { getUIState } from "@modules/ui/state.svelte"
 * let { rooms } = getUIState()
 *
 * Note: use `let` instead of `const` where appropriate.
 * `const` can be used when the internal state variable is also initiated as a const, e.g. `transition` above.
 *
 */
export const getUIState = () => {
  /** 2.1 Basic state modification
   *
   * Basically: Modify the internal state by normal assignment, in setPane for example we just set roomContainer by calling
   *
   * roomContainer = option
   */
  const setPane = (pane: PANE, option: RAT_CONTAINER | ROOM_CONTAINER) => {
    if (pane === PANE.RAT_CONTAINER) {
      ratContainer = option as RAT_CONTAINER
    }
    if (pane === PANE.ROOM_CONTAINER) {
      roomContainer = option as ROOM_CONTAINER
    }
  }

  /** 2.2 Object state modification
   *
   * Assign to object keys as you normally would.
   *
   * In the function below, the `progress` key is actually an instance of `Tween`, so you can assign this by using the `Tween.set` property,
   * but the transition's `active` property is just a boolean
   *
   */
  const navigate = async (to: string, p: Record<string, string> = {}) => {
    // Simple asssignment
    transition.from = route
    transition.to = to
    transition.active = true
    transition.type = getTransitionType(transition.from, transition.to)
    params = p
    history.pushState({ to, p }, "")

    // Handle parameters
    if (p.roomId) {
      uiStores.CurrentRoomId.set(p.roomId)
    } else {
      uiStores.CurrentRoomId.set(null)
    }

    // Modifying by using class instance methods
    await transition.progress.set(1)
    transition.active = false
    transition.progress.set(0)
    route = to
  }
  /** ...Inside your code you would subscribe to both as
   *
   * transition.progress.current  (for current tween value)
   * transition.progress.target   (for tween target value)
   * transition.active            (for )
   */

  /** 2.3 modifying stores
   *
   * Here, I am modifying a store as you normally would anyways.
   * When combining stores and $state calls, it can be weird to figure out which is which.
   */
  const preview = (
    id: string,
    mine = false,
    animated = true,
    changeHash = true
  ) => {
    if (id === "") return
    previewAnimated = animated
    const go = () => {
      if (changeHash) window.location.hash = id
      if (mine) {
        uiStores.myPreviewId.set(id)
        previewingPane = PANE.ROOM_CONTAINER
        setPane(PANE.ROOM_CONTAINER, ROOM_CONTAINER.YOUR_ROOMS)
      } else {
        uiStores.previewId.set(id)
        previewingPane = PANE.ROOM_CONTAINER
        setPane(PANE.ROOM_CONTAINER, ROOM_CONTAINER.ALL_ROOMS)
      }
    }

    if (get(uiStores.myPreviewId) || get(uiStores.previewId)) {
      // back(mine)
      setTimeout(go, 400)
    } else {
      go()
    }
  }

  const back = (mine = false, animated = true) => {
    window.location.hash = ""
    previewAnimated = animated
    uiStores.myPreviewId.set(null)
    uiStores.previewId.set(null)

    if (mine) {
      setPane(PANE.ROOM_CONTAINER, ROOM_CONTAINER.YOUR_ROOMS)
    } else {
      setPane(PANE.ROOM_CONTAINER, ROOM_CONTAINER.ALL_ROOMS)
    }
  }

  const close = async (toPreview = true) => {
    previewingPane = PANE.NONE
    if (!toPreview) back(false, false) // takes us to the list section
    await navigate("main")
    setPane(PANE.ROOM_CONTAINER, ROOM_CONTAINER.ALL_ROOMS)
    uiStores.CurrentRoomId.set(null)
    // console.log("closed")
  }

  /** 3.1 Exporting state
   *
   * We are returning a couple of different things from here, in a object-oriented type of structure.
   *
   * We have the enums,
   * panes, rooms, route and transition
   *
   * There are `get`ters for the reactive properties, which always return the reactive state
   * There are functions for modifying that state
   * We do not modify state inside our components directly. We go through the functions we define
   */
  return {
    enums: {
      PANE,
      RAT_CONTAINER,
      ROOM_CONTAINER,
    },
    panes: {
      /** 3.2 Simple modifying function */
      set: setPane,
      /** 3.3 Simple getter!
       *
       * const { panes } = getUIState()
       * state.previewing <-- reactive
       */
      get previewing() {
        return previewingPane
      },
      get ratContainer() {
        return ratContainer
      },
      get roomContainer() {
        return roomContainer
      },
    },
    rooms: {
      preview,
      back,
      navigate,
      close,
      /** 3.4: :danger: Here we are returning a store.
       *
       * !!!It is a bit of an anti-pattern!!!
       *
       * I can subscribe to this store by destructuring it from the function.
       *
       * because you might as well import it from the source directly instead of going through this function.
       * But here is how you would do it inside your component:
       *
       * const { myCurrent, current } = getUIState()
       *
       * And then autosubscribe `$current`
       */
      get myPreviewId() {
        return uiStores.myPreviewId
      },
      get previewId() {
        return uiStores.previewId
      },
      get previewAnimated() {
        return previewAnimated
      },
      get myCurrent() {
        return uiStores.CurrentMyRoomId
      },
      get current() {
        return uiStores.CurrentRoomId
      },
    },
    route: {
      get params() {
        return params
      },
      get current() {
        return route
      },
    },
    /**
     * 3.5 This is a simple export, but lots of things inside it.
     *
     * When subscribing to state, pay attention to the structure of this file.
     *
     * For the transition property, the `get`ter is directly on the transition $state variable
     * This means that {transition} will be reactive.
     *
     * For the `route`, this is different, the `get`ter is on `current` and therefore we have to check `route.current` in our code for a reactive property.
     *
     * In this case, refer to transition's original definition above to see what properties it has.
     */
    get transition() {
      return transition
    },
  }
}
