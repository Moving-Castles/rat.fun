
import { setup } from '@modules/mud/setup';
import dotenv from 'dotenv';

dotenv.config();

const ETH_PRIVATE_KEY = process.env.ETH_PRIVATE_KEY as string;
const CHAIN_ID = Number(process.env.CHAIN_ID) as number;

// Initialize MUD
const {
    components,
    systemCalls,
    network,
} = await setup(ETH_PRIVATE_KEY, CHAIN_ID);

export { components, systemCalls, network };
