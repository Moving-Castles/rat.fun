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
    grayscale = false
  }: {
    animation?: RatAnimation
    inert?: boolean
    grayscale?: boolean
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

  const onmousedown = (e: MouseEvent) => {
    if (inert) return false
    if (!bodyElement || !armsElement || !headElement || !earsElement) return false
    playSound("ratfunUI", "glassTap")

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
    const tl = gsap.timeline()

    tl.to(
      [bodyElement, armsElement],
      {
        scale: 0.95,
        duration: 0.1,
        ease: "elastic.out(1.5)"
      },
      0
    )

    // Animate head and ears with scale and directional movement
    tl.to(
      [headElement, earsElement],
      {
        scale: 1.2,
        rotation: rotationDirection,
        duration: 0.2,
        y: -10,
        skewY: skewDirection,
        ease: "elastic.out(1.5)",
        delay: 0.1
      },
      0
    )

    tl.call(
      () => {
        playSound("ratfunUI", "chirp")
      },
      [],
      0.3
    )

    // Wait until 600ms total (matching Mascot's timing), then reset
    tl.to(
      [headElement, earsElement],
      {
        scale: 1,
        rotation: 0,
        x: 0,
        y: 0,
        skewY: 0,
        duration: 0.2,
        ease: "elastic.out(1.5)"
      },
      0.4
    )

    tl.to(
      [bodyElement, armsElement],
      {
        scale: 1,
        duration: 0.2,
        ease: "elastic.out(1.5)"
      },
      0.4
    )
  }

  // Setup constant arm animation
  onMount(() => {
    if (!armsElement || inert || animation == "dead") return

    // Create timeline inside onMount for proper scoping
    armTimeline = gsap.timeline({ repeat: -1, yoyo: true })

    armTimeline.to(armsElement, {
      rotation: -2,
      duration: 0.4
      // ease: "sine.inOut"
    })

    armTimeline.to(armsElement, {
      rotation: 2,
      duration: 0.4
      // ease: "sine.inOut"
    })

    armTimeline.play()
  })

  onDestroy(() => {
    // Kill timeline immediately without completing animations
    if (armTimeline) {
      armTimeline.kill()
      armTimeline = null
    }
  })
</script>

<div {onmousedown} class="rat-container" role="button" tabindex="0">
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
    width: 260px;
    height: 260px;
    display: block;
    position: relative;
    cursor: pointer;
    user-select: none;
  }

  .layer {
    position: absolute;
    width: 260px;
    inset: 0;
    opacity: 0.9;

    img.inner {
      width: 100%;
      height: 100%;
      object-fit: contain;
      position: absolute;
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
