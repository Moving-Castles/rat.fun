import { StandardMerkleTree } from "@openzeppelin/merkle-tree"
import { Hex } from "viem"
import merkleTree from "../static/tree.json" with { type: "json" }

export interface GetProofReturnType {
  value: bigint
  proof: string[]
}

/**
 * Returns the claim value (1e18 decimals uint) and its proof (bytes32[] needed by the claim contract for verification)
 * Returns null if account has no claim
 */
export async function getProof(account: Hex) {
  return await getProofFromJson(account, merkleTree)
}

export async function getProofFromJson(
  account: Hex,
  data: Record<string, unknown>
): Promise<GetProofReturnType | null> {
  const tree = StandardMerkleTree.load<[Hex, string]>(data as never)

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
