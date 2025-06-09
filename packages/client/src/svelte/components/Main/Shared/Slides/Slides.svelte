<script lang="ts">
  import Slide from "./Slide.svelte"
  let { onComplete } = $props()

  let slides = $state([
    {
      type: "image",
      text: `Now this is a story all about how... My life got flipped turned upside down. And I'd like? to take? a minute?? Just sit right. There, I'll tell you how I became the prince of a town called Bel-Air`,
      content: {
        source: "/images/placeholder/slides/landscape.png",
      },
    },
    {
      type: "image",
      text: `Now this is a story all about how... My life got flipped turned upside down. And I'd like? to take? a minute?? Just sit right. There, I'll tell you how I became the prince of a town called Bel-Air`,
      content: {
        source: "/images/placeholder/slides/portrait.png",
      },
    },
    {
      type: "image",
      text: `Now this is a story all about how... My life got flipped turned upside down. And I'd like? to take? a minute?? Just sit right. There, I'll tell you how I became the prince of a town called Bel-Air`,
      content: {
        source: "/images/placeholder/slides/square.png",
      },
    },
    {
      type: "video",
      text: `There, I'll tell you how I became the prince of a town called Bel-Air`,
      content: {
        source: "/images/placeholder/slides/creeps.mp4",
      },
    },
  ])
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
        <button onclick={onComplete}>Finish</button>
      {/if}
    {/snippet}

    <Slide {buttons} slide={slides[index]} />
  {/key}
</div>

<style lang="scss">
  .slides {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    // padding-top: 15px;
  }
</style>
