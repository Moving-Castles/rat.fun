<script lang="ts">
  import AdminTripTableRowActive from "./AdminTripTableRowActive.svelte"
  import AdminTripTableRowLiquidated from "./AdminTripTableRowLiquidated.svelte"

  let { trip, data, id } = $props()

  let liquidated = $derived(trip.liquidationBlock)
</script>

{#if liquidated}
  <AdminTripTableRowLiquidated {trip} {data} {id} />
{:else}
  <AdminTripTableRowActive {trip} {data} {id} />
{/if}
