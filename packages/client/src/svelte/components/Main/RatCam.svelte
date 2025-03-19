<script lang="ts">
  import { onMount } from "svelte"

  onMount(() => {
    console.log("RatCam mounted")
  })
</script>

<div class="rat-cam">RAT CAM</div>

<style lang="scss">
  .rat-cam {
    border-bottom: 1px solid white;
    height: 320px;
    padding: 20px;
  }
</style>
