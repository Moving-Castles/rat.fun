<script lang="ts">
  import { player } from "$lib/modules/state/stores"
  import { BigButton } from "$lib/components/Shared"
  import gsap from "gsap"
  import { onMount } from "svelte"

  let { onComplete }: { onComplete: () => void } = $props()

  let imageElement = $state<HTMLImageElement | null>(null)
  let buttonElement = $state<HTMLDivElement | null>(null)
  let textElement = $state<HTMLParagraphElement | null>(null)
  const timeline = gsap.timeline()

  onMount(() => {
    if (!imageElement || !buttonElement || !textElement) return

    // Set initial opacity to 0
    imageElement.style.opacity = "0"
    buttonElement.style.opacity = "0"
    textElement.style.opacity = "0"

    timeline.to(imageElement, {
      opacity: 1,
      duration: 0.4,
      delay: 0.4
    })
    timeline.to(textElement, {
      opacity: 1,
      duration: 0.4
    })
    timeline.to(buttonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <p bind:this={textElement}>{$player?.name}, you are set!</p>
    <div class="button" bind:this={buttonElement}>
      <BigButton id="skillz" text="ENJOY SKILLFULLY" onclick={onComplete} />
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
    color: var(--background);

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;

      .button {
        width: 100%;
        height: 80px;
      }
    }
  }
</style>
