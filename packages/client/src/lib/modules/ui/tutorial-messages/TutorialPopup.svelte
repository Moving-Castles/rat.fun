<script lang="ts">
  import { onDestroy } from "svelte"
  import { mount, unmount } from "svelte"
  import tippy, { type Instance } from "tippy.js"
  import { tutorialActive, tutorialStep, nextStep } from "./store"
  import { TUTORIAL_STEPS } from "./steps"
  import TutorialContent from "./TutorialContent.svelte"

  let tippyInstance: Instance | null = null
  let mountedComponent: Record<string, unknown> | null = null

  function cleanup() {
    // Remove highlight from previous target
    document.querySelector("[data-tutorial-highlight]")?.removeAttribute("data-tutorial-highlight")

    if (tippyInstance) {
      tippyInstance.destroy()
      tippyInstance = null
    }

    if (mountedComponent) {
      unmount(mountedComponent)
      mountedComponent = null
    }
  }

  $effect(() => {
    // Cleanup previous instance
    cleanup()

    if (!$tutorialActive) return

    const stepData = TUTORIAL_STEPS[$tutorialStep]
    const targetEl = document.querySelector(stepData.target)

    if (!targetEl) {
      console.warn(`Tutorial target not found: ${stepData.target}`)
      return
    }

    // Create container for Svelte component
    const container = document.createElement("div")

    // Mount Svelte component into container
    mountedComponent = mount(TutorialContent, {
      target: container,
      props: {
        step: $tutorialStep,
        onNext: nextStep
      }
    })

    // Create tippy with DOM element as content
    tippyInstance = tippy(targetEl, {
      content: container,
      theme: "tutorial",
      placement: stepData.placement,
      trigger: "manual",
      interactive: true,
      arrow: true,
      showOnCreate: true,
      appendTo: document.body,
      onClickOutside: () => {
        // Prevent closing on outside click - do nothing
      }
    })

    // Add highlight to target
    targetEl.setAttribute("data-tutorial-highlight", "")
  })

  onDestroy(cleanup)
</script>
