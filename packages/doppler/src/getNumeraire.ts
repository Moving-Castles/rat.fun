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
    // return baseMainnetEURC
    // TODO this is a test numeraire token on mainnet, replace it with eurc for real auction
    return "0x119a88cAAD38D3B61BeCf997A87df7a398A9D20f";
  } else {
    throw new Error("Unsupported chainId for numeraire")
  }
}
