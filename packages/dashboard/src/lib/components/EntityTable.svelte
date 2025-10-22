<script lang="ts">
  import { entities as allEntities } from "$lib/modules/state/stores"
  import { ENTITY_TYPE } from "contracts/enums"

  type EntityMap = {
    [key: string]: any
  }

  const {
    title,
    entities,
    keys,
    entityType
  }: {
    title: string
    entities: EntityMap
    keys: string[]
    entityType?: string
  } = $props()

  const entriesArray = $derived(Object.entries(entities))
  let isOpen = $state(true)

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
   * Format cell value - if it's an entity reference, show the name
   */
  function formatCellValue(key: string, value: any): string {
    if (value === null || value === undefined) return ""

    if (isEntityReferenceField(key)) {
      // Handle arrays (like pastRats, inventory)
      if (Array.isArray(value)) {
        return value.map(id => getEntityName(id)).join(", ")
      }
      // Handle single reference (like currentRat, owner)
      return getEntityName(value)
    }

    return String(value)
  }

  /**
   * Create a scroll link to another entity table
   */
  function scrollToEntity(entityId: string) {
    console.log("entity iid", entityId)
    const element1 = document.querySelector(`[data-entity-address="${entityId}"]`)
    console.log("element", element1)

    if (element1) {
      element1.classList.add("active")
      element1.scrollIntoView({ behavior: "smooth" })
    } else {
      const entity = $allEntities[entityId]
      if (!entity || !entity.entityType) return

      const entityType = ENTITY_TYPE[entity.entityType]
      const element2 = document.querySelector(`[data-entity-type="${entityType}"]`)
      console.log(element2, entityType)
      if (element2) {
        element2.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    }
  }
</script>

<details bind:open={isOpen} data-entity-type={entityType}>
  <summary class="table-title">
    <span>
      {title}
    </span>
    <span class="toggle">{isOpen ? "-" : "+"}</span>
  </summary>

  <div class="table-wrapper">
    <table>
      {#if entriesArray.length > 0}
        <thead>
          <tr>
            {#each keys as key}
              <th>{key}</th>
            {/each}
          </tr>
        </thead>
        <tbody>
          {#each entriesArray as [id, entity], index (id)}
            <tr class:even={index % 2 === 0} data-entity-address={id}>
              {#each keys as key}
                <td>
                  {#if isEntityReferenceField(key) && entity[key]}
                    {#if Array.isArray(entity[key])}
                      <div class="entity-links">
                        {#each entity[key] as entityId, idx}
                          <button class="entity-link" onclick={() => scrollToEntity(entityId)}>
                            {getEntityName(entityId)}
                          </button>
                          {#if idx < entity[key].length - 1},
                          {/if}
                        {/each}
                      </div>
                    {:else}
                      <button class="entity-link" onclick={() => scrollToEntity(entity[key])}>
                        {getEntityName(entity[key])}
                      </button>
                    {/if}
                  {:else}
                    {entity[key] ?? ""}
                  {/if}
                </td>
              {/each}
            </tr>
          {/each}
        </tbody>
      {:else}
        <tbody>
          <tr>
            <td colspan={keys.length} class="no-data">
              <span>NO DATA</span>
            </td>
          </tr>
        </tbody>
      {/if}
    </table>
  </div>
</details>

<style lang="scss">
  details > summary {
    list-style: none;
  }
  details > summary::-webkit-details-marker {
    display: none;
  }

  details {
    border-bottom: 1px solid white;
  }

  .table-title {
    display: flex;
    justify-content: space-between;
    padding: 40px 4px 4px 4px;
    font-weight: bold;
    border-top: 1px solid white;
    cursor: pointer;
    user-select: none;
  }

  .toggle {
    display: inline-block;
    width: 1.5rem;
    text-align: center;
  }

  .table-wrapper {
    width: 100%;
    max-width: 100vw;
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
    font-weight: bold;
    background-color: #f5f5f5;
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
</style>
