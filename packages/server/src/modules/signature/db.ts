import { createStore } from "@modules/redis"

// Create the store instance
const store = createStore()

// Store a new nonce
export async function storeNonce(nonce: number) {
  await store.storeNonce(nonce)
}

// Check if nonce exists
export async function hasNonce(nonce: number): Promise<boolean> {
  return await store.hasNonce(nonce)
}
