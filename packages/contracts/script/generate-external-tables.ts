import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineStore } from "@latticexyz/store";
import { tablegen } from "@latticexyz/store/codegen";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const config = defineStore({
  codegen: {
    outputDirectory: "external/codegen"
  },
  tables: {
    Config: {
      key: [],
      schema: {
        initialized: "bool",
        admin: "address",
        incomeRecipient: "address",
        tokenForSale: "address",
      },
    },
    MutableConfig: {
      key: [],
      schema: {
        paused: "bool",
        usdEthPriceAggregator: "address",
        usdEurPriceAggregator: "address",
        eurTokenPrice: "uint256",
      },
    },
    AcceptedERC20: {
      key: ["erc20"],
      schema: {
        erc20: "address",
        usdERC20PriceAggregator: "address",
      },
      codegen: {
        dataStruct: true,
      },
    },
    TransactionTotals: {
      key: [],
      schema: {
        tokensSold: "uint256",
        eurReceived: "uint256",
      },
    },
    TransactionLimits: {
      key: [],
      schema: {
        walletEurSpendLimit: "uint256",
        totalEurSpendLimit: "uint256",
      },
    },
    WalletEurSpent: {
      key: ["walletAddress"],
      schema: {
        walletAddress: "address",
        value: "uint256",
      },
    },
  },
});

tablegen({ rootDir, config });