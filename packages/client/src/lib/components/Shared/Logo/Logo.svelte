<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { playSound } from "$lib/modules/sound"

  let {
    entranceOn = false,
    onComplete
  }: {
    entranceOn?: boolean
    onComplete?: () => void
  } = $props()

  let logoElement: HTMLDivElement | null = $state(null)
  let layer4Element: HTMLDivElement | null = $state(null)
  let layer3Element: HTMLDivElement | null = $state(null)
  let layer2Element: HTMLDivElement | null = $state(null)
  let layer1Element: HTMLDivElement | null = $state(null)
  let layer5Element: HTMLDivElement | null = $state(null)

  let isAnimating = $state(false)

  const enterTimeline = gsap.timeline({ paused: true })
  const exitTimeline = gsap.timeline()

  onMount(async () => {
    isAnimating = true

    // Starting states
    enterTimeline.set([layer1Element, layer2Element, layer3Element, layer4Element], {
      scale: 0,
      rotation: 0
    })

    enterTimeline.set(logoElement, {
      opacity: 0
    })

    // Play sound
    enterTimeline.call(
      () => {
        playSound({ category: "ratfunUI", id: "logoIn" })
      },
      [],
      "0.5"
    )

    // Fade in whole logo
    enterTimeline.to(
      logoElement,
      {
        duration: 0.7,
        opacity: 0.7,
        ease: "power2.out"
      },
      "0.5"
    )

    // Animate in spiral layer
    enterTimeline.to(
      layer1Element,
      {
        scale: 1,
        duration: 0.5,
        ease: "power2.out"
      },
      "0.5"
    )

    // Scale in text layers
    enterTimeline.to(
      [layer2Element, layer4Element],
      {
        duration: 0.7,
        scale: 1,
        ease: "bounce.out(2.5)"
      },
      "0.5"
    )

    // Scale in mascot layer
    enterTimeline.to(
      layer3Element,
      {
        duration: 1,
        scale: 1,
        ease: "bounce.out(2.5)"
      },
      "0.5"
    )

    // Animation complete
    enterTimeline.call(() => {
      isAnimating = false
    })

    if (entranceOn) {
      enterTimeline.play()
    }
  })

  const onmousedown = () => {
    if (isAnimating) return

    playSound({ category: "ratfunUI", id: "smallButtonDown" })

    gsap.to(logoElement, {
      scale: 1.2,
      duration: 0.2,
      ease: "power2.out"
    })

    gsap.to(layer5Element, {
      opacity: 1,
      duration: 0.2,
      ease: "power2.out"
    })
  }

  const onmouseup = () => {
    if (isAnimating) return

    isAnimating = true
    playSound({ category: "ratfunUI", id: "logoClick" })

    // Fade out text and mascot layers
    exitTimeline.to(
      [layer2Element, layer4Element, layer3Element, layer5Element],
      {
        opacity: 0,
        duration: 0.1,
        ease: "power2.out"
      },
      "0"
    )

    // Animate out whole logo
    exitTimeline.to(
      logoElement,
      {
        scale: 0,
        duration: 0.7,
        rotation: 360,
        ease: "power2.out"
      },
      "0"
    )

    exitTimeline.call(() => {
      onComplete?.()
    })
  }

  const onmouseenter = () => {
    if (isAnimating) return

    playSound({ category: "ratfunUI", id: "smallButtonDown" })

    // Animate highlight on mascot layer
    gsap.to(layer3Element, {
      scale: 1.2,
      rotation: -10,
      duration: 0.2,
      ease: "expo.out"
    })
  }

  const onmouseleave = () => {
    if (isAnimating) return

    playSound({ category: "ratfunUI", id: "smallButtonUp" })

    // Reset mascot layer
    gsap.to(layer3Element, {
      scale: 1,
      rotation: 0,
      duration: 0.2,
      ease: "power2.out"
    })
  }
</script>

<div class="logo-container">
  <div class="logo" bind:this={logoElement}>
    <!-- LAYER 5-->
    <div class="layer layer-5" bind:this={layer5Element}>
      <enhanced:img
        src="../../../../../static/images/logo/logo-layer-5.png"
        draggable={false}
        alt="RAT.FUN"
      />
    </div>
    <!-- LAYER 4-->
    <div class="layer layer-4" bind:this={layer4Element}>
      <enhanced:img
        src="../../../../../static/images/logo/logo-layer-4.png"
        draggable={false}
        alt="RAT.FUN"
      />
    </div>
    <!-- LAYER 3-->
    <div class="layer layer-3" bind:this={layer3Element}>
      <enhanced:img
        src="../../../../../static/images/logo/logo-layer-3.png"
        draggable={false}
        alt="RAT.FUN"
      />
    </div>
    <!-- LAYER 2-->
    <div class="layer layer-2" bind:this={layer2Element}>
      <enhanced:img
        src="../../../../../static/images/logo/logo-layer-2.png"
        draggable={false}
        alt="RAT.FUN"
      />
    </div>
    <!-- LAYER 1 -->
    <div class="layer layer-1" bind:this={layer1Element}>
      <enhanced:img
        src="../../../../../static/images/logo/logo-layer-1.png"
        draggable={false}
        alt="RAT.FUN"
      />
    </div>
  </div>
  <!-- TARGET BUTTON -->
  <button
    {onmouseenter}
    {onmouseleave}
    {onmouseup}
    {onmousedown}
    class:animating={isAnimating}
    class="target-button"
    aria-label="Click logo to continue"
  >
  </button>
</div>

<style lang="scss">
  .logo-container {
    position: relative;
    width: 600px;
    max-width: 80dvw;
    aspect-ratio: 1/1;
    mix-blend-mode: screen;
  }

  .logo {
    position: relative;
    width: 100%;
    height: 100%;
    aspect-ratio: 1/1;
    object-fit: contain;
    pointer-events: none;

    .layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      object-fit: contain;

      &.layer-1 {
        z-index: 1;
      }
      &.layer-2 {
        z-index: 2;
      }
      &.layer-3 {
        z-index: 3;
      }
      &.layer-4 {
        z-index: 4;
      }
      &.layer-5 {
        z-index: 5;
        opacity: 0;
      }
      :global(img) {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }
  }

  .target-button {
    position: absolute;
    top: 5%;
    left: 5%;
    width: 90%;
    height: 90%;
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    outline: none;
    z-index: 10;
    border-radius: 50%;

    &.animating {
      pointer-events: none;
    }
  }
</style>
