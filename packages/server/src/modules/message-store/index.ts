import { createStore } from "@modules/redis"
import type { OffChainMessage } from "@modules/types"

// Create the store instance
const store = createStore()

// Store a new message
export async function storeMessage(message: OffChainMessage): Promise<OffChainMessage> {
  return await store.storeMessage(message)
}

// Get messages
export async function getMessages(limit?: number): Promise<OffChainMessage[]> {
  return await store.getMessages(limit)
}
