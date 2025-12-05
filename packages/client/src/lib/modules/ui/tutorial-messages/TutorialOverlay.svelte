<script lang="ts">
  import { onDestroy } from "svelte"
  import { tutorialActive, tutorialStep } from "./store"
  import { TUTORIAL_STEPS } from "./steps"

  let overlayEl: HTMLDivElement | null = null
  let isFirstStep = true

  function setClipPath(x: number, y: number, x2: number, y2: number) {
    if (!overlayEl) return

    const clipPath = `polygon(
      0% 0%,
      0% 100%,
      ${x}px 100%,
      ${x}px ${y}px,
      ${x2}px ${y}px,
      ${x2}px ${y2}px,
      ${x}px ${y2}px,
      ${x}px 100%,
      100% 100%,
      100% 0%
    )`

    overlayEl.style.clipPath = clipPath
  }

  function getTargetRect() {
    const stepConfig = TUTORIAL_STEPS[$tutorialStep]
    const targetEl = document.querySelector(stepConfig.target)
    if (!targetEl) return null
    return targetEl.getBoundingClientRect()
  }

  function expandToTarget() {
    const rect = getTargetRect()
    if (!rect) return

    setClipPath(rect.x, rect.y, rect.x + rect.width, rect.y + rect.height)
  }

  function collapseToCenter(onComplete: () => void) {
    const rect = getTargetRect()
    if (!rect) return

    const centerX = rect.x + rect.width / 2
    const centerY = rect.y + rect.height / 2

    // Collapse to center point
    setClipPath(centerX, centerY, centerX, centerY)

    // After collapse animation, expand
    setTimeout(onComplete, 150)
  }

  function createOverlay() {
    overlayEl = document.createElement("div")
    overlayEl.className = "tutorial-overlay-portal"
    overlayEl.style.cssText = `
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.7);
      z-index: 99;
      pointer-events: auto;
      transition: clip-path 0.15s ease-in-out;
    `
    document.body.appendChild(overlayEl)
  }

  function destroyOverlay() {
    if (overlayEl) {
      overlayEl.remove()
      overlayEl = null
    }
  }

  $effect(() => {
    if ($tutorialActive) {
      isFirstStep = true
      createOverlay()
      document.body.style.overflow = "hidden"

      requestAnimationFrame(() => {
        collapseToCenter(() => expandToTarget())
      })

      window.addEventListener("resize", expandToTarget)

      return () => {
        destroyOverlay()
        document.body.style.overflow = ""
        window.removeEventListener("resize", expandToTarget)
      }
    }
  })

  // Animate when step changes
  $effect(() => {
    if ($tutorialActive && $tutorialStep) {
      if (isFirstStep) {
        isFirstStep = false
        return
      }

      requestAnimationFrame(() => {
        collapseToCenter(() => expandToTarget())
      })
    }
  })

  onDestroy(() => {
    destroyOverlay()
    document.body.style.overflow = ""
  })
</script>
