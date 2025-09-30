<script lang="ts">
  import { onMount } from "svelte"
  import { ready, loadingPercentage } from "$lib/modules/network"
  import { initPublicNetwork } from "$lib/initPublicNetwork"
  import { initEntities } from "$lib/modules/systems/initEntities"

  import { ENVIRONMENT } from "$lib/mud/enums"
  import { gsap } from "gsap"

  const { environment, loaded = () => {} } = $props<{
    environment: ENVIRONMENT
    loaded: () => void
  }>()

  let innerElement: HTMLDivElement

  // Wait for chain sync to complete
  $effect(() => {
    if ($ready) {
      // ??? Explain what this does
      initEntities()
      // We are loaded. Animate the component out...
      animateOut()
    }
  })

  const animateOut = async () => {
    const tl = gsap.timeline()
    tl.to(innerElement, {
      opacity: 0,
      duration: 1,
      delay: 1
    })
    tl.call(() => {
      loaded()
    })
  }

  onMount(async () => {
    // This sets up the public network and listens to the SyncProgress component
    // When sync is complete, the ready store is set to true
    // We listen to for this in the $effect above
    await initPublicNetwork(environment)
  })
</script>

<div class="loading">
  <div class="inner" bind:this={innerElement}>
    <img src="/images/logo.png" alt="logo" />
    <div class="message">
      {#if $ready}
        <span class="highlight ready">All systems ready</span>
      {:else}
        <span class="highlight">Booting machine: {$loadingPercentage}%</span>
      {/if}
    </div>
  </div>
</div>

<style lang="scss">
  .loading {
    text-align: center;

    .inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100%;

      img {
        height: 160px;
      }

      .message {
        margin-top: 20px;

        .highlight {
          background: var(--foreground);
          color: var(--background);
          padding: 5px;

          &.ready {
            background: var(--color-alert-priority);
          }
        }
      }
    }
  }
</style>
