<script lang="ts">
  import Slide from "./Slide.svelte"
  let { onComplete } = $props()
  import { slides } from "."
  import { BigButton } from "$lib/components/Shared"

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
        <div class="enter-button">
          <BigButton text="Enter" onclick={onComplete} />
        </div>
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

  .enter-button {
    width: 400px;
    height: 80px;
  }
</style>
