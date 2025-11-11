import { getChain, getWorldFromChainId } from "./utils"
import { ENVIRONMENT } from "./enums"
import { WorldAddressNotFoundError, ChainNotFoundError } from "$lib/modules/error-handling/errors"

export function getWorldAddress(environment: ENVIRONMENT) {
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

  const world = getWorldFromChainId(chain.id)

  if (!world?.address) {
    throw new WorldAddressNotFoundError(chainId.toString())
  }

  return world.address
}
