<script lang="ts">
  import { player } from "$lib/modules/state/stores"
  import { addressToRatParts } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { playSound } from "$lib/modules/sound"
  import { NoImage } from "$lib/components/Shared"
  import { Spring } from "svelte/motion"

  type RatAnimation = "idle" | "appearance" | "survived" | "died" | "dead"

  let {
    animation = "idle",
    inert = false
  }: {
    animation?: RatAnimation
    inert?: boolean
  } = $props()

  let rect = $state<DOMRect>()
  let isDragging = $state(false)

  const fields = ["ratBodies", "ratArms", "ratHeads", "ratEars"]

  let images = $derived(addressToRatParts($player?.currentRat, $staticContent?.ratImages))

  let [
    bodyScale,
    headTweenX,
    headTweenY,
    headScale,
    headTilt,
    earsTilt,
    armsScale,
    armsTilt,
    armsTranslate
  ] = [
    new Spring(1, { stiffness: 0.2 }),
    new Spring(0, { stiffness: 0.2 }),
    new Spring(0, { stiffness: 0.2 }),
    new Spring(1, { stiffness: 0.1 }),
    new Spring(1, { stiffness: 0.1 }),
    new Spring(1, { stiffness: 0.2 }),
    new Spring(1, { stiffness: 0.5 }),
    new Spring(1, { stiffness: 0.4 }),
    new Spring(0, { stiffness: 0.4 })
  ]

  let transforms = $derived([
    `scale(${bodyScale.current}) rotate(${headTilt.current / 2}deg)`,
    `scale(${armsScale.current}) rotate(${armsTilt.current}deg) translateY(${armsTranslate.current}px)`,
    `translateX(${headTweenX.current}px) translateY(${headTweenY.current}px) scale(${headScale.current}) rotate(${earsTilt.current}deg)`,
    `translateX(${headTweenX.current}px) translateY(${headTweenY.current}px) scale(${headScale.current}) rotate(${earsTilt.current}deg)`
  ])

  const onmousedown = (e: MouseEvent) => {
    if (inert) return false
    playSound("ratfunUI", "glassTap")
    isDragging = true
    rect = e.currentTarget ? (e.currentTarget as HTMLElement).getBoundingClientRect() : undefined
    bodyScale.set(0.8)
    armsScale.set(1.1)
    headScale.set(1.5)
    armsTranslate.set(45)
  }

  const onmousemove = (e: MouseEvent) => {
    if (!isDragging || !rect?.left || inert) return

    const movementX = e.pageX - rect.left - rect.width / 2
    const movementY = e.pageY - rect.top - rect.height / 2
    headTweenX.set(movementX / 2)
    headTweenY.set(movementY / 2)
    headTilt.set(movementX / 20)
    armsTilt.set(movementX / 10)
    earsTilt.set(movementX / 10)
  }

  const onmouseup = (e: MouseEvent) => {
    if (inert) return false

    playSound("ratfunUI", "chirp")

    isDragging = false
    headScale.set(1)
    headTweenX.set(0)
    headTweenY.set(0)
    headTilt.set(0)
    armsScale.set(1)
    armsTilt.set(1)
    earsTilt.set(1)
    bodyScale.set(1)
    headScale.set(1)
    armsTranslate.set(0)
  }
</script>

<svelte:body {onmousemove} {onmouseup} />

<div {onmousedown} class="rat-container" role="button" tabindex="0">
  {#if (images ?? []).every(image => image.length > 0)}
    {#each images as src, i}
      <div class="layer {fields[i]} {animation}">
        <div class="interactions" style:transform={transforms[i]}>
          <img draggable="false" class="inner" src={src || ""} alt="" />
        </div>
      </div>
    {/each}
  {:else}
    <NoImage />
  {/if}
</div>

<style lang="scss">
  .rat-container {
    width: 260px;
    height: 260px;
    display: block;
    // background: red;
    position: relative;
    cursor: grab;
    user-select: none;
  }

  .layer {
    position: absolute;
    width: 260px;
    inset: 0;

    &.ratBodies {
      transform-origin: 50% 100%;

      .interactions {
        transform-origin: 50% 100%;
      }
    }

    &.ratArms {
      transform-origin: 50% 100%;

      .interactions {
        transform-origin: 50% 100%;
      }
    }

    &.ratEars,
    &.ratHeads {
      // transform-origin: 50% 150%;

      .interactions {
        transform-origin: 50% 0%;
      }

      &.survived {
        animation: bobbleHead 1s ease infinite;
      }
    }
  }

  img {
    pointer-events: none;
  }

  @keyframes bobbleHead {
    0%,
    100% {
      transform: rotate(0deg) translate(0, 0) scale(1);
    }
    33% {
      transform: rotate(4deg) translate(-12px, 0) scale(1.1);
    }
    66% {
      transform: rotate(3deg) translate(12px, 0) scale(1.1);
    }
  }
</style>
