import { writable } from "svelte/store"
import type { TutorialStep } from "./types"

export const tutorialActive = writable<boolean>(false)
export const tutorialStep = writable<TutorialStep>(1)

// localStorage key
const TUTORIAL_COMPLETED_KEY = "ratfun_tutorial_completed"

export function isTutorialCompleted(): boolean {
  if (typeof localStorage === "undefined") return true
  return localStorage.getItem(TUTORIAL_COMPLETED_KEY) === "true"
}

export function setTutorialCompleted(): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(TUTORIAL_COMPLETED_KEY, "true")
}

export function startTutorial(): void {
  tutorialStep.set(1)
  tutorialActive.set(true)
}

export function nextStep(): void {
  tutorialStep.update(step => {
    if (step < 4) {
      return (step + 1) as TutorialStep
    }
    // Complete tutorial after step 4
    tutorialActive.set(false)
    setTutorialCompleted()
    return step
  })
}

export function endTutorial(): void {
  tutorialActive.set(false)
  setTutorialCompleted()
}
