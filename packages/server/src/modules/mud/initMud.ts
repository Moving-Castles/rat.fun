
import { setup } from '@modules/mud/setup';
import dotenv from 'dotenv';

dotenv.config();

const PRIVATE_KEY = process.env.PRIVATE_KEY as string;
const CHAIN_ID = Number(process.env.CHAIN_ID) as number;

console.log("PRIVATE_KEY", PRIVATE_KEY)

// Initialize MUD
const {
    components,
    systemCalls,
    network,
} = await setup(PRIVATE_KEY, CHAIN_ID);

export { components, systemCalls, network };
