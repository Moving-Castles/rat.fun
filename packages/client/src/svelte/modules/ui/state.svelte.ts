/**
 * Structure of this file
 *
 * 1. Internal state
 * 2. State modifications
 * 3. Exporting state
 *
 */

import { PANE, LEFT_PANE, RIGHT_PANE } from "./enums"
import { quadInOut } from "svelte/easing"
import { Tween } from "svelte/motion"
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
let leftPane = $state<LEFT_PANE>(LEFT_PANE.YOUR_RAT)
let rightPane = $state<RIGHT_PANE>(RIGHT_PANE.ROOMS)
let previewingPane = $state<PANE>(PANE.NONE)
// Current route
let route = $state("main")
let params = $state({})
// 1.3 More complex objects are also fully reactive once properly initialised
const transition = $state({
  active: false,
  from: "",
  to: "main",
  type: "none",
  progress: new Tween(0, { duration: 400, easing: quadInOut }),
})

const getTransitionType = (from, to) => {
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
   * Basically: Modify the internal state by normal assignment, in setPane for example we just set leftPane by calling
   *
   * leftPane = option
   */
  const setPane = (pane: PANE, option: LEFT_PANE | RIGHT_PANE) => {
    if (pane === PANE.LEFT) {
      leftPane = option as LEFT_PANE
    }
    if (pane === PANE.RIGHT) {
      rightPane = option as RIGHT_PANE
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
  const navigate = async (to: string, p?: Record<string, string> = {}) => {
    // Simple asssignment
    transition.from = route
    transition.to = to
    transition.active = true
    transition.type = getTransitionType(transition.from, transition.to)
    params = p
    history.pushState({ to, p }, "")
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
  const preview = (id: string, mine = false) => {
    if (mine) {
      uiStores.CurrentMyRoomId.set(id)
      previewingPane = PANE.LEFT
    } else {
      uiStores.CurrentRoomId.set(id)
      previewingPane = PANE.RIGHT
    }
  }

  const back = (mine = false) => {
    if (mine) {
      uiStores.CurrentMyRoomId.set(null)
      setPane(PANE.LEFT, LEFT_PANE.YOUR_ROOMS)
    } else {
      uiStores.CurrentRoomId.set(null)
      setPane(PANE.RIGHT, RIGHT_PANE.ROOMS)
    }
  }

  const close = async () => {
    previewingPane = PANE.NONE
    await navigate("main")
    uiStores.CurrentRoomId.set(null)
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
      LEFT_PANE,
      RIGHT_PANE,
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
      get left() {
        return leftPane
      },
      get right() {
        return rightPane
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
