import { query } from "./db.js"
import { formatEther, Hex } from "viem"

export const NAMESPACE = "ratfun"

export function getWorldAddress(): Hex {
  const worldAddress = process.env.WORLD_ADDRESS
  if (!worldAddress) {
    throw new Error("WORLD_ADDRESS environment variable is required")
  }
  return worldAddress.toLowerCase() as Hex
}

// Schema is the world address in lowercase
export function getSchemaName(): string {
  return getWorldAddress()
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

// Format balance from wei to ETH string
export function formatBalance(value: string | bigint | null): string | null {
  if (value === null) return null
  try {
    return formatEther(BigInt(value))
  } catch {
    return null
  }
}

// Get full table name with schema
export function getFullTableName(tableName: string): string {
  const snakeTableName = toSnakeCase(tableName)
  return `${NAMESPACE}__${snakeTableName}`
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
export async function getArrayValue(tableName: string, entityId: string): Promise<Buffer[]> {
  const schema = getSchemaName()
  const fullTableName = getFullTableName(tableName)
  const sql = `SELECT "value" FROM "${schema}"."${fullTableName}" WHERE "id" = $1`

  try {
    const result = await query<{ value: Buffer[] | Buffer | string[] | string }>(sql, [
      hexToByteaParam(entityId)
    ])
    if (result.rows.length === 0) return []
    const val = result.rows[0].value
    if (Array.isArray(val)) {
      // Convert string hex values to buffers if needed, or return as-is if already buffers
      return val.map(v => (Buffer.isBuffer(v) ? v : hexToByteaParam(v as string)))
    }
    return [Buffer.isBuffer(val) ? val : hexToByteaParam(val as string)]
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
