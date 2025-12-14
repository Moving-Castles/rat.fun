import { FastifyPluginAsync } from "fastify"
import { query } from "../db.js"

interface TableInfo {
  table_name: string
  column_name: string
  data_type: string
}

interface SyncStatus {
  lastSyncedBlock: string | null
  worldSchema: string
  tables: string[]
  schemas: string[]
  allTables: Array<{ schema: string; table: string }>
}

// Schema is the world address in lowercase
function getWorldSchema(): string {
  const worldAddress = process.env.WORLD_ADDRESS
  if (!worldAddress) {
    throw new Error("WORLD_ADDRESS environment variable is required")
  }
  return worldAddress.toLowerCase()
}

const status: FastifyPluginAsync = async fastify => {
  // Get sync status and last block
  fastify.get("/api/status", async (_request, reply) => {
    try {
      const worldSchema = getWorldSchema()

      // Get ALL schemas in database
      const schemasResult = await query<{ schema_name: string }>(
        `SELECT schema_name FROM information_schema.schemata ORDER BY schema_name`
      )
      const schemas = schemasResult.rows.map(r => r.schema_name)

      // Get ALL tables from ALL schemas (excluding system schemas)
      const allTablesResult = await query<{ table_schema: string; table_name: string }>(
        `SELECT table_schema, table_name FROM information_schema.tables
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         ORDER BY table_schema, table_name`
      )
      const allTables = allTablesResult.rows.map(r => ({
        schema: r.table_schema,
        table: r.table_name
      }))

      // Get tables in world schema (the main MUD tables)
      const tablesResult = await query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
         WHERE table_schema = $1
         ORDER BY table_name`,
        [worldSchema]
      )
      const tables = tablesResult.rows.map(r => r.table_name)

      // Try to get last synced block
      let lastSyncedBlock: string | null = null

      // First try the mud.config table which stores sync state
      const possibleSyncTables = [
        { schema: "mud", table: "config" },
        { schema: "public", table: "mud__config" },
        { schema: worldSchema, table: "__config" }
      ]

      for (const { schema, table } of possibleSyncTables) {
        try {
          const blockResult = await query<Record<string, unknown>>(
            `SELECT * FROM "${schema}"."${table}" LIMIT 1`
          )
          if (blockResult.rows.length > 0) {
            lastSyncedBlock = JSON.stringify(blockResult.rows[0])
            break
          }
        } catch {
          // Table doesn't exist, try next
        }
      }

      // If no dedicated sync table, try to get max block from world schema tables
      // Column name is __last_updated_block_number (snake_case)
      if (!lastSyncedBlock && tables.length > 0) {
        for (const table of tables) {
          try {
            const blockResult = await query<{ max_block: string }>(
              `SELECT MAX("__last_updated_block_number") as max_block FROM "${worldSchema}"."${table}"`
            )
            if (blockResult.rows[0]?.max_block) {
              lastSyncedBlock = blockResult.rows[0].max_block
              break
            }
          } catch {
            // Column doesn't exist, try next table
          }
        }
      }

      const status: SyncStatus = {
        lastSyncedBlock,
        worldSchema,
        tables,
        schemas,
        allTables
      }

      return reply.send(status)
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to get status",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // Debug endpoint to inspect a specific table's schema and sample data
  // Supports schema.tableName format (e.g., /api/debug/table/public.ratfun__balance)
  // Defaults to world schema if no schema specified
  fastify.get<{ Params: { tableName: string } }>(
    "/api/debug/table/:tableName",
    async (request, reply) => {
      const { tableName } = request.params

      // Support schema.table format, default to world schema
      let schema = getWorldSchema()
      let table = tableName
      if (tableName.includes(".")) {
        const parts = tableName.split(".")
        schema = parts[0]
        table = parts[1]
      }

      try {
        // Get column info
        const columnsResult = await query<TableInfo>(
          `SELECT column_name, data_type
           FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2
           ORDER BY ordinal_position`,
          [schema, table]
        )

        // Get sample rows
        const sampleResult = await query(`SELECT * FROM "${schema}"."${table}" LIMIT 5`)

        return reply.send({
          schema,
          tableName: table,
          fullName: `${schema}.${table}`,
          columns: columnsResult.rows,
          sampleRows: sampleResult.rows,
          rowCount: sampleResult.rowCount
        })
      } catch (error) {
        return reply.status(500).send({
          error: "Failed to inspect table",
          message: error instanceof Error ? error.message : "Unknown error"
        })
      }
    }
  )

  // Auto-discover first MUD table and show its structure
  fastify.get("/api/debug/discover", async (_request, reply) => {
    try {
      // Find first table that looks like a MUD table (contains __ in name)
      const mudTableResult = await query<{ table_schema: string; table_name: string }>(
        `SELECT table_schema, table_name FROM information_schema.tables
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         AND table_name LIKE '%__%'
         ORDER BY table_schema, table_name
         LIMIT 1`
      )

      if (mudTableResult.rows.length === 0) {
        // No MUD tables found, get any first table
        const anyTableResult = await query<{ table_schema: string; table_name: string }>(
          `SELECT table_schema, table_name FROM information_schema.tables
           WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
           ORDER BY table_schema, table_name
           LIMIT 1`
        )

        if (anyTableResult.rows.length === 0) {
          return reply.send({
            message: "No tables found in database",
            schemas: [],
            tables: []
          })
        }

        const { table_schema: schema, table_name: table } = anyTableResult.rows[0]

        // Get column info
        const columnsResult = await query<TableInfo>(
          `SELECT column_name, data_type
           FROM information_schema.columns
           WHERE table_schema = $1 AND table_name = $2
           ORDER BY ordinal_position`,
          [schema, table]
        )

        const sampleResult = await query(`SELECT * FROM "${schema}"."${table}" LIMIT 3`)

        return reply.send({
          message: "No MUD tables (with __) found, showing first available table",
          schema,
          tableName: table,
          columns: columnsResult.rows,
          sampleRows: sampleResult.rows
        })
      }

      const { table_schema: schema, table_name: table } = mudTableResult.rows[0]

      // Get column info
      const columnsResult = await query<TableInfo>(
        `SELECT column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = $1 AND table_name = $2
         ORDER BY ordinal_position`,
        [schema, table]
      )

      // Get sample rows
      const sampleResult = await query(`SELECT * FROM "${schema}"."${table}" LIMIT 3`)

      // Also list all MUD-like tables
      const allMudTablesResult = await query<{ table_schema: string; table_name: string }>(
        `SELECT table_schema, table_name FROM information_schema.tables
         WHERE table_schema NOT IN ('pg_catalog', 'information_schema')
         AND table_name LIKE '%__%'
         ORDER BY table_schema, table_name`
      )

      return reply.send({
        message: "First MUD table found",
        schema,
        tableName: table,
        fullName: `${schema}.${table}`,
        columns: columnsResult.rows,
        sampleRows: sampleResult.rows,
        allMudTables: allMudTablesResult.rows.map(r => `${r.table_schema}.${r.table_name}`)
      })
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to discover tables",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })

  // List all tables with their schemas (from world schema)
  fastify.get("/api/debug/tables", async (_request, reply) => {
    try {
      const worldSchema = getWorldSchema()

      const result = await query<TableInfo>(
        `SELECT table_name, column_name, data_type
         FROM information_schema.columns
         WHERE table_schema = $1
         ORDER BY table_name, ordinal_position`,
        [worldSchema]
      )

      // Group by table
      const tables: Record<string, Array<{ column: string; type: string }>> = {}
      for (const row of result.rows) {
        if (!tables[row.table_name]) {
          tables[row.table_name] = []
        }
        tables[row.table_name].push({
          column: row.column_name,
          type: row.data_type
        })
      }

      return reply.send({ worldSchema, tables })
    } catch (error) {
      return reply.status(500).send({
        error: "Failed to list tables",
        message: error instanceof Error ? error.message : "Unknown error"
      })
    }
  })
}

export default status
