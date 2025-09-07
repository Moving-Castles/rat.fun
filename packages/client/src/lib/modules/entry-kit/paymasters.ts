import { http } from "viem"
import { createPaymasterClient, PaymasterClient } from "viem/account-abstraction"
import { PUBLIC_BASE_SEPOLIA_PAYMASTER_URL, PUBLIC_BASE_PAYMASTER_URL } from "$env/static/public"

export const paymasters: Record<number, PaymasterClient | undefined> = {
  // Base Mainnet
  8453: createPaymasterClient({
    transport: http(PUBLIC_BASE_PAYMASTER_URL)
  }),
  // Base Sepolia
  84532: createPaymasterClient({
    transport: http(PUBLIC_BASE_SEPOLIA_PAYMASTER_URL)
  })
}
