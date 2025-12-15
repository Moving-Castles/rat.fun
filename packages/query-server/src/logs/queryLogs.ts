import { z } from "zod"
import { transformSchemaName } from "@latticexyz/store-sync/postgres"
import { resourceToHex } from "@latticexyz/common"
import mudConfig from "contracts/mud.config"
import { ENTITY_TYPE } from "contracts/enums"
import type { Record as LogRecord } from "./common"
import { query } from "../db.js"
import { getWorldAddress, hexToByteaParam } from "../utils.js"

const hydrationTables = [
  "Name",
  "Balance",
  "CurrentRat",
  "PastRats",
  "CreationBlock",
  "MasterKey",
  "Index",
  "Owner",
  "Dead",
  "Inventory",
  "TripCount",
  "Liquidated",
  "LiquidationValue",
  "LiquidationBlock",
  "Prompt",
  "VisitCount",
  "KillCount",
  "LastVisitBlock",
  "TripCreationCost",
  "EntityType",
  "Value"
] as const

function tableId(name: (typeof hydrationTables)[number]): Buffer {
  const hex = resourceToHex({ type: "table", namespace: mudConfig.namespace, name })
  return hexToByteaParam(hex)
}

const tableIds = Object.fromEntries(hydrationTables.map(name => [name, tableId(name)])) as Record<
  (typeof hydrationTables)[number],
  Buffer
>

const schemaName = transformSchemaName("mud")

const paramsSchema = z.object({
  playerId: z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Invalid bytes32 player id")
})

export async function queryLogs({ playerId }: { playerId: string }): Promise<LogRecord[]> {
  const parsed = paramsSchema.parse({ playerId })

  const worldAddress = getWorldAddress()
  const addressBytes = hexToByteaParam(worldAddress)
  const playerBytes = hexToByteaParam(parsed.playerId)

  const stateTableIds = [
    tableIds.EntityType,
    tableIds.Owner,
    tableIds.Balance,
    tableIds.CurrentRat
  ]

  const hydrationTableIds = hydrationTables.map(name => tableIds[name])

  const sql = `
    WITH config AS (
      SELECT
        version AS "indexerVersion",
        chain_id::text AS "chainId",
        block_number::text AS "chainBlockNumber"
      FROM ${schemaName}.config
      LIMIT 1
    ),
    entity_state AS (
      SELECT DISTINCT ON (table_id, key_bytes) key_bytes, table_id, static_data
      FROM ${schemaName}.records
      WHERE is_deleted != true
        AND address = $1::bytea
        AND table_id = ANY($2::bytea[])
      ORDER BY table_id, key_bytes, block_number DESC, log_index DESC
    ),
    entity_keys AS (
      SELECT key_bytes
      FROM entity_state
      WHERE table_id = $4 AND (
        (get_byte(static_data, 0) = ${ENTITY_TYPE.PLAYER} AND key_bytes = $6)
        OR get_byte(static_data, 0) IN (${ENTITY_TYPE.RAT}, ${ENTITY_TYPE.TRIP}, ${ENTITY_TYPE.ITEM})
      )
    ),
    owner_keys AS (
      SELECT DISTINCT key_bytes
      FROM entity_state
      WHERE table_id = $5
    ),
    all_relevant_keys AS (
      SELECT key_bytes FROM entity_keys
      UNION
      SELECT key_bytes FROM owner_keys
    )
    SELECT
      COUNT(*) OVER () AS "totalRows",
      config."indexerVersion",
      config."chainId",
      config."chainBlockNumber",
      '0x' || encode(r.address, 'hex') AS address,
      '0x' || encode(r.table_id, 'hex') AS "tableId",
      '0x' || encode(r.key_bytes, 'hex') AS "keyBytes",
      CASE WHEN r.static_data IS NULL THEN NULL ELSE '0x' || encode(r.static_data, 'hex') END AS "staticData",
      CASE WHEN r.encoded_lengths IS NULL THEN NULL ELSE '0x' || encode(r.encoded_lengths, 'hex') END AS "encodedLengths",
      CASE WHEN r.dynamic_data IS NULL THEN NULL ELSE '0x' || encode(r.dynamic_data, 'hex') END AS "dynamicData",
      r.block_number::text AS "recordBlockNumber",
      r.log_index AS "logIndex"
    FROM ${schemaName}.records r
    CROSS JOIN config
    WHERE r.is_deleted != true
      AND r.address = $1::bytea
      AND r.table_id = ANY($3::bytea[])
      AND r.key_bytes IN (SELECT key_bytes FROM all_relevant_keys)
    ORDER BY r.block_number, r.log_index
  `

  const result = await query<LogRecord>(sql, [
    addressBytes,
    stateTableIds,
    hydrationTableIds,
    tableIds.EntityType,
    tableIds.Owner,
    playerBytes
  ])
  return result.rows
}
