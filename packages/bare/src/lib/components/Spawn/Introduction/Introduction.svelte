<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"

  let { onComplete }: { onComplete: () => void } = $props()

  // Configuration for slides - easily customizable
  const slides = [
    { image: "/images/enter3.png", width: 400 },
    { image: "/images/enter4.png", width: 400 },
    { image: "/images/enter2.jpg", width: 400 }
  ]

  let currentSlide = $state(0)
  let imageElements: HTMLImageElement[] = $state([])
  let containerElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  onMount(() => {
    if (!containerElement || imageElements.length === 0) return

    // Set initial state - only first image visible
    imageElements.forEach((img, index) => {
      img.style.opacity = index === 0 ? "1" : "0"
      img.style.width = `${slides[index].width}px`
    })
  })

  function onClick() {
    if (currentSlide >= slides.length - 1) {
      // Last slide - trigger completion
      onComplete()
      return
    }

    // Fade out current image
    timeline.to(imageElements[currentSlide], {
      opacity: 0,
      duration: 0.2
    })

    // Move to next slide
    currentSlide++

    // Fade in next image
    timeline.to(imageElements[currentSlide], {
      opacity: 1,
      duration: 0.3
    })
  }
</script>

<div class="outer-container" bind:this={containerElement}>
  <div class="inner-container">
    {#each slides as slide, index}
      <button class="slide-button" onclick={onClick} aria-label="Continue to next slide">
        <img class="slide-image" src={slide.image} alt="RAT.FUN" bind:this={imageElements[index]} />
      </button>
    {/each}
  </div>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      position: relative;

      .slide-button {
        position: absolute;
        background: none;
        border: none;
        padding: 0;
        cursor: pointer;
        outline: none;
      }

      .slide-image {
        height: auto;
        transition: opacity 0.3s ease-out;

        @media (max-width: 900px) {
          width: 70dvw !important;
          height: auto;
        }
      }
    }
  }
</style>
