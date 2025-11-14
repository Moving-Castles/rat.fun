<script lang="ts">
  import type { ColumnConfig } from "$lib/components/types"
  import {
    playersWithERC20Balances,
    rats,
    trips,
    items,
    fetchPlayerERC20Balances
  } from "$lib/modules/state/stores"
  import EntityTable from "$lib/components/EntityTable.svelte"
  import { onMount } from "svelte"

  // Amounts distributed from

  const playerColumns: ColumnConfig[] = [
    { key: "creationBlock", displayName: "Create @" },
    { key: "name", displayName: "Name" },
    { key: "erc20Balance", displayName: "ERC20 Balance" },
    { key: "balance", displayName: "On-chain Balance" },
    { key: "currentRat", displayName: "Current Rat" },
    { key: "pastRatsCount", displayName: "Past Rats" },
    { key: "masterKey", displayName: "Cashboard unlocked" }
  ]

  const ratColumns: ColumnConfig[] = [
    { key: "creationBlock", displayName: "Create @" },
    { key: "name", displayName: "Name", priority: true },
    { key: "balance", displayName: "Balance" },
    { key: "owner", displayName: "Owner" },
    { key: "tripCount", displayName: "Trips" },
    { key: "alive", displayName: "Alive" },
    { key: "inventory", displayName: "Inventory", priority: true },
    { key: "causeOfDeath", displayName: "CoD" },
    { key: "liquidationBlock", displayName: "Liq. @" },
    { key: "liquidationValue", displayName: "Liq. Val." }
    // { key: "liquidationTaxPercentage", displayName: "Tax %" }
  ]

  const tripColumns: ColumnConfig[] = [
    { key: "creationBlock", displayName: "Create @" },
    { key: "owner", displayName: "Owner" },
    { key: "balance", displayName: "Balance" },
    { key: "prompt", displayName: "Prompt", priority: true },
    { key: "visitCount", displayName: "Visits" },
    { key: "killCount", displayName: "Kills" },
    { key: "lastVisitBlock", displayName: "Last Visit" },
    { key: "tripCreationCost", displayName: "Cost" },
    { key: "causeOfDeath", displayName: "CoD" },
    { key: "liquidationBlock", displayName: "Liq. @" },
    { key: "liquidationValue", displayName: "Liq. Val." }
    // { key: "liquidationTaxPercentage", displayName: "Tax %" }
  ]

  const itemColumns: ColumnConfig[] = [
    { key: "name", displayName: "Name", priority: true },
    { key: "value", displayName: "Value", priority: true }
  ]

  const dedupedItemColumns: ColumnConfig[] = [
    { key: "name", displayName: "Name" },
    { key: "count", displayName: "Count" },
    { key: "valueRange", displayName: "Value range" }
  ]

  let processedPlayers = $derived.by(() => {
    const tempPlayers = $playersWithERC20Balances

    // Add pastRatsCount property to each player
    Object.values(tempPlayers).forEach(player => {
      player.pastRatsCount = player.pastRats?.length || 0
    })

    return tempPlayers
  })

  // Fetch ERC20 balances on mount and periodically
  onMount(() => {
    // Initial fetch
    fetchPlayerERC20Balances()

    // Refresh every 5 seconds
    const interval = setInterval(() => {
      fetchPlayerERC20Balances()
    }, 5000)

    return () => clearInterval(interval)
  })

  let processedRats = $derived.by(() => {
    const tempRats = $rats

    // Add new properties to each rat
    Object.values(tempRats).forEach(rat => {
      // alive: !dead
      rat.alive = !rat.dead

      // causeOfDeath logic
      if (rat.alive) {
        rat.causeOfDeath = "alive"
      } else if (rat.liquidated) {
        rat.causeOfDeath = "liq."
      } else {
        rat.causeOfDeath = "trip"
      }
    })

    return tempRats
  })

  let processedTrips = $derived.by(() => {
    const tempTrips = $trips

    // Add causeOfDeath property to each trip
    Object.values(tempTrips).forEach(trip => {
      // causeOfDeath logic
      if (trip.balance > 0) {
        trip.causeOfDeath = "active"
      } else if (Number(trip.balance) === 0 && !trip.liquidated) {
        trip.causeOfDeath = "depl."
      } else if (trip.liquidated) {
        trip.causeOfDeath = "liq."
      }
    })

    return tempTrips
  })

  let processedItems = $derived.by(() => {
    return $items
  })

  let dedupedItems = $derived.by(() => {
    const tempItems = Object.values($items)
    const groupedItems = new Map<string, { name: string; count: number; values: number[] }>()

    // Group items by name
    tempItems.forEach(item => {
      const name = item.name || "Unknown"
      if (!groupedItems.has(name)) {
        groupedItems.set(name, {
          name,
          count: 0,
          values: []
        })
      }

      const group = groupedItems.get(name)!
      group.count++
      if (item.value !== undefined) {
        group.values.push(Number(item.value))
      }
    })

    // Convert to deduped items with calculated properties
    const deduped = Array.from(groupedItems.values()).map((group, index) => {
      const minValue = group.values.length > 0 ? Math.min(...group.values) : 0
      const maxValue = group.values.length > 0 ? Math.max(...group.values) : 0

      return {
        id: `deduped-${index}`,
        name: group.name,
        count: group.count,
        valueRange: minValue === maxValue ? `${minValue}` : `${minValue}-${maxValue}`
      }
    })

    // Convert array back to object format for EntityTable
    const dedupedItemsObj: Record<string, any> = {}
    deduped.forEach((item, index) => {
      dedupedItemsObj[`deduped-${index}`] = item
    })

    return dedupedItemsObj
  })

  // Show aggregated values distributed to rats and to trips (by outcomes)
</script>

<!-- PLAYERS -->
<div class="section">
  <div class="section-header">
    <h2>PLAYERS ({Object.values(processedPlayers).length})</h2>
  </div>
  <EntityTable
    entities={processedPlayers}
    columns={playerColumns}
    entityType="PLAYER"
    defaultSortKey="creationBlock"
  />
</div>

<!-- RATS -->
<div class="section">
  <div class="section-header">
    <h2>RATS ({Object.values(processedRats).length})</h2>
  </div>
  <EntityTable
    entities={processedRats}
    columns={ratColumns}
    entityType="RAT"
    defaultSortKey="creationBlock"
  />
</div>

<!-- TRIPS -->
<div class="section">
  <div class="section-header">
    <h2>TRIPS ({Object.values(processedTrips).length})</h2>
  </div>
  <EntityTable
    entities={processedTrips}
    columns={tripColumns}
    entityType="TRIP"
    defaultSortKey="creationBlock"
  />
</div>

<!-- DEDUPED ITEMS -->
<div class="section">
  <div class="section-header">
    <h2>DEDUPED ITEMS ({Object.values(dedupedItems).length})</h2>
  </div>
  <EntityTable
    entities={dedupedItems}
    columns={dedupedItemColumns}
    entityType="ITEM"
    defaultSortKey="count"
  />
</div>

<!-- ALLITEMS -->
<div class="section">
  <div class="section-header">
    <h2>ALL ITEMS ({Object.values(processedItems).length})</h2>
  </div>
  <EntityTable entities={processedItems} columns={itemColumns} entityType="ITEM" />
</div>

<style lang="scss">
  .section {
    margin-bottom: 2rem;

    .section-header {
      margin-bottom: 1rem;
      background: lightgray;
      padding: 10px;

      h2 {
        margin: 0;
      }
    }
  }
</style>
