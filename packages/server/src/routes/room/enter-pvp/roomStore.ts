import { Low, Memory } from 'lowdb';

// Define the database schema
type DatabaseSchema = Record<string, string[]>; // { roomID: string[] }

// Select storage type (use JSONFile for persistence, Memory for in-memory)
const adapter = new Memory<DatabaseSchema>(); // Change to new JSONFile('db.json') for persistence

// Ensure the Low instance is created with a default empty object
const db = new Low<DatabaseSchema>(adapter, {}); 

export async function initDB() {
  await db.read();
  await db.write(); // Ensure the file is created if using JSONFile
}

// Get rats in a room
export function getRats(roomID: string): string[] {
  return db.data[roomID] || [];
}

// Add rat to a room
export async function addRat(roomID: string, ratID: string) {
  db.data[roomID] ||= [];
  if (!db.data[roomID].includes(ratID)) {
    db.data[roomID].push(ratID);
  }
  await db.write();
}

// Clear all rats from a room
export async function clearRoom(roomID: string) {
  delete db.data[roomID];
  await db.write();
}