<script lang="ts">
  import { BackButton } from "$lib/components/Shared"

  let {
    src,
    alt = "",
    onClose = () => {}
  }: { src: string; alt?: string; onClose: () => void } = $props()

  let imageElement = $state<HTMLImageElement>()
  let containerElement = $state<HTMLDivElement>()

  const close = () => {
    onClose()
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === "Escape") {
      close()
    }
  }

  const handleContainerClick = (event: MouseEvent) => {
    if (event.target === containerElement) {
      close()
    }
  }
</script>

<svelte:window on:keydown={handleKeydown} />

<!-- svelte-ignore a11y_click_events_have_key_events -->
<div
  bind:this={containerElement}
  onclick={handleContainerClick}
  role="button"
  tabindex="0"
  aria-label="Close lightbox"
  class="lightbox-container"
>
  <img bind:this={imageElement} {src} {alt} class="lightbox-image" draggable="false" />
  <div class="close-button">
    <BackButton onclick={close} />
  </div>
</div>

<style lang="scss">
  .lightbox-container {
    position: fixed;
    inset: 0;
    width: 100dvw;
    height: 100dvh;
    z-index: 10000;
    display: flex;
    align-items: center;
    justify-content: center;
    background: black;
    padding-top: 2rem;
    padding-bottom: 2rem;
  }

  .lightbox-image {
    width: 100%;
    height: 100%;
    max-height: 90%;
    max-width: 90%;
    object-fit: contain;
    margin-top: 40px;
  }

  .close-button {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 10001;
    height: 60px;
    width: 100%;
  }
</style>
