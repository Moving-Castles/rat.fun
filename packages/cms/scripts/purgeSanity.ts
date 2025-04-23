#!/usr/bin/env node

// Load environment variables from .env file in parent directory
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { createClient } = require('@sanity/client');
const { Command } = require('commander');

const LOCALHOST_WORLD_ADDRESS = '0x6439113f0e1f64018c3167DA2aC21e2689818086'

// Define document types
interface RoomDocument {
  _id: string;
  title: string;
  worldAddress: string;
}

interface OutcomeDocument {
  _id: string;
  title: string;
  worldAddress: string;
}

// Initialize Sanity client
const client = createClient({
  projectId: 'kupagww3',
  dataset: 'production',
  apiVersion: '2025-04-01',
  token: process.env.SANITY_TOKEN, // Make sure to set this environment variable
  useCdn: false,
});

// Set up command line options
const program = new Command();
program
  .option('-w, --world-address <address>', 'World address to purge')
  .option('-d, --dry-run', 'Dry run - only show what would be deleted')
  .option('-r, --rooms-only', 'Only delete room documents')
  .option('-o, --outcomes-only', 'Only delete outcome documents')
  .option('-l, --localhost', 'Use localhost world address')
  .parse(process.argv);

const options = program.opts();
const worldAddress = options.localhost ? LOCALHOST_WORLD_ADDRESS : options.worldAddress;
const isDryRun = options.dryRun || false;
const roomsOnly = options.roomsOnly || false;
const outcomesOnly = options.outcomesOnly || false;

// Validate input
if (!worldAddress && !options.localhost) {
  console.error('Error: World address is required unless --localhost flag is used');
  process.exit(1);
}

async function purgeWorld() {
  try {
    console.log(`Starting purge for world address: ${worldAddress}`);
    console.log(`Mode: ${isDryRun ? 'DRY RUN' : 'LIVE'}`);
    console.log(`Document types: ${roomsOnly ? 'rooms only' : outcomesOnly ? 'outcomes only' : 'both rooms and outcomes'}`);
    
    let rooms: RoomDocument[] = [];
    let outcomes: OutcomeDocument[] = [];
    
    // Find room documents if needed
    if (!outcomesOnly) {
      const roomQuery = `*[_type == "room" && worldAddress == $worldAddress]`;
      rooms = await client.fetch(roomQuery, { worldAddress });
      console.log(`Found ${rooms.length} room documents`);
    }
    
    // Find outcome documents if needed
    if (!roomsOnly) {
      const outcomeQuery = `*[_type == "outcome" && worldAddress == $worldAddress]`;
      outcomes = await client.fetch(outcomeQuery, { worldAddress });
      console.log(`Found ${outcomes.length} outcome documents`);
    }
    
    const totalDocuments = rooms.length + outcomes.length;
    console.log(`Total documents to delete: ${totalDocuments}`);
    
    if (totalDocuments === 0) {
      console.log('No documents found to delete. Exiting.');
      return;
    }
    
    if (isDryRun) {
      if (rooms.length > 0) {
        console.log('\n--- ROOM DOCUMENTS ---');
        rooms.forEach((room: RoomDocument) => {
          console.log(`ID: ${room._id}, Title: ${room.title}`);
        });
      }
      
      if (outcomes.length > 0) {
        console.log('\n--- OUTCOME DOCUMENTS ---');
        outcomes.forEach((outcome: OutcomeDocument) => {
          console.log(`ID: ${outcome._id}, Title: ${outcome.title}`);
        });
      }
      
      console.log('\nDry run completed. No documents were deleted.');
      return;
    }
    
    // Delete room documents
    if (rooms.length > 0) {
      console.log('\nDeleting room documents...');
      for (const room of rooms) {
        await client.delete(room._id);
        console.log(`Deleted room: ${room.title} (${room._id})`);
      }
    }
    
    // Delete outcome documents
    if (outcomes.length > 0) {
      console.log('\nDeleting outcome documents...');
      for (const outcome of outcomes) {
        await client.delete(outcome._id);
        console.log(`Deleted outcome: ${outcome.title} (${outcome._id})`);
      }
    }
    
    console.log(`\nPurge completed. Deleted ${totalDocuments} documents.`);
    
  } catch (error) {
    console.error('Error during purge:', error);
    process.exit(1);
  }
}

// Check if SANITY_TOKEN is set
if (!process.env.SANITY_TOKEN) {
  console.error('Error: SANITY_TOKEN environment variable is not set.');
  console.error('Please add it to your .env file or set it with: export SANITY_TOKEN=your_token');
  process.exit(1);
}

purgeWorld();
