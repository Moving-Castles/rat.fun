<script lang="ts">
  import { clientList, roundTriptime } from "@modules/off-chain-sync/stores"
  import { ping } from "@modules/off-chain-sync"
  import { onMount } from "svelte"

  onMount(() => {
    setInterval(() => {
      ping()
    }, 1000)
  })
</script>

<div class="client-stats">
  <div>
    Online operators: {$clientList.length}
  </div>
  <div class="round-trip-time">
    Round trip: {$roundTriptime.toFixed(3)}ms
  </div>
</div>

<style lang="scss">
  .client-stats {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px;
    display: flex;
    width: 340px;

    .round-trip-time {
      margin-left: 10px;
      font-size: 12px;
      position: relative;
      top: 3px;
    }
  }
</style>
