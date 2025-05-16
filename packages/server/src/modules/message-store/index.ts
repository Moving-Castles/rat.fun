import { Low, Memory } from 'lowdb';
import { OffChainMessage, DatabaseSchema } from '@modules/types';
import { v4 as uuidv4 } from 'uuid';

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
export async function storeMessage(message: Omit<OffChainMessage, 'id'>): Promise<OffChainMessage> {
  const messageWithId: OffChainMessage = {
    ...message,
    id: uuidv4(),
  };

  await db.read();
  db.data?.messages.push(messageWithId);
  await db.write();

  return messageWithId;
}

// Get messages
export async function getMessages(limit?: number): Promise<OffChainMessage[]> {
  await db.read();
  const messages = db.data?.messages || [];
  return limit ? messages.slice(-limit) : messages;
}