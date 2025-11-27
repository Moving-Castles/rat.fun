<script lang="ts">
  import { gsap } from "gsap"
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"

  let {
    valueChange,
    onTimeline
  }: {
    valueChange: number
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>, offset: number | string) => void
  } = $props()

  let displayValue = $state(0)
  let animatedObj = { value: 0 }
  let containerElement = $state<HTMLDivElement | null>(null)
  let valueElement = $state<HTMLSpanElement | null>(null)

  // Helper function to pad number with leading zeros
  function padNumber(num: number, targetLength: number): string {
    const absNum = Math.abs(Math.floor(num))
    return String(absNum).padStart(targetLength, "0")
  }

  // Get sign prefix
  function getSign(value: number): string {
    if (value > 0) return "+"
    if (value < 0) return "-"
    return ""
  }

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(containerElement, { opacity: 0, scale: 0.8 })
  }

  const main = () => {
    // Fade in container
    timeline.to(
      containerElement,
      {
        opacity: 1,
        scale: 1,
        duration: 0.3,
        ease: "power2.out"
      },
      0
    )

    // Animate the value count
    timeline.to(
      animatedObj,
      {
        value: valueChange,
        duration: 0.5,
        ease: "power2.out",
        onUpdate: () => {
          displayValue = animatedObj.value
        }
      },
      0.3
    )

    // Change background color based on final value
    if (valueChange !== 0) {
      timeline.to(
        containerElement,
        {
          backgroundColor: valueChange > 0 ? "green" : "red",
          duration: 0.2,
          ease: "power2.out"
        },
        0.8 // After count completes
      )
    }
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline, 0)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (containerElement && valueElement) {
      run()
    }
  })
</script>

<div class="total-value-change" bind:this={containerElement}>
  <span class="value" bind:this={valueElement}>
    {getSign(valueChange)}{padNumber(displayValue, String(Math.abs(valueChange)).length)}
  </span>
  <span class="currency-symbol">{CURRENCY_SYMBOL}</span>
</div>

<style lang="scss">
  .total-value-change {
    font-size: 8dvw;
    font-family: var(--special-font-stack);
    color: var(--background);
    background: rgba(200, 200, 200, 0.5);
    border-radius: 10px;
    user-select: none;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    transition: background-color 0.2s ease;

    @media (max-width: 768px) {
      font-size: 20dvw;
    }

    .value {
      margin-right: 5px;
    }

    .currency-symbol {
      opacity: 0.5;
    }
  }
</style>
