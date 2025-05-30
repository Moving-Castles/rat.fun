<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Tween } from "svelte/motion"
  import { getModalState } from "@components/Main/Modal/state.svelte"
  import { rat } from "@modules/state/base/stores"
  import Main from "@components/3D/World/Main.svelte"
  import Box from "@components/3D/Box/Box.svelte"
  import PetRat from "@components/3D/PetRat/PetRat.svelte"
  import ModalTarget from "../../Modal/ModalTarget.svelte"

  let { modal } = getModalState()
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
    <div class="info-item">
      <span class="name">{$rat.name}</span>
    </div>

    <Main>
      <PetRat></PetRat>
    </Main>
    <button
      class="close priority"
      onclick={() => {
        console.log("showPettable", showPettable)
        modal.close()
      }}>X</button
    >
  </div>
{/snippet}

{#if showPettable}
  <ModalTarget
    fullscreen={true}
    onclose={() => (showPettable = false)}
    content={bigCam}
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
    width: calc(var(--game-window-width) - 20px);
    height: var(--game-window-height);
    position: relative;

    .info-item {
      left: 50%;
      bottom: 20px;
      position: absolute;
      transform: translateX(-50%);
      z-index: 99;

      .name {
        background: var(--color-alert);
        padding-right: 5px;
        color: var(--foreground);
        font-family: var(--label-font-stack);
        letter-spacing: -0.2em;
        font-size: var(--font-size-large);
        font-size: 50px;
        color: var(--background);
      }
    }

    .close {
      position: absolute;
      top: 0;
      right: 0;
      z-index: 99;
      width: 20px;
      height: 20px;
      background: red;
    }
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
