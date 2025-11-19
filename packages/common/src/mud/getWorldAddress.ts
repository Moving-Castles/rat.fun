import { getWorldFromChainId } from "./utils"
import { ENVIRONMENT } from "../basic-network/enums"
import { getChain } from "../basic-network/utils"
import { WorldAddressNotFoundError, ChainNotFoundError } from "../error-handling/errors"

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
