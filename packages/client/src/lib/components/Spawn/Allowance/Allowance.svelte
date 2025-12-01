<script lang="ts">
  import { onMount } from "svelte"
  import gsap from "gsap"
  import BigButton from "$lib/components/Shared/Buttons/BigButton.svelte"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"

  let buttonElement: HTMLDivElement | null = $state(null)

  const timeline = gsap.timeline()

  function handleSetAllowance() {
    console.log("[Allowance] Set allowance button clicked")
    spawnState.state.transitionTo(SPAWN_STATE.ALLOWANCE__LOADING)
  }

  onMount(() => {
    console.log("[Allowance] Component mounted")

    if (!buttonElement) {
      return
    }

    buttonElement.style.opacity = "0"

    timeline.to(buttonElement, {
      opacity: 1,
      duration: 0.4
    })
  })
</script>

<div class="outer-container">
  <div class="inner-container">
    <div class="text-container">
      <p>slop machine need permission to spend your tokens</p>
      <p>rats cost tokens</p>
      <p>trips cost tokens</p>
      <p>you spend $RAT to get $RAT</p>
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
      width: 500px;
      max-width: 90dvw;

      .text-container {
        text-align: center;
        margin-bottom: 40px;
        color: var(--foreground);

        h2 {
          font-size: var(--font-size-xlarge);
          margin: 0 0 20px 0;
          font-family: var(--special-font-stack);
        }

        p {
          font-size: var(--font-size-normal);
          margin: 0 0 10px 0;
          line-height: 1.5;
        }
      }

      .button-container {
        width: 100%;
        height: 200px;
      }
    }
  }
</style>
