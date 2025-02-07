<script lang="ts">
  import { clientList } from "@modules/off-chain-sync/stores"
</script>

<span class="client-stats">Online operators: {$clientList.length}</span>

<style lang="scss">
  .client-stats {
    position: fixed;
    top: 0;
    left: 0;
    background: blue;
    padding: 10px;
  }
</style>
