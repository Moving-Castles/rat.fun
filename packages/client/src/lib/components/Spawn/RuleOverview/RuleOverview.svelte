<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import { BigButton, Mascot } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  import { ruleOverviewMascotText } from "./ruleOverviewMascotText"

  let mascotElement = $state<HTMLDivElement | null>(null)
  let buttonElement = $state<HTMLDivElement | null>(null)

  const timeline = gsap.timeline()

  const onClick = () => {
    spawnState.state.transitionTo(SPAWN_STATE.ALLOWANCE)
  }

  onMount(() => {
    console.log("[RuleOverview] Component mounted")

    if (!mascotElement || !buttonElement) {
      return
    }

    gsap.set([mascotElement, buttonElement], { opacity: 0 })

    timeline
      .to(mascotElement, { opacity: 1, duration: 0.4 }, "0")
      .to(buttonElement, { opacity: 1, duration: 0.4 }, "0.2")
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <div class="mascot-container" bind:this={mascotElement}>
      <Mascot text={ruleOverviewMascotText} finishTextOnClick={true} />
    </div>

    <div class="button-container" bind:this={buttonElement}>
      <BigButton text="I ACCEPT THE DOGMA" onclick={onClick} />
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
</style>
