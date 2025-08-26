import { http } from "viem"
import { createPaymasterClient, PaymasterClient } from "viem/account-abstraction"

export const paymasters: Record<number, PaymasterClient | undefined> = {
  // Base Mainnet
  8453: createPaymasterClient({
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base/3ewNiMtI6Vj7q6XobGjyWILDJNKFHkh1"
    )
  }),
  // Base Sepolia
  84532: createPaymasterClient({
    transport: http(
      "https://api.developer.coinbase.com/rpc/v1/base-sepolia/3ewNiMtI6Vj7q6XobGjyWILDJNKFHkh1"
    )
  })
}
