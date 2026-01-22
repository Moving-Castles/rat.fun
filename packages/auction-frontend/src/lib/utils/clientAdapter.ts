/**
 * Type adapter utilities for converting between different viem client types.
 *
 * This helps bridge the gap between MUD's extended clients and doppler's expected types
 * without using unsafe `as any` casts.
 */

import type { PublicClient, WalletClient, Transport, Chain, Account } from "viem"

/**
 * Adapts any viem-compatible public client to the standard PublicClient type.
 * This is safe because we only care about the read operations, not the extended methods.
 */
export function asPublicClient<T extends { readContract: any; chain: any }>(
  client: T
): PublicClient<Transport, Chain> {
  return client as unknown as PublicClient<Transport, Chain>
}

/**
 * Adapts a wallet transaction client to a standard WalletClient type.
 * This is safe because WalletTransactionClient extends the base client capabilities.
 */
export function asWalletClient<T extends { writeContract: any; account: Account }>(
  client: T
): WalletClient<Transport, Chain, Account> {
  return client as unknown as WalletClient<Transport, Chain, Account>
}
