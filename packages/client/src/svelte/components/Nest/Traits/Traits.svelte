<script lang="ts">
  import { playerRatTraits } from "@modules/state/base/stores"
  import TraitItem from "./TraitItem.svelte"
</script>

<div class="traits">
  <strong>Traits:</strong>
  {#if $playerRatTraits}
    {#each $playerRatTraits as trait}
      <TraitItem {trait} />
    {/each}
  {/if}
</div>
