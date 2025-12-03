import type { TutorialStep, TutorialStepConfig } from "./types"

export const TUTORIAL_STEPS: Record<TutorialStep, TutorialStepConfig> = {
  1: {
    target: "[data-tutorial='rat-panel']",
    placement: "right"
  },
  2: {
    target: "[data-tutorial='trip-list']",
    placement: "left"
  },
  3: {
    target: "[data-tutorial='inventory']",
    placement: "bottom"
  },
  4: {
    target: "[data-tutorial='cash-out']",
    placement: "bottom"
  }
}
