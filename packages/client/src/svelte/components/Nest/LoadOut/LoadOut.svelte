<script lang="ts">
  import {
    playerRat,
    playerRatLoadOut,
  } from "@svelte/modules/state/base/stores"

  import LoadOutItem from "@svelte/components/Nest/LoadOut/LoadOutItem.svelte"
</script>

{#if $playerRat && $playerRatLoadOut}
  <div class="load-out">
    <pre>Load out (click item to dequip)</pre>
    <div class="content">
      {#each $playerRatLoadOut as item, i}
        <LoadOutItem {item} key={$playerRat.loadOut[i]} />
      {/each}
    </div>
  </div>
{/if}

<style lang="scss">
  .content {
    margin-top: 10px;
  }
</style>
