<script lang="ts">
  import { createEventDispatcher, onMount } from "svelte"
  import { ready, loadingMessage } from "@modules/network"
  import { initNetwork } from "@svelte/initNetwork"
  import { initEntities } from "@modules/systems/initEntities"
  import { ENVIRONMENT } from "@mud/enums"
  import { gsap } from "gsap"

  export let environment: ENVIRONMENT

  const dispatch = createEventDispatcher()

  let innerElement: HTMLDivElement

  const done = () => dispatch("done")

  // Finished when chain is ready
  $: if ($ready) {
    initSequence()
  }

  const initSequence = async () => {
    const tl = gsap.timeline()
    tl.call(() => {
      initEntities()
    })
    tl.to(innerElement, {
      opacity: 0,
      duration: 1,
      delay: 1,
    })
    tl.call(() => {
      done()
    })
  }

  onMount(async () => {
    await initNetwork(environment)
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
            background: var(--color-health);
          }
        }
      }
    }
  }
</style>
