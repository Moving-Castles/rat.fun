/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 *
 */

import { getChain } from "./utils"
import { ENVIRONMENT } from "./enums"
import { ChainNotFoundError } from "../error-handling/errors"

export function getBasicNetworkConfig(environment: ENVIRONMENT, url: URL) {
  // Use provided URL or fallback to empty search params for SSR
  const searchParams = url?.searchParams

  // Default to local development chain
  let chainId = 31337

  switch (environment) {
    case ENVIRONMENT.BASE_SEPOLIA:
      chainId = 84532
      break
    case ENVIRONMENT.BASE:
      chainId = 8453
      break
    default:
      chainId = 31337
      break
  }

  const chain = getChain(chainId)

  if (!chain) {
    throw new ChainNotFoundError(chainId.toString())
  }

  return {
    provider: {
      chainId,
      jsonRpcUrl: searchParams?.get("rpc") ?? chain.rpcUrls.default.http[0],
    },
    chainId,
    chain
  }
}
