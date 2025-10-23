<script lang="ts">
  import { player, playerAddress } from "$lib/modules/state/stores"
  import { addressToRatParts } from "$lib/modules/utils"

  let numbers = $derived(addressToRatParts($playerAddress, $player?.currentRat))
</script>

<div class="rat-container">
  {numbers}
</div>

<style lang="scss">
  .rat-container {
    width: 400px;
    height: 400px;
    display: block;
    background: red;
  }
</style>
