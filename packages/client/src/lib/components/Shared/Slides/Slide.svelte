<script lang="ts">
  import type { Slide } from "./types"
  import { onMount } from "svelte"
  import { gsap } from "gsap"

  let { slide, buttons, onclick }: { slide: Slide; buttons: any; onclick: () => void } = $props()

  let content = $state<HTMLElement>()
  let text = $state<HTMLElement>()
  let buttonsContainer = $state<HTMLElement>()

  const timeline = gsap.timeline()

  const init = () => {
    if (!content || !text || !buttonsContainer) throw Error("Could not initialize timeline")

    gsap.set(content, { opacity: 0, scale: 0.95 })
    gsap.set(text, { opacity: 0, scale: 0.95 })
    gsap.set(buttonsContainer, { opacity: 0, scale: 0.95 })

    timeline.to(content, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })

    timeline.to(text, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })

    timeline.to(buttonsContainer, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out"
    })
    timeline.play()
  }

  onMount(init)
</script>

<!-- svelte-ignore a11y_click_events_have_key_events -->
<!-- svelte-ignore a11y_no_static_element_interactions -->
<div {onclick} class="slide">
  <div bind:this={content} class="slide-content">
    {#if slide.type === "video" && slide.content?.source}
      <video class="video" src={slide.content.source} autoplay muted loop></video>
    {/if}
    {#if slide.type === "image" && slide.content?.source}
      <img class="image" src={slide.content.source} alt={slide.text} />
    {/if}
  </div>
  <div bind:this={text} class="slide-text">
    {#if slide.text}
      <div class="text">
        {@html slide.text}
      </div>
    {/if}
    {#if buttons}
      <div bind:this={buttonsContainer} class="buttons">
        {@render buttons?.()}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .slide {
    justify-content: center;
    gap: 32px;
    align-items: start;
    width: 100%;
    width: 800px;
    max-width: 100%;

    .slide-content {
      width: 100%;
      background-repeat: repeat;
      overflow: hidden;
      align-self: center;
      justify-self: center;
      display: flex;
      align-items: center;
      justify-content: center;

      img,
      video {
        object-fit: contain;
        max-height: 70dvh;
        border: var(--default-border-style);
        margin-bottom: 20px;
      }
    }

    .slide-text {
      padding: 0;
      display: flex;
      flex-flow: column;
      justify-content: space-between;
      text-align: center;
      font-size: var(--font-size-extra-large);

      .buttons {
        margin-top: 20px;
        display: flex;
        gap: 40px;
        justify-content: center;
      }
    }
  }
</style>
