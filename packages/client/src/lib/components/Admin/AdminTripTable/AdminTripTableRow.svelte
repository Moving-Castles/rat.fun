<script lang="ts">
  import AdminTripTableRowActive from "./AdminTripTableRowActive.svelte"
  import AdminTripTableRowLiquidated from "./AdminTripTableRowLiquidated.svelte"

  let { trip, data, id, onpointerenter, onpointerleave } = $props()

  let liquidated = $derived(trip.liquidationBlock)
</script>

{#if liquidated}
  <AdminTripTableRowLiquidated {trip} {data} {id} {onpointerenter} {onpointerleave} />
{:else}
  <AdminTripTableRowActive {trip} {data} {id} {onpointerenter} {onpointerleave} />
{/if}
