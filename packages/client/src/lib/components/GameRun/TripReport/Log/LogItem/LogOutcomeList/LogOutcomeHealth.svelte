<script lang="ts">
  import { gsap } from "gsap"
  import { updateProcessingState } from "$lib/components/GameRun/state.svelte"
  import { playSound } from "$lib/modules/sound"
  import { processingRat } from "$lib/components/GameRun/state.svelte"
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"
  import { backgroundMusic } from "$lib/modules/sound/stores"
  import { addEasedCountAnimation } from "$lib/modules/utils/animations"

  let {
    value,
    onTimeline
  }: {
    value: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Element
  let outcomeElement = $state<HTMLDivElement | null>(null)
  let valueElement = $state<HTMLSpanElement | null>(null)

  let negative = $state(value < 0)

  const isDead = $processingRat && Number($processingRat.balance) + value === 0

  // Timeline
  const timeline = gsap.timeline()

  // Stage 1: Prepare the animation
  const prepare = () => {
    // Ensure outcome starts invisible
    gsap.set(outcomeElement, {
      opacity: 0
    })

    if (valueElement) {
      valueElement.textContent = ""
    }
  }

  // Stage 2: Main animation
  const main = () => {
    if (!outcomeElement || !valueElement) {
      return
    }

    // State update
    timeline.call(updateProcessingState, [
      {
        type: "balance",
        action: negative ? "reduce" : "increase",
        value,
        name: "Balance"
      }
    ])

    // Fade in container
    timeline.to(outcomeElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })

    // Count up/down value with animation
    addEasedCountAnimation({
      timeline,
      valueElement,
      value
    })

    timeline.to(
      outcomeElement,
      {
        duration: 0.1,
        background: negative ? "red" : "green",
        ease: "power2.out"
      },
      ">-0.3"
    )

    if (isDead) {
      timeline.call(() => {
        // Stop background music
        $backgroundMusic?.stop()
        // Play death sound
        playSound("ratfunUI", "ratDeath")
      })
      timeline.to(valueElement, {
        textContent: "DEAD",
        duration: 0,
        ease: "power2.out"
      })
    } else {
      timeline.call(() => {
        if (negative) {
          playSound("ratfunUI", "healthNegative")
        } else {
          playSound("ratfunUI", "healthPositive")
        }
      })
    }

    // Wait
    // timeline.to(
    //   {},
    //   {
    //     duration: 0.3
    //   }
    // )
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
    if (outcomeElement && valueElement) {
      run()
    }
  })
</script>

<div class="outcome" class:negative bind:this={outcomeElement}>
  <span class="heart">{HEALTH_SYMBOL}</span>
  <span class="value" bind:this={valueElement}>0</span>
</div>

<style lang="scss">
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

    background: var(--color-value);
    color: var(--background);

    &.negative {
      background: var(--color-death);
    }
  }

  .heart {
    display: inline-block;
    margin-right: 5px;
  }
</style>
