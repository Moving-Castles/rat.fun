<script lang="ts">
  import { BigButton } from "$lib/components/Shared"
  import { spawnState, SPAWN_STATE } from "$lib/components/Spawn/state.svelte"
  let buttonElement = $state<HTMLDivElement | null>(null)

  const onClick = () => {
    spawnState.state.transitionTo(SPAWN_STATE.ALLOWANCE)
  }
</script>

<div class="debug-badge">INTRODUCTION</div>
<div class="outer-container">
  <div class="inner-container">
    <div class="text-container">
      <p>first time loggin on?</p>
      <p>These are the basics:</p>
      <p>buy rat</p>
      <p>send to trip</p>
      <p>rat survive or die</p>
      <p>get health and objects</p>
      <p>cash out value</p>
      <p>repeat</p>
      <p>do not get attached to rat</p>
    </div>
    <div class="button-container" bind:this={buttonElement}>
      <BigButton text="I WILL NOT GET ATTACHED TO RAT" onclick={onClick} />
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
      width: 700px;
      max-width: 90dvw;

      .mascot-container {
        width: 400px;
        height: 400px;
        margin-bottom: 20px;
        cursor: pointer;
      }

      .button-container {
        width: 100%;
        height: 160px;
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
  }
</style>
