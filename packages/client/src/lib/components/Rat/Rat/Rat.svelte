<script lang="ts">
  import { player, playerAddress } from "$lib/modules/state/stores"
  import { addressToRatParts } from "$lib/modules/utils"
  import { staticContent } from "$lib/modules/content"
  import { urlFor } from "$lib/modules/content/sanity"
  import { NoImage } from "$lib/components/Shared"
  import { Tween, Spring } from "svelte/motion"

  type RatAnimation = "idle" | "appearance" | "survived" | "died" | "dead"

  let {
    animation = "idle"
  }: {
    animation: RatAnimation
  } = $props()

  let rect = $state<DOMRect>()
  let isDragging = $state(false)

  const fields = ["ratBodies", "ratEars", "ratArms", "ratHeads"]

  const emptyImage = new Image(1, 1)

  let numbers = $derived(addressToRatParts($playerAddress, $player?.currentRat))
  let images = $derived(
    numbers.map((num, i) => {
      const key = fields[i]
      // console.log(key, num, $staticContent.ratImages)
      const ratImagesDocument = $staticContent.ratImages

      if (
        !ratImagesDocument ||
        !ratImagesDocument.ratBodies ||
        !ratImagesDocument.ratEars ||
        !ratImagesDocument.ratArms ||
        !ratImagesDocument.ratHeads
      )
        return false

      const image = ratImagesDocument[key].find((_, i) => i == num).asset
      if (image) {
        const result = urlFor(image)
        if (!result) return false
        const src = result.width(260).url()
        // console.log("source", src)
        return src
      } else {
        console.warn("error: no asset for ", key)
        return false
      }
    })
  )
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
    `translateX(${headTweenX.current}px) translateY(${headTweenY.current}px) scale(${headScale.current}) rotate(${earsTilt.current}deg)`,
    `scale(${armsScale.current}) rotate(${armsTilt.current}deg) translateY(${armsTranslate.current}px)`,
    `translateX(${headTweenX.current}px) translateY(${headTweenY.current}px) scale(${headScale.current}) rotate(${headTilt.current}deg)`
  ])

  const onmousedown = e => {
    isDragging = true
    rect = e.currentTarget.getBoundingClientRect()
    bodyScale.set(0.8)
    armsScale.set(1.1)
    headScale.set(1.5)
    armsTranslate.set(45)
  }

  const onmousemove = e => {
    if (!isDragging || !rect?.left) return

    const movementX = e.pageX - rect.left - rect.width / 2
    const movementY = e.pageY - rect.top - rect.height / 2
    headTweenX.set(Math.min(movementX / 2, 30))
    headTweenY.set(Math.min(movementY / 2, 30))
    headTilt.set(movementX / 20)
    armsTilt.set(movementX / 10)
    earsTilt.set(movementX / 10)
  }

  const onmouseup = e => {
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

<div {onmousedown} {onmousemove} {onmouseup} class="rat-container">
  {#if !images.some(image => false)}
    {#each images as src, i}
      <div class="layer {fields[i]} {animation}">
        <div class="interactions" style:transform={transforms[i]}>
          <img draggable="false" class="inner" {src} alt="" />
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
    -webkit-user-drag: none;
    -khtml-user-drag: none;
    -moz-user-drag: none;
    -o-user-drag: none;
    user-drag: none;
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
