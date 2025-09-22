<script lang="ts">
  import { RatBox } from "$lib/components/Rat"
  import { setActiveShader } from "$lib/modules/webgl-old/state.svelte"
  import { onMount } from "svelte"

  onMount(() => {
    setActiveShader("clouds")
  })
</script>

<div class="rat-container">
  <RatBox />
</div>

<style lang="scss">
  .rat-container {
    height: calc(var(--game-window-height) - 60px);
    width: 100%;
    display: flex;
  }
</style>
