<script lang="ts">
  import { players, rats, trips, items } from "$lib/modules/state/stores"
  import EntityTable from "$lib/components/EntityTable.svelte"

  const playerKeys = [
    // "entityType",
    "name",
    "balance",
    "currentRat",
    "pastRats",
    "creationBlock"
    // "masterKey"
  ]
  const ratKeys = [
    // "entityType",
    "name",
    // "index",
    "balance",
    "owner",
    "dead",
    "inventory",
    "creationBlock",
    "liquidated",
    "liquidationValue",
    "liquidationBlock",
    "liquidationTaxPercentage"
  ]
  const tripKeys = [
    // "entityType",
    "owner",
    // "index",
    "balance",
    // "name",
    "prompt",
    "visitCount",
    "killCount",
    "creationBlock",
    "lastVisitBlock",
    "tripCreationCost",
    "liquidated",
    "liquidationValue",
    "liquidationBlock",
    "liquidationTaxPercentage"
  ]
  const itemKeys = [
    // "entityType",
    "name",
    "value"
  ]
</script>

<EntityTable
  title="{Object.values($players).length} players"
  entities={$players}
  keys={playerKeys}
  entityType="PLAYER"
/>
<EntityTable
  title="{Object.values($rats).length} rats"
  entities={$rats}
  keys={ratKeys}
  entityType="RAT"
/>
<EntityTable
  title="{Object.values($trips).length} trips"
  entities={$trips}
  keys={tripKeys}
  entityType="TRIP"
/>
<EntityTable
  title="{Object.values($items).length} items"
  entities={$items}
  keys={itemKeys}
  entityType="ITEM"
/>
