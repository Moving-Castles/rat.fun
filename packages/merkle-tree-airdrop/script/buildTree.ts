import fs from "node:fs/promises"
import { parse as parseCsvSync } from "csv-parse/sync"
import { StandardMerkleTree } from "@openzeppelin/merkle-tree"
import { formatUnits, Hex, parseUnits } from "viem"
import { csvInputFile, merkleTreeJsonOutputFile, metadataJsonOutputFile } from "../src/constants"

async function readAccountMultipliersFromCsv() {
  const file = await fs.readFile(csvInputFile, "utf-8")
  const parsed = parseCsvSync(file, {
    delimiter: ",",
    encoding: "utf-8"
  })
  const columns = parsed[0]
  const rows = parsed.slice(1)
  const accountIndex = columns.indexOf("account")
  if (accountIndex === -1) throw new Error("csv file missing account column")
  const multiplierIndex = columns.indexOf("multiplier")
  if (multiplierIndex === -1) throw new Error("csv file missing multiplier column")

  return rows.map(row => {
    const account = row[accountIndex].toLowerCase() as Hex
    const multiplier = Number(row[multiplierIndex])
    return [account, multiplier] as [Hex, number]
  })
}

const accountMultipliers = await readAccountMultipliersFromCsv()

const decimals = 18
const baseValue = 500
const accountValues = accountMultipliers.map(([account, multiplier]) => {
  const value = parseUnits(Math.round(baseValue * multiplier).toString(), decimals)
  return [account, value.toString()] as [Hex, string]
})

const tree = StandardMerkleTree.of(accountValues, ["address", "uint256"])

const totalValue = accountValues.reduce((acc, [, value]) => acc + BigInt(value), 0n)
const metadata = {
  root: tree.root,
  totalValue: totalValue.toString(),
  totalValueFormatted: Number(formatUnits(totalValue, decimals))
}

await fs.writeFile(merkleTreeJsonOutputFile, JSON.stringify(tree.dump(), null, 2) + "\n")
await fs.writeFile(metadataJsonOutputFile, JSON.stringify(metadata, null, 2) + "\n")
