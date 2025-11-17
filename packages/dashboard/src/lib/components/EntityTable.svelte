<script lang="ts">
  import type { EntityMap, ColumnConfig } from "./types"
  import { entities as allEntities } from "$lib/modules/state/stores"
  import { ENTITY_TYPE } from "contracts/enums"
  import Tooltip from "./Shared/Tooltip/Tooltip.svelte"

  const {
    entities,
    columns,
    entityType,
    defaultSortKey,
    defaultSortDirection = "desc"
  }: {
    entities: EntityMap
    columns: ColumnConfig[]
    entityType?: string
    defaultSortKey?: string
    defaultSortDirection?: "asc" | "desc"
  } = $props()

  // Sorting state
  let sortColumn = $state<string | null>(defaultSortKey ?? null)
  let sortDirection = $state<"asc" | "desc">(defaultSortDirection)

  const entriesArray = $derived(Object.entries(entities))

  // Sort the entries based on current sort settings
  const sortedEntries = $derived(() => {
    if (!sortColumn) return entriesArray

    return [...entriesArray].sort(([, a], [, b]) => {
      const aValue = a[sortColumn!]
      const bValue = b[sortColumn!]

      // Handle null/undefined values
      if (aValue == null && bValue == null) return 0
      if (aValue == null) return sortDirection === "asc" ? -1 : 1
      if (bValue == null) return sortDirection === "asc" ? 1 : -1

      // Handle different data types
      let comparison = 0

      if (typeof aValue === "number" && typeof bValue === "number") {
        comparison = aValue - bValue
      } else if (typeof aValue === "string" && typeof bValue === "string") {
        // Check if both strings are numeric
        const aNum = parseFloat(aValue)
        const bNum = parseFloat(bValue)
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum
        } else {
          comparison = aValue.localeCompare(bValue)
        }
      } else if (typeof aValue === "boolean" && typeof bValue === "boolean") {
        comparison = aValue === bValue ? 0 : aValue ? 1 : -1
      } else {
        // Try to convert both to numbers first
        const aNum = parseFloat(String(aValue))
        const bNum = parseFloat(String(bValue))
        if (!isNaN(aNum) && !isNaN(bNum)) {
          comparison = aNum - bNum
        } else {
          // Convert to string for comparison
          comparison = String(aValue).localeCompare(String(bValue))
        }
      }

      return sortDirection === "asc" ? comparison : -comparison
    })
  })

  // Fields that reference other entities by ID
  const ENTITY_REFERENCE_FIELDS = ["currentRat", "owner", "pastRats", "inventory"]

  /**
   * Check if a field contains entity references
   */
  function isEntityReferenceField(key: string): boolean {
    return ENTITY_REFERENCE_FIELDS.includes(key)
  }

  /**
   * Get entity name by ID
   */
  function getEntityName(entityId: string): string {
    const entity = $allEntities[entityId]
    return entity?.name || entityId.slice(0, 8) + "..."
  }

  /**
   * Get display name for a column
   */
  function getDisplayName(column: ColumnConfig): string {
    return column.displayName
  }

  /**
   * Check if a column has priority
   */
  function isPriorityColumn(column: ColumnConfig): boolean {
    return column.priority === true
  }

  /**
   * Handle column header click for sorting
   */
  function handleSort(columnKey: string) {
    if (sortColumn === columnKey) {
      // Toggle direction if same column
      sortDirection = sortDirection === "asc" ? "desc" : "asc"
    } else {
      // New column, start with ascending
      sortColumn = columnKey
      sortDirection = "asc"
    }
  }

  /**
   * Get sort indicator for a column
   */
  function getSortIndicator(columnKey: string): string {
    if (sortColumn !== columnKey) return ""
    return sortDirection === "asc" ? "▲" : "▼"
  }

  /**
   * Create a scroll link to another entity table
   */
  function scrollToEntity(entityId: string) {
    console.log("entity iid", entityId)

    // Remove any existing active classes first
    document.querySelectorAll("tr.active").forEach(el => {
      el.classList.remove("active")
    })

    const element1 = document.querySelector(`[data-entity-address="${entityId}"]`)

    if (element1) {
      element1.classList.add("active")
      element1.scrollIntoView({ behavior: "smooth" })

      // Remove active class after animation completes
      setTimeout(() => {
        element1.classList.remove("active")
      }, 3000)
    } else {
      const entity = $allEntities[entityId]
      if (!entity || !entity.entityType) return

      const entityType = ENTITY_TYPE[entity.entityType]
      const element2 = document.querySelector(`[data-entity-type="${entityType}"]`)
      if (element2) {
        element2.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }
</script>

<div data-entity-type={entityType}>
  <div class="table-wrapper">
    <table>
      {#if entriesArray.length > 0}
        <thead>
          <tr>
            {#each columns as column}
              <th
                class:priority={isPriorityColumn(column)}
                class:sortable={true}
                class:active={sortColumn === column.key}
                onclick={() => handleSort(column.key)}
                role="button"
                tabindex="0"
                onkeydown={e => e.key === "Enter" && handleSort(column.key)}
              >
                {getDisplayName(column)}
                <span class="sort-indicator">{getSortIndicator(column.key)}</span>
              </th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each sortedEntries() as [id, entity], index (id)}
            <tr class:even={index % 2 === 0} data-entity-address={id}>
              {#each columns as column}
                <td class:priority={isPriorityColumn(column)}>
                  {#if isEntityReferenceField(column.key) && entity[column.key]}
                    {#if Array.isArray(entity[column.key])}
                      <div class="entity-links">
                        {#each entity[column.key] as entityId, idx}
                          <button class="entity-link" onclick={() => scrollToEntity(entityId)}>
                            {getEntityName(entityId)}
                          </button>
                          {#if idx < entity[column.key].length - 1}&nbsp; / &nbsp;{/if}
                        {/each}
                      </div>
                    {:else}
                      <button
                        class="entity-link"
                        onclick={() => scrollToEntity(entity[column.key])}
                      >
                        {getEntityName(entity[column.key])}
                      </button>
                    {/if}
                  {:else if column.key === "prompt"}
                    <!-- Show tooltip on prompt -->
                    <Tooltip content={entity[column.key] ?? ""}>
                      {entity[column.key] ?? ""}
                    </Tooltip>
                  {:else}
                    {entity[column.key] ?? ""}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      {:else}
        <tbody>
          <tr>
            <td colspan={columns.length} class="no-data">
              <span>NO DATA</span>
            </td>
          </tr>
        </tbody>
      {/if}
    </table>
  </div>
</div>

<style lang="scss">
  .table-wrapper {
    width: 100%;
    max-width: 100dvw;
    overflow-x: auto;
    margin-bottom: 2rem;
  }

  table {
    width: 100%;
    max-width: 100%;
    border-collapse: collapse;
    border-spacing: 0;
    table-layout: fixed;
  }

  th,
  td {
    padding: 0.25rem;
    text-align: left;
    border: 1px solid #ccc;
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    white-space: nowrap;
    max-width: 0;
  }

  th {
    font-size: 14px;
  }

  /* Priority columns get more space */
  th.priority,
  td.priority {
    min-width: 200px;
    max-width: 300px;
    width: 25%;
  }

  th {
    font-weight: bold;
    background-color: #f5f5f5;
  }

  /* Sortable header styles */
  th.sortable {
    cursor: pointer;
    user-select: none;
    position: relative;
  }

  th.sortable:hover {
    background-color: #e8e8e8;
  }

  th.sortable.active {
    background-color: darkgrey;
  }

  .sort-indicator {
    margin-left: 0.5rem;
    font-weight: bold;
    display: inline-block;
    width: 1em;
    height: 1em;
    text-align: center;
    line-height: 1em;
    visibility: hidden;
    font-size: 8px;
    position: relative;
    top: -1px;
  }

  th.sortable.active .sort-indicator {
    visibility: visible;
    color: black;
  }

  tr.even {
    background-color: white;
  }

  tr:not(.even) {
    background-color: #f9f9f9;
  }

  .no-data {
    text-align: center;
    padding: 2rem;
  }

  .entity-link {
    background: none;
    border: none;
    text-decoration: underline;
    cursor: pointer;
    padding: 0;
    font: inherit;
  }

  .entity-links {
    display: inline;
  }

  /* Highlight active/selected entity row */
  :global(tr.active) {
    background-color: #e3f2fd !important;
  }
</style>
