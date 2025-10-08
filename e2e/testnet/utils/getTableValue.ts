import { Client, Hex } from "viem"
import { readContract } from "viem/actions"
import {
  decodeValueArgs,
  encodeKey,
  getKeySchema,
  getSchemaPrimitives,
  getSchemaTypes,
  getValueSchema
} from "@latticexyz/protocol-parser/internal"
import { Table } from "@latticexyz/config"
import { IWorldAbi } from "contracts/worldAbi"

/**
 * Read a table value without any mud sync requirements.
 * Queries the rpc directly each time.
 */
export async function getTableValue<table extends Table>({
  client,
  worldAddress,
  table,
  key
}: {
  readonly client: Client
  readonly worldAddress: Hex
  readonly table: table
  readonly key: getSchemaPrimitives<getKeySchema<table>>
}): Promise<getSchemaPrimitives<getValueSchema<table>>> {
  const [staticData, encodedLengths, dynamicData] = (await readContract(client, {
    address: worldAddress,
    abi: IWorldAbi,
    functionName: "getRecord",
    args: [table.tableId, encodeKey(getSchemaTypes(getKeySchema(table)) as never, key as never)]
  })) as [Hex, Hex, Hex]
  return decodeValueArgs(getSchemaTypes(getValueSchema(table)), {
    staticData,
    encodedLengths,
    dynamicData
  })
}
