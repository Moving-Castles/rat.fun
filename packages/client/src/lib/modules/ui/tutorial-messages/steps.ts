import type { TutorialStep, TutorialStepConfig } from "./types"

export const TUTORIAL_STEPS: Record<TutorialStep, TutorialStepConfig> = {
  1: {
    target: "[data-tutorial='rat-panel']",
    placement: "right",
    mobile: {
      placement: "bottom"
    }
  },
  2: {
    target: "[data-tutorial='trip-list']",
    placement: "left",
    mobile: {
      target: "[data-tutorial='phone-trip-button']",
      placement: "top"
    }
  },
  3: {
    target: "[data-tutorial='inventory']",
    placement: "bottom",
    mobile: {
      placement: "top"
    }
  },
  4: {
    target: "[data-tutorial='mode-switch']",
    placement: "bottom",
    mobile: {
      target: "[data-tutorial='phone-menu-button']",
      placement: "bottom"
    }
  },
  5: {
    target: "[data-tutorial='cash-out']",
    placement: "bottom"
  }
}
