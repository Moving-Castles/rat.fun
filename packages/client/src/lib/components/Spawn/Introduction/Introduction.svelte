<script lang="ts">
  import { onMount } from "svelte"
  import { BigButton } from "$lib/components/Shared"
  import gsap from "gsap"

  let { onComplete }: { onComplete: () => void } = $props()

  let imageElement: HTMLImageElement | null = $state(null)
  let enterButtonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  onMount(() => {
    if (!imageElement || !enterButtonElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    enterButtonElement.style.opacity = "0"

    timeline.to(imageElement, {
      opacity: 1,
      duration: 0.4
    })
    timeline.to(enterButtonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <img class="image" src="/images/enter2.jpg" alt="RAT.FUN" bind:this={imageElement} />
    <div class="button" bind:this={enterButtonElement}>
      <BigButton text="Enter" onclick={onComplete} />
    </div>
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
      width: 500px;

      img {
        height: 60dvh;
      }

      .button {
        margin-top: 20px;
        width: 400px;
        height: 80px;
      }
    }
  }
</style>
