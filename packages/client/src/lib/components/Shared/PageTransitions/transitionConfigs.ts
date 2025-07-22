import type { TransitionConfig } from "./types"
import { circOut as easing } from "svelte/easing"

const mainLayoutTransitionConfig: TransitionConfig[] = [
  {
    from: "/(rooms)/(game)",
    to: "/(rooms)/admin",
    in: {
      transition: "fade",
      params: {}
    },
    out: {
      transition: "none",
      params: {}
    }
  },
  {
    from: "/(rooms)/admin",
    to: "/(rooms)/(game)",
    in: {
      transition: "fade",
      params: {}
    },
    out: {
      transition: "none",
      params: {}
    }
  }
]

const outerLayoutTransitionConfig: TransitionConfig[] = [
  {
    from: "/(rooms)/[roomId]",
    to: "/(rooms)/[roomId]/enter",
    in: {
      transition: "fade",
      params: {
        duration: 400,
        delay: 200
      }
    },
    out: {
      transition: "wipe",
      params: {
        duration: 400,
        direction: "in"
      }
    }
  },
  {
    from: "/(rooms)/[roomId]/enter",
    to: "*",
    in: {
      transition: "wipe",
      params: {
        duration: 1000,
        direction: "out"
      }
    },
    out: {
      transition: "fade",
      params: {
        duration: 400,
        delay: 200
      }
    }
  }
]

const adminLayoutTransitionConfig: TransitionConfig[] = [
  {
    from: "/(rooms)/admin",
    to: "/(rooms)/admin/[roomId]",
    in: {
      transition: "slideFromRight",
      params: {
        duration: 200,
        easing
      }
    },
    out: {
      transition: "slideLeft",
      params: {
        duration: 200,
        easing
      }
    }
  },
  {
    from: "/(rooms)/admin/[roomId]",
    to: "/(rooms)/admin",
    in: {
      transition: "slideFromLeft",
      params: {
        duration: 200,
        easing
      }
    },
    out: {
      transition: "slideRight",
      params: {
        duration: 200,
        easing
      }
    }
  }
]

const gameLayoutTransitionConfig: TransitionConfig[] = [
  {
    from: "/(rooms)/(game)",
    to: "/(rooms)/[roomId]",
    in: {
      transition: "slideFromRight",
      params: {
        duration: 200,
        easing
      }
    },
    out: {
      transition: "slideLeft",
      params: {
        duration: 200,
        easing
      }
    }
  },
  {
    from: "/(rooms)/[roomId]",
    to: "/(rooms)/(game)",
    in: {
      transition: "slideFromLeft",
      params: {
        duration: 200,
        easing
      }
    },
    out: {
      transition: "slideRight",
      params: {
        duration: 200,
        easing
      }
    }
  }
]

export {
  outerLayoutTransitionConfig,
  mainLayoutTransitionConfig,
  adminLayoutTransitionConfig,
  gameLayoutTransitionConfig
}
