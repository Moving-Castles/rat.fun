import { Address, LocalAccount } from "viem"
import { SmartAccount } from "viem/account-abstraction"
import { toSimpleSmartAccount } from "permissionless/accounts"
import { getSessionSigner } from "./signer"
import { PublicClient } from "../../types"
import { logger } from "../../logger"

export type GetSessionAccountReturnType = {
  readonly account: SmartAccount
  readonly signer: LocalAccount
}

/**
 * Create an ERC-4337 session smart account.
 *
 * @param publicClient - Public client for chain reads (used by toSimpleSmartAccount)
 * @param userAddress - The user's wallet address (used to derive session signer)
 */
export async function getSessionAccount({
  publicClient,
  userAddress
}: {
  publicClient: PublicClient
  userAddress: Address
}): Promise<GetSessionAccountReturnType> {
  const signer = getSessionSigner(userAddress)

  logger.log("[getSessionAccount] Creating session account:", {
    userAddress,
    signerAddress: signer.address,
    chainId: publicClient.chain?.id,
    chainName: publicClient.chain?.name
  })

  try {
    const account = await toSimpleSmartAccount({
      client: publicClient,
      owner: signer
    })

    logger.log("[getSessionAccount] Session account created:", account.address)
    return { account, signer }
  } catch (error) {
    logger.error("[getSessionAccount] Failed to create session account:", {
      error: error instanceof Error ? error.message : String(error),
      userAddress,
      signerAddress: signer.address,
      chainId: publicClient.chain?.id
    })
    throw error
  }
}
