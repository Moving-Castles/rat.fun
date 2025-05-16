<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Tween } from "svelte/motion"
  import Main from "@components/3D/World/Main.svelte"
  import Elevator from "@components/3D/Elevator/Elevator.svelte"

  let { direction }: { direction: number } = $props()

  let animations = $state({
    moving: new Tween(1, { duration: 200 }), // to change the feet from moving to non moving
    rotationY: new Tween(Math.PI / 2, { duration: 800 }), // for the rat to turn around to face us
    positionX: new Tween(0, { duration: 3000 }), // for the rat to walk away
    positionY: new Tween(0, { duration: 10000 }), // for the elevator to move up or down
    doorProgress: new Tween(0, { duration: 2000 }), // for the elevator to move up or down
  })

  const walk = async () => {
    await animations.positionX.set(3)
    await animations.rotationY.set(-Math.PI / 2)
    await animations.moving.set(0)
    await new Promise(r => setTimeout(r, 1000)) // wait 1s
    await animations.doorProgress.set(1)
    await animations.positionY.set(direction * 10)
  }

  onMount(walk)
</script>

<div class="rat-cam">
  <div class="square">
    <Main>
      <Elevator {animations} />
    </Main>
  </div>
</div>

<style lang="scss">
  .rat-cam {
    // height: 100%;
    // display: flex;
    // justify-content: center;
    // align-items: center;
    // align-self: flex-end;
    // position: relative;
    // aspect-ratio: 1;
    // padding: 5px;
  }

  .square {
    aspect-ratio: 1 / 1;
    // height: 100%;
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
