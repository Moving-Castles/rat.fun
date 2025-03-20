import { chainConfig } from "viem/op-stack";
import { MUDChain } from "@latticexyz/common/chains";

const sourceId = 11155111; // Sepolia

export const pyrope = {
  id: 695569,
  name: "Pyrope",
  nativeCurrency: {
    decimals: 18,
    name: "Ether",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.pyropechain.com"],
      webSocket: ["wss://rpc.pyropechain.com"],
    }
  },
  contracts: {
    ...chainConfig.contracts,
    l1StandardBridge: {
      [sourceId]: {
        address: "0xC24932c31D9621aE9e792576152B7ef010cFC2F8",
        blockCreated: 7833723,
      },
    },
  },
  indexerUrl: "https://indexer.mud.pyropechain.com",
} as const satisfies MUDChain;