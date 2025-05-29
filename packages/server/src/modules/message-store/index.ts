import { Low, Memory } from 'lowdb';
import { OffChainMessage, DatabaseSchema } from '@modules/types';

// Initialize the database with in-memory adapter
const adapter = new Memory<DatabaseSchema>();
const db = new Low<DatabaseSchema>(adapter, { messages: [] });

// Initialize the database
export async function initializeDB() {
  await db.read();
  if (!db.data) {
    db.data = { messages: [] };
    await db.write();
  }
}

// Store a new message
export async function storeMessage(message: OffChainMessage): Promise<OffChainMessage> {
  await db.read();
  db.data?.messages.push(message);
  await db.write();
  return message;
}

// Get messages
export async function getMessages(limit?: number): Promise<OffChainMessage[]> {
  await db.read();
  const messages = db.data?.messages || [];
  return limit ? messages.slice(-limit) : messages;
}