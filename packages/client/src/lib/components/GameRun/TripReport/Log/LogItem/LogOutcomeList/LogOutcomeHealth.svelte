<script lang="ts">
  import { gsap } from "gsap"
  import { updateFrozenState } from "$lib/components/GameRun/state.svelte"
  import { playSound } from "$lib/modules/sound"
  import { frozenRat } from "$lib/components/GameRun/state.svelte"
  import { calculateDuration } from "./index"

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

  console.log("$frozenRat?.balance", $frozenRat?.balance)
  const isDead = $frozenRat && Number($frozenRat.balance) + value === 0

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
    timeline.call(updateFrozenState, [
      {
        type: "balance",
        action: negative ? "reduce" : "increase",
        value: 0, // Will be filled by parent if needed
        name: "Balance"
      }
    ])

    // Fade in container
    timeline.to(outcomeElement, {
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })

    const duration = calculateDuration(value)

    // Count up/down value
    timeline.to(
      valueElement,
      {
        textContent: Number(value),
        duration: duration,
        snap: { textContent: 1 },
        ease: "power2.out"
      },
      "<"
    )

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
        playSound("ratfunUI", "bigButtonDown")
      })
      timeline.to(valueElement, {
        textContent: "DEAD",
        duration: 0,
        ease: "power2.out"
      })
    } else {
      timeline.call(() => {
        if (negative) {
          playSound("ratfunUI", "negative")
        } else {
          playSound("ratfunUI", "positive")
        }
      })
    }

    // Wait 500ms at the end
    timeline.to(
      {},
      {
        duration: 0.5
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
    if (outcomeElement && valueElement) {
      run()
    }
  })
</script>

<div class="outcome" class:negative bind:this={outcomeElement}>
  <span class="heart">♥</span>
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
