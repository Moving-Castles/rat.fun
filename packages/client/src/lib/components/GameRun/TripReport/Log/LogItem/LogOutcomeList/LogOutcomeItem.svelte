<script lang="ts">
  import { gsap } from "gsap"
  import { updateFrozenState } from "$lib/components/GameRun/state.svelte"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { playSound } from "$lib/modules/sound"

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

  let negative = action === "remove"

  // Calculate final text for width measurement
  const finalText = `${name} (${CURRENCY_SYMBOL}${negative ? "-" : ""}${value})`

  // Count update helper
  const updateCountValue = (num: number) => {
    if (valueElement) {
      const displayValue = negative ? -num : num
      valueElement.textContent = String(displayValue)
      playSound("ratfunUI", "tick", false, false, 1 + num * (negative ? -0.02 : 0.02))
    }
  }

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
    // State update
    timeline.call(updateFrozenState, [
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

    const stepDelay = 0.03

    // Count up/down value manually
    for (let i = 1; i < value; i++) {
      const position = i === 1 ? "<" : `+=${stepDelay}`
      timeline.call(updateCountValue, [i], position)
    }

    // Change color
    timeline.to(outcomeElement, {
      duration: 0.1,
      background: negative ? "red" : "green",
      ease: "power2.out"
    })

    // Set final text
    timeline.to(
      valueElement,
      {
        textContent: `${name} (${CURRENCY_SYMBOL}${negative ? "-" : ""}${value})`,
        duration: 0,
        ease: "power2.out"
      },
      "<"
    )

    // Sound
    timeline.call(() => {
      if (negative) {
        playSound("ratfunUI", "itemNegative")
      } else {
        playSound("ratfunUI", "itemPositive")
      }
    })

    // Wait
    timeline.to(
      {},
      {
        duration: 0.3
      }
    )
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
    font-weight: inherit;
    line-height: inherit;
    letter-spacing: inherit;
    display: inline-block;
  }

  .outcome {
    background: var(--color-success);
    color: var(--background);
    font-size: var(--font-size-small);
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 10px;
    font-size: var(--font-size-normal);
    white-space: nowrap;
  }
</style>
