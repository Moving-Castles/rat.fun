<script lang="ts">
  import { gsap } from "gsap"
  import { updateProcessingState } from "$lib/components/GameRun/state.svelte"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { playSound } from "$lib/modules/sound"
  import { addEasedCountAnimation, triggerScreenShake } from "$lib/modules/animations"

  let {
    id,
    name,
    value,
    action,
    onTimeline
  }: {
    id: string | undefined
    name: string
    value: number
    action: "add" | "remove"
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let outcomeElement = $state<HTMLDivElement | null>(null)
  let valueElement = $state<HTMLSpanElement | null>(null)
  let hiddenElement = $state<HTMLSpanElement | null>(null)

  // Timeline
  const timeline = gsap.timeline()

  // svelte-ignore state_referenced_locally
  let negative = action === "remove"

  // Calculate final text for width measurement
  // svelte-ignore state_referenced_locally
  const finalText = `${name} (${negative ? "-" : ""}${value} ${CURRENCY_SYMBOL})`

  // Stage 1: Prepare the animation
  const prepare = () => {
    // Calculate width from hidden element and set it
    if (hiddenElement && outcomeElement) {
      const width = hiddenElement.offsetWidth + 4 // Add small buffer
      gsap.set(outcomeElement, {
        width: width,
        opacity: 0
      })
    } else {
      // Fallback if hidden element not ready
      gsap.set(outcomeElement, {
        opacity: 0
      })
    }
  }

  // Stage 2: Main animation
  const main = () => {
    if (!valueElement) {
      return
    }

    // State update
    timeline.call(updateProcessingState, [
      {
        type: "item",
        action,
        id,
        value,
        name
      }
    ])

    // Fade in container
    timeline.to(outcomeElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })

    // Count using absolute value (no sign)
    if (value > 1) {
      addEasedCountAnimation({
        timeline,
        valueElement,
        value: value - 1,
        // Trigger shake when counter reaches 1000
        threshold: 1000,
        onThresholdReached: (remainingDuration) => {
          // Scale intensity based on value size
          // 1000-5000: 0.5 intensity
          // 5000+: 1.0 intensity (max)
          const intensity = value > 5000 ? 1.0 : 0.5
          triggerScreenShake(intensity, remainingDuration)
        }
      })
    }

    // Set final text with sign and change color simultaneously
    timeline.to(valueElement, {
      textContent: `${name} (${negative ? "-" : ""}${value} ${CURRENCY_SYMBOL})`,
      duration: 0,
      ease: "power2.out"
    })

    // Change color
    timeline.to(
      outcomeElement,
      {
        duration: 0.1,
        background: negative ? "var(--color-bad)" : "var(--color-good)",
        ease: "power2.out"
      },
      "<"
    )

    // Sound
    timeline.call(() => {
      if (negative) {
        playSound({ category: "ratfunUI", id: "itemNegative" })
      } else {
        playSound({ category: "ratfunUI", id: "itemPositive" })
      }
    })
  }

  // Timeline is constructed
  // Pass it to the parent component
  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }

  // Run once
  const run = () => {
    prepare()
    main() // Build the timeline synchronously
    done() // Call done immediately after building
  }

  // Ensure root element is mounted
  $effect(() => {
    if (outcomeElement && valueElement && hiddenElement) {
      run()
    }
  })
</script>

<!-- Hidden element for width calculation -->
<span class="hidden-width" bind:this={hiddenElement}>
  {finalText}
</span>

<div class="outcome" class:negative bind:this={outcomeElement}>
  <span class="value" bind:this={valueElement}>0</span>
</div>

<style lang="scss">
  .hidden-width {
    position: absolute;
    visibility: hidden;
    white-space: nowrap;
    font-size: var(--font-size-normal);
    padding-inline: 10px;
    font-family: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    display: inline-block;
  }

  .outcome {
    font-size: var(--font-size-small);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 10px;
    font-size: var(--font-size-normal);
    white-space: nowrap;
    background: var(--color-grey-mid);
    color: var(--background);
  }
</style>
