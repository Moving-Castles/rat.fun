<script lang="ts">
  import { debugPhysics } from "@modules/three/stores"
</script>

<div class="tweak">
  <label for="debug-physics">Debug Physics</label>
  <input id="debug-physics" type="checkbox" bind:value={$debugPhysics} />
</div>

<style lang="scss">
  .tweak {
    position: fixed;
    bottom: 0;
    left: 0;
    z-index: 99;
  }
</style>
