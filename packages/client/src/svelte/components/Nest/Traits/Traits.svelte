<script lang="ts">
  import { ratTraits } from "@modules/state/base/stores"
  import TraitItem from "./TraitItem.svelte"
</script>

<div class="traits">
  <div class="title">__ Traits</div>
  <div class="content">
    {#if !$ratTraits || $ratTraits.length === 0}
      <div>** BLANK **</div>
    {:else}
      {#each $ratTraits as trait}
        <TraitItem {trait} />
      {/each}
    {/if}
  </div>
</div>

<style lang="scss">
  .traits {
    background: var(--color-grey-light);
    padding: 5px;
    color: var(--black);
    margin-bottom: 10px;

    .content {
      margin-top: 5px;
    }
  }
</style>
