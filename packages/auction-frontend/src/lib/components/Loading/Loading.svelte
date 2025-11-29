<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/state"
  import { initNetwork, networkReady, loadingMessage, ENVIRONMENT } from "$lib/network"

  const {
    environment,
    loaded = () => {}
  }: {
    environment: ENVIRONMENT
    loaded: () => void
  } = $props()

  // When network is ready, call loaded callback
  $effect(() => {
    if ($networkReady) {
      loaded()
    }
  })

  onMount(async () => {
    // Initialize network (drawbridge + read external addresses)
    await initNetwork(environment, page.url)
  })
</script>

<div class="loading">
  <div class="status-box">
    <div class="mc-logo">
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
