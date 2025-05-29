<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Tween } from "svelte/motion"
  import Main from "@components/3D/World/Main.svelte"
  import Box from "@components/3D/Box/Box.svelte"
  import ModalTarget from "../../Modal/ModalTarget.svelte"

  let progress = new Tween(0, { duration: 2000 })
  let showPettable = $state(false)

  onMount(() => {
    progress.set(1)
  })

  onDestroy(() => {
    progress.set(0)
  })
</script>

<div
  class="rat-cam"
  onclick={() => {
    showPettable = !showPettable
  }}
>
  <div class="overlay">
    <img src="/images/cutout-test-3.png" alt="cutout" />
  </div>
  <div class="square">
    <Main>
      <Box></Box>
    </Main>
  </div>
</div>

{#snippet bigCam()}
  <div class="big-rat-cam">
    <Main>
      <Box canPet></Box>
    </Main>
  </div>
{/snippet}

{#if showPettable}
  <ModalTarget onclose={() => (showPettable = false)} content={bigCam}
  ></ModalTarget>
{/if}

<style lang="scss">
  .rat-cam {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    align-self: flex-end;
    position: relative;
    aspect-ratio: 1;
    padding: 5px;
  }

  .square {
    width: 200px;
    height: 200px;
    // aspect-ratio: 1 / 1;
    // height: 100%;
  }

  .big-rat-cam {
    width: calc(var(--game-window-height) * 0.6);
    height: calc(var(--game-window-height) * 0.6);
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: 1;
    aspect-ratio: 1 / 1;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
