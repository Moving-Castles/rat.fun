import { Address } from "viem"
import { SupportedChainId } from "@whetstone-research/doppler-sdk"
import { baseMainnetEURC, baseSepoliaNumeraireLow } from "./constants"

/**
 * Numeraire is the quote token address: EURC or its fake testchain alternative
 */
export function getNumeraire(chainId: SupportedChainId): Address {
  if (chainId === 84532) {
    // use low/high to get isToken0 to be false/true.
    // low is preferable for testing since mainnet eurc is low (see isToken0Expected)
    return baseSepoliaNumeraireLow
  } else if (chainId === 8453) {
    return baseMainnetEURC
  } else {
    throw new Error("Unsupported chainId for numeraire")
  }
}
