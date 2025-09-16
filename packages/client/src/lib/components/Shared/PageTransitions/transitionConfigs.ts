import type { TransitionConfig } from "./types"
import { circOut as easing } from "svelte/easing"

const mainLayoutTransitionConfig: TransitionConfig[] = [
  {
    from: "/(rooms)/(game)",
    to: "/(rooms)/admin",
    in: {
      transition: "flip",
      params: {
        direction: "in",
        duration: 200,
        delay: 200
      }
    },
    out: {
      transition: "flip",
      params: {
        direction: "out",
        duration: 200
      }
    }
  },
  {
    from: "/(rooms)/admin",
    to: "/(rooms)/(game)",
    in: {
      transition: "flip",
      params: {
        direction: "in",
        duration: 200,
        delay: 200
      }
    },
    out: {
      transition: "flip",
      params: {
        direction: "out",
        duration: 200
      }
    }
  }
]

const outerLayoutTransitionConfig: TransitionConfig[] = [
  {
    from: "/(rooms)/(game)/[roomId]/result",
    to: "*",
    out: {
      transition: "wipe",
      params: {
        duration: 1000,
        direction: "out"
      }
    }
  },
  {
    from: "/(rooms)/(game)/[roomId]/result/[outcomeId]",
    to: "*",
    in: {
      transition: "none",
      params: {}
    },
    out: {
      transition: "wipe",
      params: {
        duration: 400,
        direction: "out"
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
    to: "/(rooms)/(game)/[roomId]",
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
    from: "/(rooms)/(game)/[roomId]",
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
