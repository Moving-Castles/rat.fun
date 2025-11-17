<script lang="ts">
  import { HEALTH_SYMBOL } from "$lib/modules/ui/constants"
  import { gsap } from "gsap"

  let {
    oldHealth,
    newHealth
  }: {
    oldHealth: number
    newHealth: number
  } = $props()

  // Health 0-25 => 1
  // Health 26-50 => 2
  // Health 51-75 => 3
  // Health 76-> => 4
  const getHealthColor = (health: number): string => {
    const level = Math.floor(health / 25)
    if (level === 0) return "rgb(255, 66, 66)" // Red
    if (level === 1) return "rgb(255, 126, 21)" // Orange
    if (level === 2) return "rgb(129, 255, 255)" // Cyan
    return "rgb(135, 255, 135)" // Green
  }

  let oldHealthColor = $derived(getHealthColor(oldHealth))
  let newHealthColor = $derived(getHealthColor(newHealth))

  // Elements
  let valueElement = $state<HTMLSpanElement | null>(null)
  let fillElement = $state<HTMLDivElement | null>(null)
  let initialized = $state(false)

  const hasChanges = oldHealth !== newHealth

  $effect(() => {
    if (!valueElement || !fillElement || initialized) return

    initialized = true

    // Set initial state - show old values immediately
    gsap.set(valueElement, { textContent: oldHealth })
    gsap.set(fillElement, {
      width: `${oldHealth}%`,
      backgroundColor: oldHealthColor
    })

    if (hasChanges) {
      // CHANGE ANIMATION
      // Container slides in (0.4s from RatStats), wait 0.2s, then animate to new values

      // Animate the numeric value
      gsap.to(valueElement, {
        textContent: newHealth,
        duration: 1.0,
        snap: { textContent: 1 },
        ease: "power2.out",
        delay: 0.6 // 0.4s entry + 0.2s wait
      })

      // Animate the fill bar width
      gsap.to(fillElement, {
        width: `${newHealth}%`,
        duration: 1.0,
        ease: "power2.out",
        delay: 0.6 // Same timing as value
      })

      // Animate the color change
      gsap.to(fillElement, {
        backgroundColor: newHealthColor,
        duration: 1.0,
        ease: "power2.out",
        delay: 0.6 // Same timing as value and width
      })
    }
  })
</script>

<div class="health-bar">
  <div class="health-bar-inner">
    <span class="health-bar-inner-value">
      {HEALTH_SYMBOL} <span bind:this={valueElement}>{oldHealth}</span>
    </span>
    <div
      bind:this={fillElement}
      class="health-bar-inner-fill"
      style:width="{oldHealth}%"
      style:background-color={oldHealthColor}
    ></div>
  </div>
</div>

<style lang="scss">
  .health-bar {
    width: 100%;
    height: 100%;
    transition: background-color 0.2s ease;
    overflow: hidden;

    .health-bar-inner {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .health-bar-inner-value {
      position: absolute;
      top: 50%;
      left: 10px;
      transform: translateY(-50%);
      z-index: 2;
      color: black;
      pointer-events: none;
    }

    .health-bar-inner-fill {
      position: absolute;
      top: 0;
      left: 0;
      height: 100%;
      /* No CSS transition - GSAP handles all animation */
    }
  }
</style>
