<script lang="ts">
  import { gsap } from "gsap"
  import { onMount } from "svelte"
  let { slide, buttons, onclick } = $props()

  let content = $state<HTMLElement>()
  let text = $state<HTMLElement>()
  let buttonsContainer = $state<HTMLElement>()

  const timeline = gsap.timeline()

  const init = () => {
    if (!content || !text) throw Error("Could not initialize timeline")

    gsap.set(content, { opacity: 0, scale: 0.95 })
    gsap.set(text, { opacity: 0, scale: 0.95 })
    gsap.set(buttonsContainer, { opacity: 0, scale: 0.95 })

    timeline.to(content, {
      scale: 1,
      opacity: 1,
      duration: 0.4,
      ease: "power2.out",
    })

    timeline.to(text, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      ease: "power2.out",
    })
    timeline.to(buttonsContainer, {
      scale: 1,
      opacity: 1,
      duration: 0.3,
      delay: 1,
      ease: "power2.out",
    })
    timeline.play()
  }

  onMount(init)
  $inspect(slide)
</script>

<div {onclick} class="slide">
  <div bind:this={content} class="slide-content">
    {#if slide.type === "video"}
      <video class="video" src={slide.content.source} autoplay muted loop />
    {:else}
      <img class="image" src={slide.content.source} />
    {/if}
  </div>
  <div bind:this={text} class="slide-text">
    <div class="text">
      {slide.text}
    </div>
    {#if buttons}
      <div bind:this={buttonsContainer} class="buttons">
        {@render buttons?.()}
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .slide {
    display: grid;
    grid-template-rows: max-content 200px;
    grid-template-columns: 100%;
    justify-content: center;
    gap: 32px;
    align-items: start;
    width: 100%;

    .slide-content {
      width: 600px;
      height: 450px;
      background-image: url("/images/texture2.jpg");
      background-repeat: repeat;
      overflow: hidden;
      align-self: center;
      justify-self: center;

      img,
      video {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
    }

    .slide-text {
      padding: 0 40px;
      display: flex;
      flex-flow: column;
      justify-content: space-between;
      text-align: center;
      gap: 32px;

      .buttons {
        display: flex;
        gap: 40px;
        justify-content: center;
      }
    }
  }
</style>
