<script lang="ts">
  import Slide from "./Slide.svelte"
  let { onComplete } = $props()
  import { slides } from "./slideDefinitions"

  let index = $state(0)

  const next = () => {
    if (index < slides.length - 1) {
      index++
    } else {
      onComplete()
    }
  }
</script>

<div class="slides">
  {#key index}
    {#snippet buttons()}
      {#if index < slides.length - 1}
        <button onclick={next}>Next</button>
      {:else}
        <button onclick={onComplete}>Enter</button>
      {/if}
    {/snippet}

    <Slide {buttons} slide={slides[index]} onclick={() => {}} />
  {/key}
</div>

<style lang="scss">
  .slides {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
  }

  button {
    padding: 20px;
  }
</style>
