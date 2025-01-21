<script lang="ts">
  //   import { TraitChange } from "../types"

  export let trait: Trait
</script>

<div class="trait-item">{trait.name} (${trait.value})</div>

<style lang="scss">
  .trait-item {
    margin-right: 5px;
    margin-bottom: 5px;
    padding: 4px;
    border-radius: 5px;
    background: lightsalmon;
    font-size: 14px;
  }
</style>
