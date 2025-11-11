import fs from "node:fs/promises"
import { StandardMerkleTree } from "@openzeppelin/merkle-tree"
import { StandardMerkleTreeData } from "@openzeppelin/merkle-tree/dist/standard"
import { Hex } from "viem"
import { merkleTreeJsonOutputFile } from "./constants"

/**
 * Returns the claim value (1e18 decimals uint) and its proof (bytes32[] needed by the claim contract for verification)
 * Returns null if account has no claim
 */
export async function getProof(account: Hex) {
  return await getProofFromJson(
    account,
    JSON.parse(await fs.readFile(merkleTreeJsonOutputFile, "utf8"))
  )
}

export async function getProofFromJson(account: Hex, data: StandardMerkleTreeData<[Hex, string]>) {
  const tree = StandardMerkleTree.load<[Hex, string]>(data)

  for (const [i, v] of tree.entries()) {
    if (v[0] === account.toLowerCase()) {
      return {
        value: BigInt(v[1]),
        proof: tree.getProof(i)
      }
    }
  }
  return null
}
