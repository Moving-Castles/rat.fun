import { Low, Memory } from 'lowdb';
import { OffChainMessage } from '../websocket/types';
import { v4 as uuidv4 } from 'uuid';

// Define the database schema
type Schema = {
  messages: OffChainMessage[];
};

// Initialize the database with in-memory adapter
const adapter = new Memory<Schema>();
const db = new Low<Schema>(adapter, { messages: [] });

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

// Get messages by topic
export async function getMessagesByTopic(topic: OffChainMessage['topic']): Promise<OffChainMessage[]> {
  await db.read();
  return db.data?.messages.filter(message => message.topic === topic) || [];
}

// Get messages by player name
export async function getMessagesByPlayer(playerName: string): Promise<OffChainMessage[]> {
  await db.read();
  return db.data?.messages.filter(message => message.playerName === playerName) || [];
}

// Clear all messages
export async function clearMessages(): Promise<void> {
  await db.read();
  if (db.data) {
    db.data.messages = [];
    await db.write();
  }
} 