import { query } from "./db.js"

export const NAMESPACE = "ratfun"

// Entity type enum values (from contracts/enums)
export const ENTITY_TYPE = {
  NONE: 0,
  PLAYER: 1,
  RAT: 2,
  TRIP: 3,
  ITEM: 4
} as const

// Schema is the world address in lowercase
export function getSchemaName(): string {
  const worldAddress = process.env.WORLD_ADDRESS
  if (!worldAddress) {
    throw new Error("WORLD_ADDRESS environment variable is required")
  }
  return worldAddress.toLowerCase()
}

// Convert table name to snake_case (e.g., "TripCount" -> "trip_count")
export function toSnakeCase(str: string): string {
  return str
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
}

// Convert hex string (0x...) to bytea parameter for PostgreSQL
export function hexToByteaParam(hex: string): Buffer {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex
  return Buffer.from(cleanHex, "hex")
}

// Convert bytea buffer to hex string (0x...)
export function byteaToHex(buffer: Buffer | null): string | null {
  if (!buffer) return null
  return "0x" + buffer.toString("hex")
}

// Format balance - return raw value as string (values are stored as full tokens, not wei)
export function formatBalance(value: string | bigint | null): string | null {
  if (value === null) return null
  return String(value)
}

// Get full table name with schema
export function getFullTableName(tableName: string): string {
  const snakeTableName = toSnakeCase(tableName)
  return `${NAMESPACE}__${snakeTableName}`
}

// Get quoted table name for SQL queries (e.g., "schema"."ratfun__name")
export function getQualifiedTableName(tableName: string): string {
  const schema = getSchemaName()
  const snakeTableName = toSnakeCase(tableName)
  return `"${schema}"."${NAMESPACE}__${snakeTableName}"`
}

// Query a single value from a MUD table
export async function getTableValue<T>(
  tableName: string,
  entityId: string,
  column: string = "value"
): Promise<T | null> {
  const schema = getSchemaName()
  const fullTableName = getFullTableName(tableName)
  const sql = `SELECT "${column}" FROM "${schema}"."${fullTableName}" WHERE "id" = $1 LIMIT 1`

  try {
    const result = await query<Record<string, T>>(sql, [hexToByteaParam(entityId)])
    if (result.rows.length === 0) return null
    return result.rows[0][column] ?? null
  } catch (error) {
    console.error(`Error querying ${schema}.${fullTableName}.${column}:`, error)
    return null
  }
}

// Query array value from a MUD table (for Inventory, PastRats, etc.)
// MUD stores bytes32[] as JSON TEXT using SuperJSON format
// Returns array of hex strings (0x...)
export async function getArrayValue(tableName: string, entityId: string): Promise<string[]> {
  const schema = getSchemaName()
  const fullTableName = getFullTableName(tableName)
  const sql = `SELECT "value" FROM "${schema}"."${fullTableName}" WHERE "id" = $1`

  try {
    const result = await query<{ value: string }>(sql, [hexToByteaParam(entityId)])
    if (result.rows.length === 0) return []
    const val = result.rows[0].value
    if (!val) return []

    // Parse SuperJSON format: {"json":[...],"meta":{}} or plain JSON array
    let parsed: unknown
    try {
      const jsonData = JSON.parse(val)
      // SuperJSON wraps data in {json: ..., meta: ...}
      parsed = jsonData.json !== undefined ? jsonData.json : jsonData
    } catch {
      console.error(`Failed to parse JSON from ${schema}.${fullTableName}:`, val)
      return []
    }

    if (!Array.isArray(parsed)) return []

    // Filter out empty/null/zero values
    return parsed.filter(
      (hex): hex is string => typeof hex === "string" && hex.length > 2 && !/^0x0*$/.test(hex)
    )
  } catch (error) {
    console.error(`Error querying ${schema}.${fullTableName}:`, error)
    return []
  }
}

// Get multiple table values for a single entity in parallel
export async function getEntityValues<T extends Record<string, unknown>>(
  entityId: string,
  tables: string[]
): Promise<Partial<T>> {
  const results = await Promise.all(tables.map(table => getTableValue<unknown>(table, entityId)))

  const values: Record<string, unknown> = {}
  tables.forEach((table, index) => {
    // Convert table name to camelCase for property names
    const key = table.charAt(0).toLowerCase() + table.slice(1)
    values[key] = results[index]
  })

  return values as Partial<T>
}

// Query a singleton table (tables with key: [])
// Returns the entire row as an object
// Optional tableNameOverride for truncated table names in the MUD indexer
export async function getSingletonTableRow<T extends Record<string, unknown>>(
  tableName: string,
  tableNameOverride?: string
): Promise<T | null> {
  const schema = getSchemaName()
  // Use override if provided, otherwise convert tableName to snake_case
  const snakeTableName = tableNameOverride ?? toSnakeCase(tableName)
  const fullTableName = `${NAMESPACE}__${snakeTableName}`
  const sql = `SELECT * FROM "${schema}"."${fullTableName}" LIMIT 1`

  console.log(`[getSingletonTableRow] Querying: ${sql}`)

  try {
    const result = await query<T>(sql, [])
    console.log(
      `[getSingletonTableRow] ${tableName}: ${result.rows.length} rows, columns:`,
      result.rows[0] ? Object.keys(result.rows[0]) : "none"
    )
    if (result.rows.length === 0) return null
    return result.rows[0]
  } catch (error) {
    console.error(`[getSingletonTableRow] Error querying ${schema}.${fullTableName}:`, error)
    return null
  }
}

// Validation helpers
export function isValidBytes32(id: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(id)
}

// Pagination helpers
export function parsePaginationParams(
  limit?: string | number,
  defaultLimit: number = 20,
  maxLimit: number = 100
): number {
  const parsed = typeof limit === "string" ? parseInt(limit, 10) : (limit ?? defaultLimit)
  if (isNaN(parsed) || parsed < 1) return defaultLimit
  return Math.min(parsed, maxLimit)
}

// Get the current synced block number from the indexer
// Queries the block_number from the MUD internal config table
export async function getLastSyncedBlockNumber(): Promise<string> {
  // MUD stores indexer state in mud.config table
  const sql = `SELECT "block_number" as block FROM "mud"."config" LIMIT 1`

  try {
    const result = await query<{ block: string | null }>(sql, [])
    return result.rows[0]?.block || "0"
  } catch (error) {
    console.error("Error fetching last synced block number:", error)
    return "0"
  }
}
