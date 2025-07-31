import { http } from "viem"
import { createPaymasterClient, PaymasterClient } from "viem/account-abstraction"

export const paymasters: Record<number, PaymasterClient | undefined> = {
  // Base Mainnet
  8453: createPaymasterClient({
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base/W8ndwUET2baGUDK2aHIEPg7s7iP0xOzU"
    )
  }),
  // Base Sepolia
  84532: createPaymasterClient({
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base-sepolia/W8ndwUET2baGUDK2aHIEPg7s7iP0xOzU"
    )
  })
}
