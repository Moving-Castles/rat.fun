<script lang="ts">
  import { CURRENCY_SYMBOL } from "$lib/modules/ui/constants"
  import { BigButton } from "$lib/components/Shared"
  import { ratState, RAT_BOX_STATE } from "$lib/components/Rat/state.svelte"
  import { getRatTotalValue } from "$lib/modules/state/utils"
  import { ratTotalValue } from "$lib/modules/state/stores"
  import { UI_STRINGS } from "$lib/modules/ui/ui-strings/index.svelte"
  import { gsap } from "gsap"

  let {
    displayRat,
    oldRat,
    newRat,
    onTimeline
  }: {
    displayRat: Rat | null
    oldRat: Rat | null
    newRat: Rat | null
    onTimeline?: (timeline: ReturnType<typeof gsap.timeline>) => void
  } = $props()

  // Calculate old and new total values
  let oldValue = $derived(oldRat ? getRatTotalValue(oldRat) : 0)
  let newValue = $derived(newRat ? getRatTotalValue(newRat) : 0)
  const hasChanges = $derived(oldValue !== newValue)

  // Elements
  let totalValueContainer = $state<HTMLDivElement | null>(null)
  let valueElement = $state<HTMLSpanElement | null>(null)
  let actionContainer = $state<HTMLDivElement | null>(null)

  // Create timeline
  const timeline = gsap.timeline()

  const prepare = () => {
    gsap.set(totalValueContainer, { opacity: 0 })
    gsap.set(actionContainer, { opacity: 0 })
    // Show old value initially
    gsap.set(valueElement, { textContent: `${oldValue}${CURRENCY_SYMBOL}` })

    if (!hasChanges) {
      // Only set scale for entry animation if no changes
      gsap.set(totalValueContainer, { scale: 0.8 })
    }
  }

  const main = () => {
    if (hasChanges) {
      // CHANGE ANIMATION: Just fade in container, then scale value for count

      // Entry: Simple fade in (no scale)
      timeline.to(
        totalValueContainer,
        {
          opacity: 1,
          duration: 0.4,
          ease: "power2.out"
        },
        0.5 // Start after other elements
      )

      // Scale value up
      timeline.to(
        valueElement,
        {
          scale: 1.7,
          duration: 0.3,
          ease: "back.out(2.0)"
        },
        1.0 // Start after entry
      )

      // Count from old to new (fast)
      // Use a proxy object to animate the number value
      const counterObj = { value: oldValue }
      timeline.to(
        counterObj,
        {
          value: newValue,
          duration: 0.8,
          ease: "power2.inOut",
          onUpdate: () => {
            if (valueElement) {
              valueElement.textContent = `${Math.floor(counterObj.value)}${CURRENCY_SYMBOL}`
            }
          }
        },
        1.3 // During scale
      )

      // Scale back to 1.0
      timeline.to(
        valueElement,
        {
          scale: 1,
          duration: 0.3,
          ease: "power2.out"
        },
        2.1 // After count
      )

      // End with glow highlight
      timeline.to(
        valueElement,
        {
          color: "rgba(255, 255, 255, 1)",
          filter: "drop-shadow(0px 0px 6px #ffffff)",
          duration: 0.3,
          ease: "power2.out"
        },
        2.4 // After scale back
      )

      // Hold glow briefly
      timeline.to(
        valueElement,
        {
          color: "rgba(255, 255, 255, 1)",
          filter: "drop-shadow(0px 0px 6px #ffffff)",
          duration: 0.5
        },
        2.7
      )

      // Fade glow back to normal
      timeline.to(
        valueElement,
        {
          color: "rgba(255, 255, 255, 0.7)",
          filter: "drop-shadow(0px 0px 0px #ffffff)",
          duration: 0.5,
          ease: "power2.out"
        },
        3.2
      )
    } else {
      // ENTRY ANIMATION: Scale + fade in container
      timeline.to(
        totalValueContainer,
        {
          opacity: 1,
          scale: 1,
          duration: 0.4,
          ease: "back.out(20.0)"
        },
        0.5 // Start after other elements
      )
    }

    // Animate action button - simple fade in
    timeline.to(
      actionContainer,
      {
        opacity: 1,
        duration: 0.6,
        ease: "power2.out"
      },
      0.8 // Stagger slightly after value
    )
  }

  const done = () => {
    if (timeline && onTimeline) {
      onTimeline(timeline)
    }
  }

  const run = () => {
    prepare()
    main()
    done()
  }

  $effect(() => {
    if (totalValueContainer && valueElement && actionContainer) {
      run()
    }
  })

  const onclick = async () => {
    ratState.state.transitionTo(RAT_BOX_STATE.CONFIRM_LIQUIDATION)
  }
</script>

<div class="liquidate-rat">
  {#if displayRat}
    <div class="action" bind:this={actionContainer}>
      <BigButton
        text={UI_STRINGS.liquidateRatButtonText($ratTotalValue)}
        tippyText={UI_STRINGS.liquidateRatInstruction}
        type="cash_out"
        {onclick}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .liquidate-rat {
    height: 100%;
    display: flex;
    background-image: url("/images/texture-5.png");

    .action {
      width: 100%;
      padding: 5px;
    }
  }
</style>
