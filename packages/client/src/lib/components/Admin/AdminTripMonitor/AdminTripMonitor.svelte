<script lang="ts">
  import { playerTrips } from "$lib/modules/state/stores"
  import { ProfitLossHistoryGraph, ProfitLossOverview } from "$lib/components/Admin"

  let { focus, graphData = $bindable(), onCreateTripClick } = $props()

  let clientHeight = $state(0)
</script>

<div bind:clientHeight class="admin-trip-monitor">
  <div class="p-l-overview">
    <ProfitLossOverview {graphData} {onCreateTripClick} />
  </div>
  <div class="p-l-graph">
    <ProfitLossHistoryGraph bind:graphData trips={$playerTrips} height={clientHeight} {focus} />
  </div>
</div>

<style lang="scss">
  .admin-trip-monitor {
    width: 100%;
    height: 400px;
    display: flex;
    justify-content: flex-start;
    align-items: center;
    .p-l-overview {
      min-width: 500px;
      width: 500px;
      height: 400px;
    }

    .p-l-graph {
      height: 400px;
      width: 100%;
      background: #222;
      text-align: center;
      display: flex;
      justify-content: center;
      align-items: center;
    }
  }
</style>
