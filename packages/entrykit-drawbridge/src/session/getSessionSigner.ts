import { Address, Hex, isHex } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { sessionStorage } from "./storage"

/**
 * Get or create session signer for a user address
 *
 * Session signers are persistent private keys stored in localStorage.
 * They're used as the owner of the session smart account.
 *
 * If no signer exists for this user:
 * - Attempts to migrate from old MUD AccountKit storage format
 * - Otherwise generates a fresh random private key
 * - Stores the key for future use
 *
 * @param userAddress User's wallet address
 * @returns LocalAccount (viem account from private key)
 */
export function getSessionSigner(userAddress: Address) {
  let privateKey = sessionStorage.getSigner(userAddress)

  if (!privateKey) {
    // Attempt to migrate from legacy MUD AccountKit storage format
    // This allows existing users to keep their session accounts
    const deprecatedKey =
      typeof localStorage !== "undefined"
        ? localStorage
            .getItem(`mud:appSigner:privateKey:${userAddress.toLowerCase()}`)
            ?.replace(/^"(.*)"$/, "$1") // Remove JSON quotes if present
        : null

    // Use migrated key if valid, otherwise generate new random key
    privateKey = (isHex(deprecatedKey) ? deprecatedKey : generatePrivateKey()) as Hex
    sessionStorage.setSigner(userAddress, privateKey)
  }

  return privateKeyToAccount(privateKey)
}
