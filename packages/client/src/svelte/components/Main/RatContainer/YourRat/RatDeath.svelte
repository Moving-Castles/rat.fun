<script lang="ts">
  import { onMount, onDestroy } from "svelte"
  import { Tween } from "svelte/motion"
  import Main from "@components/3D/World/Main.svelte"
  import Death from "@components/3D/Death/Death.svelte"

  let interval: ReturnType<typeof setInterval>
  let progress = new Tween(0, { duration: 2000 })

  const moving = new Tween(0, { duration: 50 })

  const twitch = async () => {
    await new Promise(r => setTimeout(r, Math.random() * 200))
    await moving.set(4)
    moving.set(0)
  }

  onMount(() => {
    progress.set(1)
    interval = setInterval(twitch, 2000 + Math.random() * 4000)
  })

  onDestroy(() => {
    clearInterval(interval)
    progress.set(0)
  })
</script>

<div class="rat-cam">
  <div class="square">
    <Main>
      <Death {moving}></Death>
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
