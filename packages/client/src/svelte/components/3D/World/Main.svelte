<script lang="ts">
  import { Canvas } from "@threlte/core"
  import Stats from "@components/3D/World/Stats/Stats.svelte"
  // import { World } from "@threlte/rapier"
  // import { Debug } from "@threlte/rapier"
  // import Loader from "@components/World/Loader/Loader.svelte"

  let debugPhysics = false
  // import Stats from "@components/World/Stats/Stats.svelte"
</script>

<!-- Main 3D Context -->
<Canvas>
  <!-- Forward the ready event -->
  <!-- <Loader on:ready /> -->

  <!-- <Stats /> -->

  <!-- Physics wrapper -->
  <!-- <World> -->
  {#if debugPhysics}
    <Debug />
  {/if}

  <!-- Scenes in here -->
  <slot />
  <!-- </World> -->
</Canvas>
