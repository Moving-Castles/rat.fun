<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  // import { playSound } from "$lib/modules/sound"

  let { onComplete }: { onComplete: () => void } = $props()

  let containerElement: HTMLDivElement | null = $state(null)

  const exitTimeline = gsap.timeline()

  onMount(() => {
    gsap.set(".logo img", {
      opacity: 0
    })

    gsap.to(".logo img", {
      opacity: 1,
      duration: 0.3,
      ease: "power2.inOut"
    })
  })

  const onClick = () => {
    // playSound("ratfunUI", "releaseConnect")

    exitTimeline.play()

    exitTimeline.set(".logo img", {
      opacity: 1,
      scale: 0.9
    })

    exitTimeline.to(".logo img", {
      opacity: 0,
      scale: 0,
      duration: 0.5,
      ease: "power2.inOut"
    })

    exitTimeline.call(onComplete)
  }

  const onmousedown = () => {
    // playSound("ratfunUI", "clickDownHeavy")
  }
</script>

<div class="outer-container" bind:this={containerElement}>
  <button class="inner-container" onclick={onClick} {onmousedown}>
    <div class="logo">
      <img src="/images/logo8.png" draggable={false} alt="RAT.FUN" />
    </div>
  </button>
</div>

<style lang="scss">
  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: white;

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      position: relative;
      color: var(--background);
    }

    button {
      background: none;
      border: none;
      padding: 0;
      cursor: pointer;
      outline: none;

      &:active {
        transform: scale(0.9);
      }

      img {
        width: 600px;
        height: 100%;
        object-fit: contain;
      }
    }
  }
</style>
