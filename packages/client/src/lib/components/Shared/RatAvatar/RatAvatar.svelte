<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { player } from "$lib/modules/state/stores"
  import { addressToRatParts } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { playSound } from "$lib/modules/sound"
  import { NoImage } from "$lib/components/Shared"
  import gsap from "gsap"

  type RatAnimation = "idle" | "appearance" | "survived" | "died" | "dead"

  let {
    animation = "idle",
    inert = false,
    grayscale = false,
    width = 260
  }: {
    animation?: RatAnimation
    inert?: boolean
    grayscale?: boolean
    width?: number
  } = $props()

  let images = $derived(addressToRatParts($player?.currentRat, $staticContent?.ratImages))

  // Element references for GSAP
  let bodyElement: HTMLDivElement | null = $state(null)
  let armsElement: HTMLDivElement | null = $state(null)
  let headElement: HTMLDivElement | null = $state(null)
  let earsElement: HTMLDivElement | null = $state(null)

  const ROTATION_STRENGTH = 10
  const SKEW_STRENGTH = 10

  let armTimeline: gsap.core.Timeline | null = null
  let deathTimeline: gsap.core.Timeline | null = null
  let clickTimeline: gsap.core.Timeline | null = null

  const onmousedown = (e: MouseEvent) => {
    if (inert) return false
    if (!bodyElement || !armsElement || !headElement || !earsElement) return false
    playSound("ratfunUI", "glassTap")

    // Kill any existing click animation
    if (clickTimeline) {
      clickTimeline.kill()
      clickTimeline = null
    }

    // Reset all elements to initial state immediately
    gsap.set([bodyElement, armsElement, headElement, earsElement], {
      scale: 1,
      scaleY: 1,
      rotation: 0,
      x: 0,
      y: 0,
      skewY: 0
    })

    // Calculate click position relative to container center
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clickX = e.pageX - rect.left
    const centerX = rect.width / 2

    // Define 20% dead zone in the middle (±10% from center)
    const deadZoneSize = rect.width * 0.1
    const leftThreshold = centerX - deadZoneSize
    const rightThreshold = centerX + deadZoneSize

    // Determine rotation based on click position
    let rotationDirection = 0
    let skewDirection = 0

    if (clickX < leftThreshold) {
      // Left side
      rotationDirection = -ROTATION_STRENGTH
      skewDirection = -SKEW_STRENGTH
    } else if (clickX > rightThreshold) {
      // Right side
      rotationDirection = ROTATION_STRENGTH
      skewDirection = SKEW_STRENGTH
    }
    // Middle zone: rotationDirection and skewDirection remain 0

    // Create timeline for animation sequence
    clickTimeline = gsap.timeline()

    clickTimeline.to(
      [bodyElement, armsElement],
      {
        scale: 0.95,
        duration: 0.1,
        ease: "elastic.out(1.5)"
      },
      0
    )

    // Animate head and ears with scale and directional movement
    clickTimeline.to(
      [headElement, earsElement],
      {
        scaleY: 1.2,
        rotation: rotationDirection,
        duration: 0.2,
        y: -10,
        skewY: skewDirection,
        ease: "elastic.out(1.5)",
        delay: 0.1
      },
      0
    )

    clickTimeline.call(
      () => {
        playSound("ratfunUI", "chirp")
      },
      [],
      0.3
    )

    // Wait until 600ms total (matching Mascot's timing), then reset
    clickTimeline.to(
      [headElement, earsElement],
      {
        scale: 1,
        scaleY: 1,
        rotation: 0,
        x: 0,
        y: 0,
        skewY: 0,
        duration: 0.2,
        ease: "elastic.out(1.5)"
      },
      0.4
    )

    clickTimeline.to(
      [bodyElement, armsElement],
      {
        scale: 1,
        duration: 0.2,
        ease: "elastic.out(1.5)"
      },
      0.4
    )
  }

  // Setup animations
  onMount(() => {
    // Setup arm animation for non-dead states
    if (armsElement && !inert && animation !== "dead") {
      armTimeline = gsap.timeline({ repeat: -1, yoyo: true })

      armTimeline.to(armsElement, {
        rotation: -2,
        duration: 0.4
      })

      armTimeline.to(armsElement, {
        rotation: 2,
        duration: 0.4
      })

      armTimeline.play()
    }

    // Setup death animation
    if (animation === "dead" && bodyElement && armsElement && headElement && earsElement) {
      // Kill arm animation if running
      if (armTimeline) {
        armTimeline.kill()
        armTimeline = null
      }

      // Create death animation timeline
      deathTimeline = gsap.timeline()

      // Random offsets for variety
      const bodyRandomX = (Math.random() - 0.5) * 40
      const armsRandomX = (Math.random() - 0.5) * 40
      const headRandomX = (Math.random() - 0.5) * 40

      const bodySkewX = gsap.utils.random(-20, 20)
      const bodySkewY = gsap.utils.random(-15, 15)
      const armsSkewX = gsap.utils.random(-20, 20)
      const armsSkewY = gsap.utils.random(-15, 15)
      const headSkewX = gsap.utils.random(-25, 25)
      const headSkewY = gsap.utils.random(-18, 18)

      // BODY - starts at 2s
      deathTimeline.to(
        bodyElement,
        {
          y: -400,
          x: `+=${bodyRandomX}`,
          opacity: 0,
          skewX: bodySkewX,
          skewY: bodySkewY,
          rotation: gsap.utils.random(-15, 15),
          ease: "power1.in",
          duration: 18
        },
        5
      )

      // Body side-to-side wind motion
      deathTimeline.to(
        bodyElement,
        {
          x: `+=${gsap.utils.random(-40, 40)}`,
          repeat: 6,
          yoyo: true,
          ease: "sine.inOut",
          duration: 2.5
        },
        5
      )

      // ARMS - starts at 1s
      deathTimeline.to(
        armsElement,
        {
          y: -400,
          x: `+=${armsRandomX}`,
          opacity: 0,
          skewX: armsSkewX,
          skewY: armsSkewY,
          rotation: gsap.utils.random(-15, 15),
          ease: "power1.in",
          duration: 19
        },
        6
      )

      // Arms side-to-side wind motion
      deathTimeline.to(
        armsElement,
        {
          x: `+=${gsap.utils.random(-45, 45)}`,
          repeat: 7,
          yoyo: true,
          ease: "sine.inOut",
          duration: 2.5
        },
        6
      )

      // HEAD & EARS - starts immediately
      deathTimeline.to(
        [headElement, earsElement],
        {
          y: -400,
          x: `+=${headRandomX}`,
          opacity: 0,
          scale: 2,
          skewX: headSkewX,
          skewY: headSkewY,
          rotation: gsap.utils.random(-20, 20),
          ease: "power1.in",
          duration: 20
        },
        4
      )

      // Head & ears side-to-side wind motion
      deathTimeline.to(
        [headElement, earsElement],
        {
          x: `+=${gsap.utils.random(-50, 50)}`,
          repeat: 8,
          yoyo: true,
          ease: "sine.inOut",
          duration: 2.5
        },
        4
      )
    }
  })

  onDestroy(() => {
    // Kill timelines immediately without completing animations
    if (armTimeline) {
      armTimeline.kill()
      armTimeline = null
    }
    if (deathTimeline) {
      deathTimeline.kill()
      deathTimeline = null
    }
    if (clickTimeline) {
      clickTimeline.kill()
      clickTimeline = null
    }
  })
</script>

<div {onmousedown} class="rat-container" role="button" tabindex="0" style:--rat-width="{width}px">
  {#if images && images.every(image => image.length > 0)}
    <!-- BODY -->
    <div class="layer ratBodies {animation}" bind:this={bodyElement}>
      <img draggable="false" class="inner colored" src={images[0]} alt="" />
      {#if grayscale}
        <img draggable="false" class="inner grayscale-reveal delay-2" src={images[0]} alt="" />
      {/if}
    </div>
    <!-- ARMS -->
    <div class="layer ratArms {animation}" bind:this={armsElement}>
      <img draggable="false" class="inner colored" src={images[1]} alt="" />
      {#if grayscale}
        <img draggable="false" class="inner grayscale-reveal delay-1" src={images[1]} alt="" />
      {/if}
    </div>
    <!-- HEAD -->
    <div class="layer ratHeads {animation}" bind:this={headElement}>
      <img draggable="false" class="inner colored" src={images[2]} alt="" />
      {#if grayscale}
        <img draggable="false" class="inner grayscale-reveal" src={images[2]} alt="" />
      {/if}
    </div>
    <!-- EARS -->
    <div class="layer ratEars {animation}" bind:this={earsElement}>
      <img draggable="false" class="inner colored" src={images[3]} alt="" />
      {#if grayscale}
        <img draggable="false" class="inner grayscale-reveal" src={images[3]} alt="" />
      {/if}
    </div>
  {:else}
    <NoImage />
  {/if}
</div>

<style lang="scss">
  .rat-container {
    display: block;
    position: relative;
    cursor: pointer;
    user-select: none;
    width: var(--rat-width);
    height: var(--rat-width);
    max-width: 100%;
    max-height: 100%;
    aspect-ratio: 1;
  }

  .layer {
    position: absolute;
    width: 100%;
    height: 100%;
    inset: 0;

    img.inner {
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: absolute;
      inset: 0;
      pointer-events: none;

      &.colored {
        filter: grayscale(0);
      }

      &.grayscale-reveal {
        filter: grayscale(1) contrast(0.2);
        mask: radial-gradient(circle, black 60%, transparent 70%) no-repeat center center;
        mask-size: 0% 0%;
        -webkit-mask: radial-gradient(circle, black 60%, transparent 70%) no-repeat center center;
        -webkit-mask-size: 0% 0%;
        animation: reveal 6s ease-out forwards;

        &.delay-1 {
          mask: radial-gradient(circle, black 60%, transparent 70%) no-repeat center;
          -webkit-mask: radial-gradient(circle, black 60%, transparent 70%) no-repeat center;
          mask-size: 0% 0%;
          -webkit-mask-size: 0% 0%;
          animation: reveal 6s ease-out forwards 1s;
        }

        &.delay-2 {
          mask: radial-gradient(circle, black 60%, transparent 70%) no-repeat center;
          -webkit-mask: radial-gradient(circle, black 60%, transparent 70%) no-repeat center;
          mask-size: 0% 0%;
          -webkit-mask-size: 0% 0%;
          animation: reveal 6s ease-out forwards 2s;
        }
      }
    }

    &.ratBodies {
      transform-origin: 50% 50%;
    }

    &.ratArms {
      transform-origin: 50% 50%;
    }
  }

  @keyframes reveal {
    0% {
      mask-size: 0% 0%;
      -webkit-mask-size: 0% 0%;
    }
    100% {
      mask-size: 250% 250%;
      -webkit-mask-size: 250% 250%;
    }
  }
</style>
