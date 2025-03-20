<script lang="ts">
  import {
    rat,
    ratTraits,
    ratInventory,
  } from "@svelte/modules/state/base/stores"
</script>

<div class="rat-editor">
  <div class="inner">
    {$rat?.name ?? ""} is ...
    {#each $ratTraits ?? [] as trait}
      {trait.name}
    {/each}
    has...
    {#each $ratInventory ?? [] as item}
      {item.name}
    {/each}
  </div>
</div>

<style lang="scss">
  .rat-editor {
    border-bottom: 1px solid white;
    height: var(--rat-editor-height);
    padding: var(--default-padding);
  }
</style>
