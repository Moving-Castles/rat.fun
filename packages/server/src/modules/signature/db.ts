import { mkdirSync } from "fs"
import { Low } from "lowdb"
import { JSONFile } from "lowdb/node"
import { NonceDatabaseSchema } from "@modules/types"

// Initialize the database with file adapter
// (the file can be periodically deleted, nonces only need to be kept during the timeout window)
mkdirSync("db-files", { recursive: true })
const adapter = new JSONFile<NonceDatabaseSchema>("db-files/nonces.json")
const db = new Low<NonceDatabaseSchema>(adapter, { nonces: {} })

// Initialize the database
export async function initializeNoncesDB() {
  await db.read()
  if (!db.data) {
    db.data = { nonces: {} }
    await db.write()
  }
}

// Store a new message
export async function storeNonce(nonce: number) {
  await db.read()
  db.data.nonces[nonce] = true
  await db.write()
}

// Get messages
export async function hasNonce(nonce: number): Promise<boolean> {
  await db.read()
  return db.data.nonces[nonce] ?? false
}
