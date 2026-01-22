<script lang="ts">
  import { onMount } from "svelte"
  import { initNetwork, networkReady, loadingMessage } from "$lib/network"

  const {
    loaded = () => {}
  }: {
    loaded: () => void
  } = $props()

  // Elements
  let loadingElement: HTMLDivElement
  let logoElement: HTMLDivElement

  // Wait for network ready to complete
  $effect(() => {
    if ($networkReady) {
      loaded()
    }
  })

  onMount(async () => {
    // Initialize network and drawbridge
    await initNetwork()
  })
</script>

<div class="loading" bind:this={loadingElement}>
  <div class="status-box">
    <div class="mc-logo" bind:this={logoElement}>
      <img src="/images/logo.png" alt="Moving Castles GmbH" />
    </div>
    <div>{$loadingMessage}</div>
  </div>
</div>

<style lang="scss">
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    width: 100dvw;
    height: 100dvh;
    z-index: var(--z-top);
    user-select: none;

    .status-box {
      position: fixed;
      top: 50%;
      right: 50%;
      transform: translate(50%, -50%);
      padding: 10px;
      font-size: var(--font-size-normal);
      color: white;
      min-width: 500px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 10px;

      .mc-logo {
        width: 100px;

        img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
      }
    }
  }
</style>
