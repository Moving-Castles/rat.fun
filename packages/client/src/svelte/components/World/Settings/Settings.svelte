<script lang="ts">
  import { debugPhysics } from "@svelte/modules/three/stores"
</script>

<div class="tweak">
  <label>Debug Physics</label>
  <input type="checkbox" bind:value={$debugPhysics} />
</div>

<style>
  .tweak {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 99;
  }
</style>
