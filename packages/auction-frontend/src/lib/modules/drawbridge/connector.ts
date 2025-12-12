import { watchAsset } from "viem/actions"
import { getDrawbridge } from "$lib/modules/drawbridge"

/**
 * Prompts the user's wallet to add the RAT token to their token list (EIP-747)
 */
export async function addRatTokenToWallet(
  tokenAddress: `0x${string}`,
  tokenSymbol: string,
  tokenDecimals: number
): Promise<boolean> {
  const connectorClient = await getDrawbridge().getConnectorClient()

  return watchAsset(connectorClient, {
    type: "ERC20",
    options: {
      address: tokenAddress,
      symbol: tokenSymbol,
      decimals: tokenDecimals
    }
  })
}
