import { mkdirSync } from "fs"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import { OffChainMessage, MessageDatabaseSchema } from "@modules/types"

// Initialize the database with file adapter
// (the file can be periodically pruned/deleted, only the last few messages are needed)
mkdirSync("db-files", { recursive: true })
const adapter = new JSONFile<MessageDatabaseSchema>("db-files/messages.json")
const db = new Low<MessageDatabaseSchema>(adapter, { messages: [] })

// Initialize the database
export async function initializeMessagesDB() {
  await db.read()
  if (!db.data) {
    db.data = { messages: [] }
    await db.write()
  }
}

// Store a new message
export async function storeMessage(message: OffChainMessage): Promise<OffChainMessage> {
  await db.read()
  db.data?.messages.push(message)
  await db.write()
  return message
}

// Get messages
export async function getMessages(limit?: number): Promise<OffChainMessage[]> {
  await db.read()
  const messages = db.data?.messages || []
  return limit ? messages.slice(-limit) : messages
}
