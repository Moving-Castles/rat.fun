<script lang="ts">
  import { onMount } from "svelte"
  import { player } from "$lib/modules/state/stores"
  import gsap from "gsap"
  import { BigButton } from "$lib/components/Shared"

  let { onComplete }: { onComplete: () => void } = $props()

  let buttonElement = $state<HTMLDivElement | null>(null)
  let textElement = $state<HTMLParagraphElement | null>(null)
  const timeline = gsap.timeline()

  onMount(() => {
    if (!buttonElement || !textElement) {
      return
    }

    // Set initial opacity to 0
    buttonElement.style.opacity = "0"
    textElement.style.opacity = "0"

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
      <BigButton text="ENJOY SKILLFULLY" onclick={onComplete} />
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
      max-width: 90dvw;

      .button {
        width: 100%;
        height: 200px;
      }

      p {
        font-size: var(--font-size-large);
        background: var(--background);
        color: var(--foreground);
        padding: 10px;
      }
    }
  }
</style>
