<script lang="ts">
  import { onMount } from "svelte"
  import { ready, loadingMessage } from "$lib/modules/network"
  import { initPublicNetwork } from "$lib/initPublicNetwork"
  import { initEntities } from "$lib/modules/systems/initEntities"
  import { ENVIRONMENT } from "$lib/mud/enums"
  import { gsap } from "gsap"

  const { environment, loaded = () => {} } = $props<{
    environment: ENVIRONMENT
    loaded: () => void
  }>()

  let innerElement: HTMLDivElement

  $effect(() => {
    if ($ready) {
      // Done here because currently we are not filtering on by playerAddress
      initEntities()
      // Animate out
      initSequence()
    }
  })

  const initSequence = async () => {
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
    await initPublicNetwork(environment)
  })
</script>

<div class="loading" class:done={Number($loadingMessage) === 100}>
  <div class="inner" bind:this={innerElement}>
    <img src="/images/logo.png" alt="logo" />
    <div class="message">
      <span class="highlight" class:ready={$ready}>{$loadingMessage}</span>
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
        height: 200px;
      }

      .message {
        margin-top: 20px;

        .highlight {
          background: var(--color-value);
          color: var(--background);
          padding: 5px;

          &.ready {
            background: var(--color-success);
          }
        }
      }
    }
  }
</style>
