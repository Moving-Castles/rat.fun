<script lang="ts">
  import { onMount } from "svelte"
  import Main from "@components/3D/World/Main.svelte"
  import Cage from "@components/3D/Cage/Cage.svelte"
</script>

<div class="rat-cam">
  <div class="rat-cam-header">RAT CAM</div>
  <div class="image-container" />
</div>

<style lang="scss">
  .rat-cam {
    border-bottom: 1px solid white;
    height: var(--rat-cam-height);
    padding: var(--default-padding);
    display: flex;
    justify-content: center;
    align-items: center;
    position: relative;
  }

  .image-container {
    height: 400px;
    aspect-ratio: 1/1;
    background: grey;
  }

  .rat-cam-header {
    position: absolute;
    top: var(--default-padding);
    left: var(--default-padding);
    width: 100%;
    height: 100%;
  }
</style>
