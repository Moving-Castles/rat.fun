import { privateKeyToAccount } from "viem/accounts"
import type { Hex, Address } from "viem"
import { getSessionKey, getLinkedUser } from "../storage/sessions.js"

export interface SignedRequestInfo {
  timestamp: number
  nonce: number
  calledFrom: Address | null
}

export interface SignedRequest<T> {
  data: T
  info: SignedRequestInfo
  signature: Hex
}

/**
 * Stringify request data for signing - must match server's format exactly
 */
function stringifyRequestForSignature<T>({
  data,
  info
}: {
  data: T
  info: SignedRequestInfo
}): string {
  return JSON.stringify({ data, info })
}

/**
 * Sign a request using the stored session key for a Telegram user
 */
export async function signRequest<T>(
  telegramUserId: number,
  data: T
): Promise<SignedRequest<T>> {
  const sessionKey = getSessionKey(telegramUserId)
  if (!sessionKey) {
    throw new Error("User not linked - no session key found")
  }

  const user = getLinkedUser(telegramUserId)
  if (!user) {
    throw new Error("User not found")
  }

  const info: SignedRequestInfo = {
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 1e12),
    calledFrom: user.walletAddress
  }

  const account = privateKeyToAccount(sessionKey)
  const message = stringifyRequestForSignature({ data, info })

  const signature = await account.signMessage({
    message
  })

  return {
    data,
    info,
    signature
  }
}

/**
 * Get the session account address for a Telegram user
 */
export function getSessionAccountAddress(telegramUserId: number): Address | null {
  const sessionKey = getSessionKey(telegramUserId)
  if (!sessionKey) return null

  const account = privateKeyToAccount(sessionKey)
  return account.address
}

/**
 * Get the user's wallet address (delegator address)
 */
export function getUserWalletAddress(telegramUserId: number): Address | null {
  const user = getLinkedUser(telegramUserId)
  return user?.walletAddress ?? null
}
