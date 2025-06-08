<script lang="ts">
  import { onMount } from "svelte"
  import { Tween } from "svelte/motion"
  import { bounceIn } from "svelte/easing"
  import Main from "@components/3D/World/Main.svelte"
  import Elevator from "@components/3D/Elevator/Elevator.svelte"

  let { direction }: { direction: number } = $props()
  let key = $state(0)

  let animations = $state({
    moving: new Tween(1, { duration: 200 }), // to change the feet from moving to non moving
    rotationY: new Tween(Math.PI / 2, { duration: 800 }), // for the rat to turn around to face us
    positionZ: new Tween(3, { duration: 3000 }), // for the rat to walk away
    positionY: new Tween(0, { duration: 10001 }), // for the elevator to move up or down
    positionYOffset: new Tween(0, { duration: 1000, easing: bounceIn }),
    doorProgress: new Tween(0, { duration: 1500 }), // for the elevator to move up or down
  })

  const walk = async () => {
    await animations.positionZ.set(-3)
    await animations.rotationY.set(-Math.PI / 2)
    await animations.moving.set(0.2)
    await new Promise(r => setTimeout(r, 1000)) // wait 1s
    animations.positionYOffset.set(-direction * 0.1) // offset for bouncy effect
    await animations.doorProgress.set(1)
    await animations.positionY.set(direction * 19)
  }

  onMount(walk)
</script>

{#key key}
  <!-- svelte-ignore a11y_click_events_have_key_events -->
  <!-- svelte-ignore a11y_no_static_element_interactions -->
  <div onclick={() => key++} class="rat-cam">
    <div class="square">
      <Main>
        <Elevator {animations} />
      </Main>
    </div>
  </div>
{/key}

<style lang="scss">
  .square {
    aspect-ratio: 1 / 1;
    // height: 100%;
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    z-index: var(--z-high);
    aspect-ratio: 1 / 1;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }
</style>
