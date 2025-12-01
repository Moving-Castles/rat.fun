<script lang="ts">
  import { onMount } from "svelte"
  import { player } from "$lib/modules/state/stores"
  import gsap from "gsap"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"

  let mascotElement = $state<HTMLDivElement | null>(null)
  let textElement = $state<HTMLDivElement | null>(null)
  let buttonElement = $state<HTMLDivElement | null>(null)

  const timeline = gsap.timeline()

  function handleEnjoy() {
    console.log("[Done] Enjoy button clicked, transitioning to EXIT_FLOW")
    spawnState.state.transitionTo(SPAWN_STATE.EXIT_FLOW)
  }

  onMount(() => {
    console.log("[Done] Component mounted")

    if (!mascotElement || !textElement || !buttonElement) {
      return
    }

    // Set initial opacity to 0
    gsap.set([mascotElement, textElement, buttonElement], {
      opacity: 0
    })

    // Staggered fade-in animations
    timeline
      .to(
        mascotElement,
        {
          opacity: 1,
          duration: 0.4
        },
        "0"
      )
      .to(
        textElement,
        {
          opacity: 1,
          duration: 0.3
        },
        "0.1"
      )
      .to(
        buttonElement,
        {
          opacity: 1,
          duration: 0.3
        },
        "0.2"
      )
  })
</script>

<div class="debug-badge">DONE</div>
<div class="outer-container">
  <div class="inner-container">
    <div class="mascot-container" bind:this={mascotElement}>
      <Mascot smallDanceOn={true} />
    </div>
    <div class="text-container" bind:this={textElement}>
      {$player?.name}, you are set!
    </div>
    <div class="button-container" bind:this={buttonElement}>
      <BigButton text="ENJOY SKILLFULLY" onclick={handleEnjoy} />
    </div>
  </div>
</div>

<style lang="scss">
  .debug-badge {
    position: fixed;
    top: 50px;
    right: 10px;
    background: magenta;
    color: white;
    padding: 4px 8px;
    font-size: 10px;
    font-family: monospace;
    z-index: 9999;
    border-radius: 4px;
  }

  .outer-container {
    display: flex;
    flex-flow: column nowrap;
    height: var(--game-window-height);
    align-items: center;
    justify-content: center;
    color: var(--background);

    .inner-container {
      display: flex;
      flex-flow: column nowrap;
      align-items: center;
      justify-content: center;
      width: 500px;
      max-width: 90dvw;

      .mascot-container {
        width: 300px;
        height: 300px;
      }

      .text-container {
        font-size: var(--font-size-large);
        background: var(--background);
        color: var(--foreground);
        padding: 10px;
        margin-bottom: 20px;
        margin-top: 20px;
      }

      .button-container {
        width: 100%;
        height: 200px;
      }
    }
  }
</style>
