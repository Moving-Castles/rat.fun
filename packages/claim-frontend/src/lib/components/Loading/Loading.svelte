<script lang="ts">
  import { onMount } from "svelte"
  import { page } from "$app/state"
  import { initPublicNetwork } from "$lib/initPublicNetwork"
  import { initEntities } from "$lib/modules/systems/initEntities"
  import { blockNumber, loadingMessage, loadingPercentage, ready } from "$lib/modules/network"

  import { ENVIRONMENT } from "$lib/mud/enums"

  const {
    environment,
    loaded = () => {}
  }: {
    environment: ENVIRONMENT
    loaded: () => void
  } = $props()

  // Elements
  let loadingElement: HTMLDivElement
  let logoElement: HTMLDivElement

  // Wait for both chain sync and minimum duration to complete
  $effect(() => {
    if ($ready) {
      // Initializes and synchronises MUD entities with our state variables
      initEntities()
      loaded()
    }
  })

  onMount(async () => {
    // This sets up the public network and listens to the SyncProgress component
    // When sync is complete, the ready store is set to true
    // We listen to for this in the $effect above
    await initPublicNetwork(environment, page.url)
  })
</script>

<div class="loading" bind:this={loadingElement}>
  <div class="status-box">
    <div class="mc-logo" bind:this={logoElement}>
      <img src="/images/logo.png" alt="Moving Castles GmbH" />
    </div>
    <div>{$loadingPercentage}</div>
  </div>
</div>

<style lang="scss">
  .loading {
    position: fixed;
    top: 0;
    left: 0;
    color: var(--foreground);
    font-size: var(--font-size-normal);
    width: 100vw;
    height: 100vh;
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
