<script lang="ts">
  import { onMount } from "svelte"
  import { player } from "$lib/modules/state/stores"
  import gsap from "gsap"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { getDoneMascotText } from "./doneMascotText"

  let mascotElement = $state<HTMLDivElement | null>(null)
  let buttonElement = $state<HTMLDivElement | null>(null)

  const timeline = gsap.timeline()

  const mascotText = $derived(getDoneMascotText($player?.name ?? "Operator"))

  function handleEnjoy() {
    console.log("[Done] Enjoy button clicked, transitioning to EXIT_FLOW")
    spawnState.state.transitionTo(SPAWN_STATE.EXIT_FLOW)
  }

  onMount(() => {
    console.log("[Done] Component mounted")

    if (!mascotElement || !buttonElement) {
      return
    }

    gsap.set([mascotElement, buttonElement], { opacity: 0 })

    timeline
      .to(mascotElement, { opacity: 1, duration: 0.4 }, "0")
      .to(buttonElement, { opacity: 1, duration: 0.4 }, "0.2")
  })
</script>

<div class="debug-badge">DONE</div>
<div class="outer-container">
  <div class="inner-container">
    <div class="mascot-container" bind:this={mascotElement}>
      <Mascot smallDanceOn={true} text={mascotText} finishTextOnClick={true} />
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
    display: none;
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
      width: var(--spawn-inner-width);
      max-width: 90dvw;

      .mascot-container {
        width: var(--spawn-mascot-size);
        height: var(--spawn-mascot-size);
        margin-bottom: var(--spawn-mascot-margin-bottom);
      }

      .button-container {
        width: 100%;
        height: var(--spawn-button-height);
      }
    }
  }
</style>
