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
      if (!entity) return

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
    <div class="table" style:grid-template-columns="repeat({keys.length}, auto)">
      {#if entriesArray.length > 0}
        {#each entriesArray as [id, entity], index (id)}
          <!-- <div class="full-row">
            {id}
          </div> -->
          {#if index === 0}
            {#each keys as key}
              <div class="cell header">
                {key}
              </div>
            {/each}
          {/if}
          {#each keys as key}
            <div class="cell" data-entity-address={id}>
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
            </div>
          {/each}
        {/each}
      {:else}
        <div class="no-data">
          <span>NO DATA</span>
        </div>
      {/if}
    </div>
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

  .full-row {
    grid-column: 1 / -1;
  }

  .active {
    background: red;
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
    max-width: 100vw;
    overflow-x: auto;
    margin-bottom: 2rem;
  }

  .table {
    display: grid;
    gap: 1rem;
    width: fit-content;
  }

  .cell {
    overflow: hidden;
    text-overflow: ellipsis;
    word-break: break-word;
    padding: 0.25rem;
    min-width: 0;
    white-space: nowrap;
  }

  .cell.header {
    font-weight: bold;
  }

  .no-data {
    grid-column: 1 / -1;
    display: flex;
    justify-content: center;
    align-items: center;
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
