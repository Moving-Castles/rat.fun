<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { allowanceMascotText } from "./allowanceMascotText"

  let mascotElement: HTMLDivElement | null = $state(null)
  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  function handleSetAllowance() {
    console.log("[Allowance] Set allowance button clicked")
    spawnState.state.transitionTo(SPAWN_STATE.ALLOWANCE__LOADING)
  }

  onMount(() => {
    console.log("[Allowance] Component mounted")

    if (!mascotElement || !buttonElement) {
      return
    }

    gsap.set([mascotElement, buttonElement], { opacity: 0 })

    timeline
      .to(mascotElement, { opacity: 1, duration: 0.4 }, "0")
      .to(buttonElement, { opacity: 1, duration: 0.4 }, "0.2")
  })
</script>

<div class="debug-badge">ALLOWANCE</div>
<div class="outer-container">
  <div class="inner-container">
    <div class="mascot-container" bind:this={mascotElement}>
      <Mascot text={allowanceMascotText} finishTextOnClick={true} />
    </div>

    <div class="button-container" bind:this={buttonElement}>
      <BigButton text="AUTHORIZE SLOP MACHINE" onclick={handleSetAllowance} />
    </div>
  </div>
</div>

<style lang="scss">
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
        pointer-events: none;
      }

      .button-container {
        width: 100%;
        height: var(--spawn-button-height);
      }
    }
  }

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
</style>
