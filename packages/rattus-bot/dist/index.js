// src/index.ts
import { Command } from "commander";

// src/bot.ts
import Anthropic from "@anthropic-ai/sdk";

// src/modules/mud/setup.ts
import {
  createPublicClient,
  createWalletClient,
  http,
  getContract
} from "viem";
import { privateKeyToAccount, nonceManager } from "viem/accounts";
import { createWorld } from "@latticexyz/recs";
import { encodeEntity, syncToRecs } from "@latticexyz/store-sync/recs";
import { transportObserver } from "@latticexyz/common";
import { transactionQueue } from "@latticexyz/common/actions";

// ../contracts/worlds.json
var worlds_default = {
  "690": {
    address: "0x4ab7e8b94347cb0236e3de126db9c50599f7db2d",
    blockNumber: 1193554
  },
  "4242": {
    address: "0x27bae7cea782a5232f8aab546db2639d05d3a40c",
    blockNumber: 43079054
  },
  "8453": {
    address: "0x28d10E6aAb1a749Be792b4D8aa0519c70E83386a",
    blockNumber: 36961789
  },
  "17001": {
    address: "0xe833b782f63f7f0cb754b3259780a2b0a291dd80",
    blockNumber: 3017754
  },
  "17069": {
    address: "0x6f9eCC22096A5A34c58FEA8FCdaF4aBE914475Cd",
    blockNumber: 13567658
  },
  "31337": {
    address: "0x6439113f0e1f64018c3167DA2aC21e2689818086"
  },
  "84532": {
    address: "0xb559D9fb876F6fC3AC05B21004B33760B3582042",
    blockNumber: 35154850
  },
  "695569": {
    address: "0x78a2B029a5B5600d87b4951D5108E02F87D12806",
    blockNumber: 4446914
  }
};

// src/modules/mud/supportedChains.ts
import { base as baseConfig, baseSepolia as baseSepoliaConfig } from "viem/chains";
import { mudFoundry } from "@latticexyz/common/chains";
var RPC_HTTP_URL = process.env.RPC_HTTP_URL;
var extendedBase = {
  ...baseConfig,
  rpcUrls: {
    default: {
      http: RPC_HTTP_URL ? [RPC_HTTP_URL, ...baseConfig.rpcUrls.default.http] : baseConfig.rpcUrls.default.http,
      webSocket: void 0
    }
  },
  indexerUrl: "https://base.rat-fun-indexer.com"
};
var extendedBaseSepolia = {
  ...baseSepoliaConfig,
  rpcUrls: {
    default: {
      http: RPC_HTTP_URL ? [RPC_HTTP_URL, ...baseSepoliaConfig.rpcUrls.default.http] : baseSepoliaConfig.rpcUrls.default.http,
      webSocket: void 0
    }
  },
  indexerUrl: "https://base-sepolia.rat-fun-indexer.com"
};
var supportedChains = [mudFoundry, extendedBase, extendedBaseSepolia];

// src/modules/mud/networkConfig.ts
async function getNetworkConfig(chainId, worldAddressOverride) {
  const chainIndex = supportedChains.findIndex((c) => c.id === chainId);
  const chain = supportedChains[chainIndex];
  if (!chain) {
    throw new Error(
      `Chain ${chainId} not supported. Supported chains: ${supportedChains.map((c) => c.id).join(", ")}`
    );
  }
  const world = worlds_default[chain.id.toString()];
  const worldAddress = worldAddressOverride || world?.address;
  if (!worldAddress) {
    throw new Error(`World address not found for chain ${chainId}. Set WORLD_ADDRESS env var.`);
  }
  const initialBlockNumber = world?.blockNumber ?? 0;
  return {
    chainId,
    chain,
    worldAddress,
    initialBlockNumber,
    indexerUrl: chain.indexerUrl
  };
}

// ../contracts/out/IWorld.sol/IWorld.abi.json
var IWorld_abi_default = [
  {
    type: "function",
    name: "batchCall",
    inputs: [
      {
        name: "systemCalls",
        type: "tuple[]",
        internalType: "struct SystemCallData[]",
        components: [
          {
            name: "systemId",
            type: "bytes32",
            internalType: "ResourceId"
          },
          {
            name: "callData",
            type: "bytes",
            internalType: "bytes"
          }
        ]
      }
    ],
    outputs: [
      {
        name: "returnDatas",
        type: "bytes[]",
        internalType: "bytes[]"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "batchCallFrom",
    inputs: [
      {
        name: "systemCalls",
        type: "tuple[]",
        internalType: "struct SystemCallFromData[]",
        components: [
          {
            name: "from",
            type: "address",
            internalType: "address"
          },
          {
            name: "systemId",
            type: "bytes32",
            internalType: "ResourceId"
          },
          {
            name: "callData",
            type: "bytes",
            internalType: "bytes"
          }
        ]
      }
    ],
    outputs: [
      {
        name: "returnDatas",
        type: "bytes[]",
        internalType: "bytes[]"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "call",
    inputs: [
      {
        name: "systemId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "callData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "callFrom",
    inputs: [
      {
        name: "delegator",
        type: "address",
        internalType: "address"
      },
      {
        name: "systemId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "callData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "payable"
  },
  {
    type: "function",
    name: "creator",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "deleteRecord",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "getDynamicField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getDynamicFieldLength",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getDynamicFieldSlice",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "start",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "end",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      }
    ],
    outputs: [
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getFieldLayout",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      }
    ],
    outputs: [
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getFieldLength",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getFieldLength",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getKeySchema",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      }
    ],
    outputs: [
      {
        name: "keySchema",
        type: "bytes32",
        internalType: "Schema"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRecord",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      }
    ],
    outputs: [
      {
        name: "staticData",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "encodedLengths",
        type: "bytes32",
        internalType: "EncodedLengths"
      },
      {
        name: "dynamicData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getRecord",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      }
    ],
    outputs: [
      {
        name: "staticData",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "encodedLengths",
        type: "bytes32",
        internalType: "EncodedLengths"
      },
      {
        name: "dynamicData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getStaticField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      }
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "getValueSchema",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      }
    ],
    outputs: [
      {
        name: "valueSchema",
        type: "bytes32",
        internalType: "Schema"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "grantAccess",
    inputs: [
      {
        name: "resourceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "grantee",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "initialize",
    inputs: [
      {
        name: "initModule",
        type: "address",
        internalType: "contract IModule"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "installModule",
    inputs: [
      {
        name: "module",
        type: "address",
        internalType: "contract IModule"
      },
      {
        name: "encodedArgs",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "installRootModule",
    inputs: [
      {
        name: "module",
        type: "address",
        internalType: "contract IModule"
      },
      {
        name: "encodedArgs",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "popFromDynamicField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "byteLengthToPop",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "pushToDynamicField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "dataToPush",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__addTripBalance",
    inputs: [
      {
        name: "_tripId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "_amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__applyOutcome",
    inputs: [
      {
        name: "_ratId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "_tripId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "_balanceTransferToOrFromRat",
        type: "int256",
        internalType: "int256"
      },
      {
        name: "_itemsToRemoveFromRat",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "_itemsToAddToRat",
        type: "tuple[]",
        internalType: "struct Item[]",
        components: [
          {
            name: "name",
            type: "string",
            internalType: "string"
          },
          {
            name: "value",
            type: "uint256",
            internalType: "uint256"
          }
        ]
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__balanceOf",
    inputs: [
      {
        name: "playerId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "ratfun__closeTrip",
    inputs: [
      {
        name: "_tripId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__createRat",
    inputs: [
      {
        name: "_name",
        type: "string",
        internalType: "string"
      }
    ],
    outputs: [
      {
        name: "ratId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__createTrip",
    inputs: [
      {
        name: "_playerId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "_tripId",
        type: "bytes32",
        internalType: "bytes32"
      },
      {
        name: "_tripCreationCost",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_isChallengeTrip",
        type: "bool",
        internalType: "bool"
      },
      {
        name: "_fixedMinValueToEnter",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_overrideMaxValuePerWinPercentage",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "_prompt",
        type: "string",
        internalType: "string"
      }
    ],
    outputs: [
      {
        name: "newTripId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__giveCallerTokens",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__giveMasterKey",
    inputs: [
      {
        name: "playerId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__liquidateRat",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__removeWorldEvent",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__setCooldownCloseTrip",
    inputs: [
      {
        name: "_cooldownCloseTrip",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__setMaxValuePerWin",
    inputs: [
      {
        name: "_maxValuePerWin",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__setMinRatValueToEnter",
    inputs: [
      {
        name: "_minRatValueToEnter",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__setRatsKilledForAdminAccess",
    inputs: [
      {
        name: "_ratsKilledForAdminAccess",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__setTaxationCloseTrip",
    inputs: [
      {
        name: "_taxationCloseTrip",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__setTaxationLiquidateRat",
    inputs: [
      {
        name: "_taxationLiquidateRat",
        type: "uint32",
        internalType: "uint32"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__setWorldEvent",
    inputs: [
      {
        name: "cmsId",
        type: "string",
        internalType: "string"
      },
      {
        name: "title",
        type: "string",
        internalType: "string"
      },
      {
        name: "prompt",
        type: "string",
        internalType: "string"
      },
      {
        name: "durationInBlocks",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__spawn",
    inputs: [
      {
        name: "_name",
        type: "string",
        internalType: "string"
      }
    ],
    outputs: [
      {
        name: "playerId",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "ratfun__unlockAdmin",
    inputs: [],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerDelegation",
    inputs: [
      {
        name: "delegatee",
        type: "address",
        internalType: "address"
      },
      {
        name: "delegationControlId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "initCallData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerFunctionSelector",
    inputs: [
      {
        name: "systemId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "systemFunctionSignature",
        type: "string",
        internalType: "string"
      }
    ],
    outputs: [
      {
        name: "worldFunctionSelector",
        type: "bytes4",
        internalType: "bytes4"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerNamespace",
    inputs: [
      {
        name: "namespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerNamespaceDelegation",
    inputs: [
      {
        name: "namespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "delegationControlId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "initCallData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerRootFunctionSelector",
    inputs: [
      {
        name: "systemId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "worldFunctionSignature",
        type: "string",
        internalType: "string"
      },
      {
        name: "systemFunctionSignature",
        type: "string",
        internalType: "string"
      }
    ],
    outputs: [
      {
        name: "worldFunctionSelector",
        type: "bytes4",
        internalType: "bytes4"
      }
    ],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerStoreHook",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "hookAddress",
        type: "address",
        internalType: "contract IStoreHook"
      },
      {
        name: "enabledHooksBitmap",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerSystem",
    inputs: [
      {
        name: "systemId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "system",
        type: "address",
        internalType: "contract System"
      },
      {
        name: "publicAccess",
        type: "bool",
        internalType: "bool"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerSystemHook",
    inputs: [
      {
        name: "systemId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "hookAddress",
        type: "address",
        internalType: "contract ISystemHook"
      },
      {
        name: "enabledHooksBitmap",
        type: "uint8",
        internalType: "uint8"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "registerTable",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      },
      {
        name: "keySchema",
        type: "bytes32",
        internalType: "Schema"
      },
      {
        name: "valueSchema",
        type: "bytes32",
        internalType: "Schema"
      },
      {
        name: "keyNames",
        type: "string[]",
        internalType: "string[]"
      },
      {
        name: "fieldNames",
        type: "string[]",
        internalType: "string[]"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "renounceOwnership",
    inputs: [
      {
        name: "namespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "revokeAccess",
    inputs: [
      {
        name: "resourceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "grantee",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setDynamicField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setRecord",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "staticData",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "encodedLengths",
        type: "bytes32",
        internalType: "EncodedLengths"
      },
      {
        name: "dynamicData",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "setStaticField",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "fieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "fieldLayout",
        type: "bytes32",
        internalType: "FieldLayout"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "spliceDynamicData",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        internalType: "uint8"
      },
      {
        name: "startWithinField",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "deleteCount",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "spliceStaticData",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        internalType: "bytes32[]"
      },
      {
        name: "start",
        type: "uint48",
        internalType: "uint48"
      },
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "storeVersion",
    inputs: [],
    outputs: [
      {
        name: "version",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "function",
    name: "transferBalanceToAddress",
    inputs: [
      {
        name: "fromNamespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "toAddress",
        type: "address",
        internalType: "address"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferBalanceToNamespace",
    inputs: [
      {
        name: "fromNamespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "toNamespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "transferOwnership",
    inputs: [
      {
        name: "namespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "newOwner",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unregisterDelegation",
    inputs: [
      {
        name: "delegatee",
        type: "address",
        internalType: "address"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unregisterNamespaceDelegation",
    inputs: [
      {
        name: "namespaceId",
        type: "bytes32",
        internalType: "ResourceId"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unregisterStoreHook",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "hookAddress",
        type: "address",
        internalType: "contract IStoreHook"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "unregisterSystemHook",
    inputs: [
      {
        name: "systemId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "hookAddress",
        type: "address",
        internalType: "contract ISystemHook"
      }
    ],
    outputs: [],
    stateMutability: "nonpayable"
  },
  {
    type: "function",
    name: "worldVersion",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32"
      }
    ],
    stateMutability: "view"
  },
  {
    type: "event",
    name: "HelloStore",
    inputs: [
      {
        name: "storeVersion",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "HelloWorld",
    inputs: [
      {
        name: "worldVersion",
        type: "bytes32",
        indexed: true,
        internalType: "bytes32"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Store_DeleteRecord",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        indexed: true,
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        indexed: false,
        internalType: "bytes32[]"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Store_SetRecord",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        indexed: true,
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        indexed: false,
        internalType: "bytes32[]"
      },
      {
        name: "staticData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      },
      {
        name: "encodedLengths",
        type: "bytes32",
        indexed: false,
        internalType: "EncodedLengths"
      },
      {
        name: "dynamicData",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Store_SpliceDynamicData",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        indexed: true,
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        indexed: false,
        internalType: "bytes32[]"
      },
      {
        name: "dynamicFieldIndex",
        type: "uint8",
        indexed: false,
        internalType: "uint8"
      },
      {
        name: "start",
        type: "uint48",
        indexed: false,
        internalType: "uint48"
      },
      {
        name: "deleteCount",
        type: "uint40",
        indexed: false,
        internalType: "uint40"
      },
      {
        name: "encodedLengths",
        type: "bytes32",
        indexed: false,
        internalType: "EncodedLengths"
      },
      {
        name: "data",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "Store_SpliceStaticData",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        indexed: true,
        internalType: "ResourceId"
      },
      {
        name: "keyTuple",
        type: "bytes32[]",
        indexed: false,
        internalType: "bytes32[]"
      },
      {
        name: "start",
        type: "uint48",
        indexed: false,
        internalType: "uint48"
      },
      {
        name: "data",
        type: "bytes",
        indexed: false,
        internalType: "bytes"
      }
    ],
    anonymous: false
  },
  {
    type: "error",
    name: "EncodedLengths_InvalidLength",
    inputs: [
      {
        name: "length",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "FieldLayout_Empty",
    inputs: []
  },
  {
    type: "error",
    name: "FieldLayout_InvalidStaticDataLength",
    inputs: [
      {
        name: "staticDataLength",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "computedStaticDataLength",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "FieldLayout_StaticLengthDoesNotFitInAWord",
    inputs: [
      {
        name: "index",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "FieldLayout_StaticLengthIsNotZero",
    inputs: [
      {
        name: "index",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "FieldLayout_StaticLengthIsZero",
    inputs: [
      {
        name: "index",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "FieldLayout_TooManyDynamicFields",
    inputs: [
      {
        name: "numFields",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "maxFields",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "FieldLayout_TooManyFields",
    inputs: [
      {
        name: "numFields",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "maxFields",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Module_AlreadyInstalled",
    inputs: []
  },
  {
    type: "error",
    name: "Module_MissingDependency",
    inputs: [
      {
        name: "dependency",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "Module_NonRootInstallNotSupported",
    inputs: []
  },
  {
    type: "error",
    name: "Module_RootInstallNotSupported",
    inputs: []
  },
  {
    type: "error",
    name: "Schema_InvalidLength",
    inputs: [
      {
        name: "length",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Schema_StaticTypeAfterDynamicType",
    inputs: []
  },
  {
    type: "error",
    name: "Slice_OutOfBounds",
    inputs: [
      {
        name: "data",
        type: "bytes",
        internalType: "bytes"
      },
      {
        name: "start",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "end",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_IndexOutOfBounds",
    inputs: [
      {
        name: "length",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "accessedIndex",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidBounds",
    inputs: [
      {
        name: "start",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "end",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidFieldNamesLength",
    inputs: [
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "received",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidKeyNamesLength",
    inputs: [
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "received",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidResourceType",
    inputs: [
      {
        name: "expected",
        type: "bytes2",
        internalType: "bytes2"
      },
      {
        name: "resourceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "resourceIdString",
        type: "string",
        internalType: "string"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidSplice",
    inputs: [
      {
        name: "startWithinField",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "deleteCount",
        type: "uint40",
        internalType: "uint40"
      },
      {
        name: "fieldLength",
        type: "uint40",
        internalType: "uint40"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidStaticDataLength",
    inputs: [
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "received",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidValueSchemaDynamicLength",
    inputs: [
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "received",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidValueSchemaLength",
    inputs: [
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "received",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_InvalidValueSchemaStaticLength",
    inputs: [
      {
        name: "expected",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "received",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "Store_TableAlreadyExists",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "tableIdString",
        type: "string",
        internalType: "string"
      }
    ]
  },
  {
    type: "error",
    name: "Store_TableNotFound",
    inputs: [
      {
        name: "tableId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "tableIdString",
        type: "string",
        internalType: "string"
      }
    ]
  },
  {
    type: "error",
    name: "World_AccessDenied",
    inputs: [
      {
        name: "resource",
        type: "string",
        internalType: "string"
      },
      {
        name: "caller",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "World_AlreadyInitialized",
    inputs: []
  },
  {
    type: "error",
    name: "World_CallbackNotAllowed",
    inputs: [
      {
        name: "functionSelector",
        type: "bytes4",
        internalType: "bytes4"
      }
    ]
  },
  {
    type: "error",
    name: "World_DelegationNotFound",
    inputs: [
      {
        name: "delegator",
        type: "address",
        internalType: "address"
      },
      {
        name: "delegatee",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "World_FunctionSelectorAlreadyExists",
    inputs: [
      {
        name: "functionSelector",
        type: "bytes4",
        internalType: "bytes4"
      }
    ]
  },
  {
    type: "error",
    name: "World_FunctionSelectorNotFound",
    inputs: [
      {
        name: "functionSelector",
        type: "bytes4",
        internalType: "bytes4"
      }
    ]
  },
  {
    type: "error",
    name: "World_InsufficientBalance",
    inputs: [
      {
        name: "balance",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "World_InterfaceNotSupported",
    inputs: [
      {
        name: "contractAddress",
        type: "address",
        internalType: "address"
      },
      {
        name: "interfaceId",
        type: "bytes4",
        internalType: "bytes4"
      }
    ]
  },
  {
    type: "error",
    name: "World_InvalidNamespace",
    inputs: [
      {
        name: "namespace",
        type: "bytes14",
        internalType: "bytes14"
      }
    ]
  },
  {
    type: "error",
    name: "World_InvalidResourceId",
    inputs: [
      {
        name: "resourceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "resourceIdString",
        type: "string",
        internalType: "string"
      }
    ]
  },
  {
    type: "error",
    name: "World_InvalidResourceType",
    inputs: [
      {
        name: "expected",
        type: "bytes2",
        internalType: "bytes2"
      },
      {
        name: "resourceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "resourceIdString",
        type: "string",
        internalType: "string"
      }
    ]
  },
  {
    type: "error",
    name: "World_ResourceAlreadyExists",
    inputs: [
      {
        name: "resourceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "resourceIdString",
        type: "string",
        internalType: "string"
      }
    ]
  },
  {
    type: "error",
    name: "World_ResourceNotFound",
    inputs: [
      {
        name: "resourceId",
        type: "bytes32",
        internalType: "ResourceId"
      },
      {
        name: "resourceIdString",
        type: "string",
        internalType: "string"
      }
    ]
  },
  {
    type: "error",
    name: "World_SystemAlreadyExists",
    inputs: [
      {
        name: "system",
        type: "address",
        internalType: "address"
      }
    ]
  },
  {
    type: "error",
    name: "World_UnlimitedDelegationNotAllowed",
    inputs: []
  }
];

// ../contracts/mud.config.ts
import { defineWorld } from "@latticexyz/world";

// ../contracts/enums.ts
var ENTITY_TYPE = /* @__PURE__ */ ((ENTITY_TYPE3) => {
  ENTITY_TYPE3[ENTITY_TYPE3["NONE"] = 0] = "NONE";
  ENTITY_TYPE3[ENTITY_TYPE3["PLAYER"] = 1] = "PLAYER";
  ENTITY_TYPE3[ENTITY_TYPE3["RAT"] = 2] = "RAT";
  ENTITY_TYPE3[ENTITY_TYPE3["TRIP"] = 3] = "TRIP";
  ENTITY_TYPE3[ENTITY_TYPE3["ITEM"] = 4] = "ITEM";
  return ENTITY_TYPE3;
})(ENTITY_TYPE || {});
function getEnumKeys(enumObj) {
  return Object.values(enumObj).filter((key) => isNaN(Number(key)));
}
var ENTITY_TYPE_ARRAY = getEnumKeys(ENTITY_TYPE);

// ../contracts/mud.config.ts
var mud_config_default = defineWorld({
  namespace: "ratfun",
  enums: {
    ENTITY_TYPE: ENTITY_TYPE_ARRAY
  },
  codegen: {
    generateSystemLibraries: true
  },
  deploy: {
    upgradeableWorldImplementation: true
  },
  tables: {
    GameConfig: {
      key: [],
      schema: {
        adminAddress: "address",
        adminId: "bytes32",
        ratCreationCost: "uint256",
        maxInventorySize: "uint32",
        maxTripPromptLength: "uint32",
        cooldownCloseTrip: "uint32",
        ratsKilledForAdminAccess: "uint32"
      },
      codegen: {
        dataStruct: true
      }
    },
    GamePercentagesConfig: {
      key: [],
      schema: {
        maxValuePerWin: "uint32",
        // Limits how much a rat can extract from trip in one run
        minRatValueToEnter: "uint32",
        // Minimum total value of rat to enter trip.
        taxationLiquidateRat: "uint32",
        taxationCloseTrip: "uint32"
      }
    },
    WorldStats: {
      key: [],
      schema: {
        globalTripIndex: "uint256",
        globalRatIndex: "uint256",
        globalRatKillCount: "uint256",
        lastKilledRatBlock: "uint256"
      }
    },
    ExternalAddressesConfig: {
      key: [],
      schema: {
        erc20Address: "address",
        gamePoolAddress: "address",
        mainSaleAddress: "address",
        serviceAddress: "address",
        feeAddress: "address"
      },
      codegen: {
        dataStruct: true
      }
    },
    WorldEvent: {
      key: [],
      schema: {
        creationBlock: "uint256",
        expirationBlock: "uint256",
        cmsId: "string",
        title: "string",
        prompt: "string"
      }
    },
    // = = = = = = = = = =
    Name: "string",
    // Set on player, rat and trip
    EntityType: "ENTITY_TYPE",
    CreationBlock: "uint256",
    // Set on player, rat and trip
    LastVisitBlock: "uint256",
    // Set on trip
    // = = = = = = = = = =
    Balance: "uint256",
    // Amount of credits. Set on player, rat and trip.
    // = = = = = = = = = =
    Dead: "bool",
    // Set on rat
    Liquidated: "bool",
    // Set on rat and trip when it is liquidated by owner
    LiquidationValue: "uint256",
    // Set on rat and trip when it is liquidated, gross value (before taxation)
    LiquidationTaxPercentage: "uint256",
    // Set on rat and trip when it is liquidated
    LiquidationBlock: "uint256",
    // Set on rat and trip when it is liquidated
    // = = = = = = = = = =
    Inventory: "bytes32[]",
    // Items carried by player and rat
    // = = = = = = = = = =
    MasterKey: "bool",
    // Set on player. Gives access to in-game admin area.
    Index: "uint256",
    // Set on rat and trip
    Value: "uint256",
    // Set on items
    CurrentRat: "bytes32",
    // Set on player
    PastRats: "bytes32[]",
    // Set on player. List of rats the player has owned.
    Owner: "bytes32",
    // Set on trip and rat
    VisitCount: "uint256",
    // Set on trip
    KillCount: "uint256",
    // Set on trip
    TripCount: "uint256",
    // Set on rat
    // = = = = = = = = = =
    Prompt: "string",
    // = = = = = = = = = =
    TripCreationCost: "uint256",
    // Initial balance of trip.
    // = = = = = = = = = =
    // Challenge trip extensions
    // = = = = = = = = = =
    ChallengeTrip: "bool",
    // Mark trip as a challenge trip
    FixedMinValueToEnter: "uint256",
    // Fixed minimum value to enter the trip
    OverrideMaxValuePerWinPercentage: "uint256",
    // Override maximum value per win percentage
    ChallengeWinner: "bytes32"
    // Winner of the challenge trip
  },
  systems: {
    // DevSystem is conditionally deployed for local/test chains in PostDeploy
    DevSystem: {
      deploy: {
        disabled: true
      }
    }
  },
  modules: [
    {
      artifactPath: "@latticexyz/world-modules/out/UniqueEntityModule.sol/UniqueEntityModule.json",
      root: true,
      args: []
    }
  ]
});

// src/modules/mud/setup.ts
async function setupMud(privateKey, chainId, worldAddressOverride) {
  const networkConfig = await getNetworkConfig(chainId, worldAddressOverride);
  const world = createWorld();
  console.log(`Setting up MUD for chain ${chainId}...`);
  console.log(`World address: ${networkConfig.worldAddress}`);
  console.log(`Indexer URL: ${networkConfig.indexerUrl}`);
  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(http(networkConfig.chain.rpcUrls.default.http[0])),
    pollingInterval: 1e3
  };
  const publicClient = createPublicClient(clientOptions);
  const account = privateKeyToAccount(privateKey, { nonceManager });
  console.log(`Bot wallet address: ${account.address}`);
  const walletClient = createWalletClient({
    ...clientOptions,
    account
  }).extend(transactionQueue());
  const worldContract = getContract({
    address: networkConfig.worldAddress,
    abi: IWorld_abi_default,
    client: { public: publicClient, wallet: walletClient }
  });
  console.log("Syncing MUD state from indexer...");
  const { components, waitForTransaction, storedBlockLogs$ } = await syncToRecs({
    world,
    config: mud_config_default,
    address: networkConfig.worldAddress,
    publicClient,
    startBlock: BigInt(networkConfig.initialBlockNumber),
    indexerUrl: networkConfig.indexerUrl
  });
  console.log("Waiting for initial state sync...");
  await new Promise((resolve, reject) => {
    const subscription = storedBlockLogs$.subscribe({
      next: (block) => {
        if (block.blockNumber > 0n) {
          subscription.unsubscribe();
          resolve();
        }
      },
      error: (err) => {
        subscription.unsubscribe();
        reject(err);
      }
    });
  });
  console.log("MUD sync complete!");
  return {
    world,
    components,
    playerEntity: encodeEntity({ address: "address" }, { address: walletClient.account.address }),
    publicClient,
    walletClient,
    waitForTransaction,
    worldContract
  };
}

// src/modules/mud/actions/spawn.ts
async function spawn(mud, name) {
  console.log(`Spawning player with name: ${name}...`);
  const tx = await mud.worldContract.write.ratfun__spawn([name]);
  console.log(`Spawn transaction sent: ${tx}`);
  await mud.waitForTransaction(tx);
  console.log(`Player spawned successfully!`);
  return tx;
}

// src/modules/mud/actions/createRat.ts
async function createRat(mud, name) {
  console.log(`Creating rat with name: ${name}...`);
  const tx = await mud.worldContract.write.ratfun__createRat([name]);
  console.log(`CreateRat transaction sent: ${tx}`);
  await mud.waitForTransaction(tx);
  console.log(`Rat created successfully!`);
  return tx;
}

// src/modules/mud/actions/approveTokens.ts
import { maxUint256, erc20Abi } from "viem";
import { getComponentValue } from "@latticexyz/recs";
import { singletonEntity } from "@latticexyz/store-sync/recs";
async function approveMaxTokens(mud) {
  const externalAddresses = getComponentValue(
    mud.components.ExternalAddressesConfig,
    singletonEntity
  );
  if (!externalAddresses) {
    throw new Error("ExternalAddressesConfig not found in MUD state");
  }
  const erc20Address = externalAddresses.erc20Address;
  const gamePoolAddress = externalAddresses.gamePoolAddress;
  console.log(`Approving max tokens for game pool...`);
  console.log(`  ERC20 address: ${erc20Address}`);
  console.log(`  Game pool address: ${gamePoolAddress}`);
  const tx = await mud.walletClient.writeContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "approve",
    args: [gamePoolAddress, maxUint256]
  });
  console.log(`Approve transaction sent: ${tx}`);
  await mud.publicClient.waitForTransactionReceipt({ hash: tx });
  console.log(`Tokens approved successfully!`);
  return tx;
}
async function getAllowance(mud, ownerAddress) {
  const externalAddresses = getComponentValue(
    mud.components.ExternalAddressesConfig,
    singletonEntity
  );
  if (!externalAddresses) {
    throw new Error("ExternalAddressesConfig not found in MUD state");
  }
  const erc20Address = externalAddresses.erc20Address;
  const gamePoolAddress = externalAddresses.gamePoolAddress;
  const allowance = await mud.publicClient.readContract({
    address: erc20Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [ownerAddress, gamePoolAddress]
  });
  return allowance;
}

// src/modules/mud/actions/getTrips.ts
import { getComponentValue as getComponentValue2 } from "@latticexyz/recs";
import { singletonEntity as singletonEntity2 } from "@latticexyz/store-sync/recs";
import { ENTITY_TYPE as ENTITY_TYPE2 } from "contracts/enums";
function getAvailableTrips(mud) {
  const {
    EntityType,
    Balance,
    Prompt,
    TripCreationCost,
    Owner,
    VisitCount,
    KillCount,
    CreationBlock
  } = mud.components;
  const trips = [];
  EntityType.values.value.forEach((entityType, entityKey) => {
    const entityId = entityKey.description;
    if (entityType === ENTITY_TYPE2.TRIP) {
      const balance = Number(getComponentValue2(Balance, entityId)?.value ?? 0);
      if (balance > 0) {
        const prompt = getComponentValue2(Prompt, entityId)?.value ?? "";
        const tripCreationCost = Number(
          getComponentValue2(TripCreationCost, entityId)?.value ?? 0
        );
        const owner = getComponentValue2(Owner, entityId)?.value ?? "";
        const visitCount = Number(getComponentValue2(VisitCount, entityId)?.value ?? 0);
        const killCount = Number(getComponentValue2(KillCount, entityId)?.value ?? 0);
        const creationBlock = Number(
          getComponentValue2(CreationBlock, entityId)?.value ?? 0
        );
        trips.push({
          id: entityId,
          prompt,
          balance,
          tripCreationCost,
          owner,
          visitCount,
          killCount,
          creationBlock
        });
      }
    }
  });
  return trips;
}
function getPlayer(mud, playerId) {
  const { Name, Balance, CurrentRat, EntityType } = mud.components;
  const entityTypeValue = getComponentValue2(EntityType, playerId);
  const entityType = entityTypeValue?.value;
  if (entityType !== ENTITY_TYPE2.PLAYER) return null;
  const name = getComponentValue2(Name, playerId)?.value ?? "Unknown";
  const balance = Number(getComponentValue2(Balance, playerId)?.value ?? 0);
  const currentRat = getComponentValue2(CurrentRat, playerId)?.value ?? null;
  return {
    id: playerId,
    name,
    balance,
    currentRat
  };
}
function getRat(mud, ratId) {
  const { Name, Balance, Dead, Owner, TripCount, Inventory } = mud.components;
  const name = getComponentValue2(Name, ratId)?.value;
  if (!name) return null;
  const balance = Number(getComponentValue2(Balance, ratId)?.value ?? 0);
  const dead = Boolean(getComponentValue2(Dead, ratId)?.value ?? false);
  const owner = getComponentValue2(Owner, ratId)?.value ?? "";
  const tripCount = Number(getComponentValue2(TripCount, ratId)?.value ?? 0);
  const inventory = getComponentValue2(Inventory, ratId)?.value ?? [];
  return {
    id: ratId,
    name,
    balance,
    dead,
    owner,
    tripCount,
    inventory
  };
}
function getGameConfig(mud) {
  const gameConfig = getComponentValue2(mud.components.GameConfig, singletonEntity2);
  if (!gameConfig) {
    throw new Error("GameConfig not found in MUD state");
  }
  return {
    ratCreationCost: Number(gameConfig.ratCreationCost),
    adminId: gameConfig.adminId
  };
}
function getGamePercentagesConfig(mud) {
  const config = getComponentValue2(mud.components.GamePercentagesConfig, singletonEntity2);
  if (!config) {
    throw new Error("GamePercentagesConfig not found in MUD state");
  }
  return {
    maxValuePerWin: Number(config.maxValuePerWin),
    minRatValueToEnter: Number(config.minRatValueToEnter)
  };
}
function getRatTotalValue(mud, rat) {
  const { Value } = mud.components;
  let totalValue = rat.balance;
  for (const itemId of rat.inventory) {
    if (itemId) {
      const itemValue = Number(getComponentValue2(Value, itemId)?.value ?? 0);
      totalValue += itemValue;
    }
  }
  return totalValue;
}
function getInventoryDetails(mud, rat) {
  const { Name, Value } = mud.components;
  const items = [];
  for (const itemId of rat.inventory) {
    if (itemId) {
      const name = getComponentValue2(Name, itemId)?.value ?? "Unknown";
      const value = Number(getComponentValue2(Value, itemId)?.value ?? 0);
      items.push({ name, value });
    }
  }
  return items;
}
function canRatEnterTrip(mud, rat, trip) {
  const config = getGamePercentagesConfig(mud);
  const ratValue = getRatTotalValue(mud, rat);
  const minRequired = Math.floor(trip.tripCreationCost * config.minRatValueToEnter / 100);
  return ratValue >= minRequired;
}

// src/modules/signature/index.ts
async function signRequest(data, walletClient) {
  const info = {
    timestamp: Date.now(),
    nonce: Math.floor(Math.random() * 1e12),
    calledFrom: null
    // Bot uses direct wallet, not delegation
  };
  const message = JSON.stringify({ data, info });
  const signature = await walletClient.signMessage({
    message
  });
  return {
    data,
    info,
    signature
  };
}

// src/modules/server/enterTrip.ts
async function enterTrip(serverUrl, walletClient, tripId, ratId) {
  const requestBody = {
    tripId,
    ratId
  };
  const signedRequest = await signRequest(requestBody, walletClient);
  const url = `${serverUrl}/trip/enter`;
  let seconds = 0;
  const ticker = setInterval(() => {
    seconds++;
    process.stdout.write(`\r\u23F3 Waiting for trip result... ${seconds}s`);
  }, 1e3);
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 45e3);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signedRequest),
      signal: controller.signal
    });
    clearInterval(ticker);
    clearTimeout(timeoutId);
    process.stdout.write("\r" + " ".repeat(40) + "\r");
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Server error: ${error.error}: ${error.message}`);
    }
    const outcome = await response.json();
    return outcome;
  } catch (err) {
    clearInterval(ticker);
    clearTimeout(timeoutId);
    process.stdout.write("\r" + " ".repeat(40) + "\r");
    if (err instanceof Error) {
      if (err.name === "AbortError") {
        throw new Error("Request timed out after 45 seconds");
      }
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        throw new Error(`Network error: ${err.message}`);
      }
    }
    throw err;
  }
}

// src/modules/trip-selector/heuristic.ts
function selectTripHeuristic(trips) {
  if (trips.length === 0) return null;
  const sorted = [...trips].sort((a, b) => b.balance - a.balance);
  return sorted[0];
}
function selectTripRandom(trips) {
  if (trips.length === 0) return null;
  const randomIndex = Math.floor(Math.random() * trips.length);
  return trips[randomIndex];
}

// src/modules/trip-selector/claude.ts
async function selectTripWithClaude(anthropic, trips, rat, inventoryDetails = [], recentOutcomes = []) {
  if (trips.length === 0) return null;
  if (trips.length === 1) {
    return {
      trip: trips[0],
      explanation: "Only one trip available"
    };
  }
  const tripsForPrompt = trips.map((t) => {
    const priorWeight = 5;
    const priorSurvival = priorWeight * 0.5;
    const actualSurvival = t.visitCount - t.killCount;
    const weightedSurvivalRate = Math.round(
      (priorSurvival + actualSurvival) / (priorWeight + t.visitCount) * 100
    );
    return {
      id: t.id,
      prompt: t.prompt,
      balance: t.balance,
      visitCount: t.visitCount,
      killCount: t.killCount,
      survivalRate: weightedSurvivalRate,
      confidence: t.visitCount >= 10 ? "high" : t.visitCount >= 5 ? "medium" : "low"
    };
  });
  const totalInventoryValue = inventoryDetails.reduce((sum, item) => sum + item.value, 0);
  let inventorySection = "";
  if (inventoryDetails.length > 0) {
    const itemsList = inventoryDetails.map((i) => `  - ${i.name} (value: ${i.value})`).join("\n");
    inventorySection = `
## Current Inventory
The rat is carrying the following items (total inventory value: ${totalInventoryValue}):
${itemsList}

IMPORTANT: Consider how these items might interact with trip scenarios:
- Some trips may require specific items to succeed or avoid danger
- Some items may provide advantages in certain situations
- Losing valuable items is a risk - consider if a trip might cause item loss
`;
  } else {
    inventorySection = `
## Current Inventory
The rat is not carrying any items.
`;
  }
  let outcomesSection = "";
  if (recentOutcomes.length > 0) {
    const availableTripIds = new Set(trips.map((t) => t.id));
    const relevantOutcomes = recentOutcomes.filter((o) => availableTripIds.has(o.tripId));
    if (relevantOutcomes.length > 0) {
      const outcomesByTrip = /* @__PURE__ */ new Map();
      for (const outcome of relevantOutcomes) {
        const existing = outcomesByTrip.get(outcome.tripId) || {
          wins: 0,
          deaths: 0,
          totalChange: 0,
          prompt: outcome.tripPrompt || ""
        };
        const isDeath = (outcome.newRatBalance ?? 0) === 0 && (outcome.oldRatBalance ?? 0) > 0;
        if (isDeath) {
          existing.deaths++;
        } else {
          existing.wins++;
          existing.totalChange += outcome.ratValueChange ?? 0;
        }
        outcomesByTrip.set(outcome.tripId, existing);
      }
      const summaries = Array.from(outcomesByTrip.entries()).map(([tripId, stats]) => {
        const avgGain = stats.wins > 0 ? Math.round(stats.totalChange / stats.wins) : 0;
        return `- Trip "${stats.prompt.slice(0, 50)}...": ${stats.wins} survivals (avg +${avgGain}), ${stats.deaths} deaths`;
      });
      outcomesSection = `
## Recent Outcome History (from other rats)
Here's what happened to other rats in currently available trips (last 50 game-wide outcomes):
${summaries.join("\n")}

Use this data to identify which trips are actually rewarding vs deadly in practice.
`;
    }
  }
  const targetValue = 200;
  const currentValue = rat.balance + totalInventoryValue;
  const valueNeeded = Math.max(0, targetValue - currentValue);
  const prompt = `You are an AI strategist helping a rat named "${rat.name}" choose which trip to enter in a game.

## Primary Goal
Your goal is to reach ${targetValue} TOTAL VALUE as quickly as possible so the rat can be liquidated for profit. Current value: ${currentValue}. You need ${valueNeeded} more value to reach the target.

IMPORTANT MINDSET: You have an APPETITE FOR RISK. Mere survival is NOT desirable - a rat that survives but gains nothing is wasting time. You'd rather take calculated risks for high rewards than play it safe. Death is acceptable if the potential reward justified the risk.

## Risk Philosophy
- HIGH reward trips are preferred even if they have moderate danger
- Playing it safe with low-reward trips is a LOSING strategy
- The goal is to GROW value fast, not to survive the longest
- A 60% survival rate with +20 value potential beats a 90% survival rate with +5 value potential
- Time is money - slow safe gains mean more exposure to eventual death anyway

## Current Rat State
- Balance: ${rat.balance} credits
- Items in inventory: ${rat.inventory.length} (total inventory value: ${totalInventoryValue})
- Total value: ${currentValue} / ${targetValue} target
- Progress: ${Math.round(currentValue / targetValue * 100)}% to liquidation goal
- Total trips survived: ${rat.tripCount}
${inventorySection}${outcomesSection}
## Available Trips
${JSON.stringify(tripsForPrompt, null, 2)}

## Your Task
Analyze each trip to find the BEST VALUE OPPORTUNITY. Consider:
1. Which trip offers the HIGHEST potential value gain? Prioritize trips with high balance pools.
2. Does the trip prompt suggest treasure, loot, rewards, or valuable items? These are attractive.
3. Accept moderate risk (40-70% survival) if the reward potential is high.
4. Only avoid trips that seem like death traps with NO reward (high danger + no loot mentioned).
5. Consider if your inventory items give advantages or are required for certain trips.
6. Use trip statistics AND recent outcome history to assess real-world performance:
   - Recent outcomes show actual results from other rats - this is valuable data
   - Trips with good avg gains and low death rates are proven winners
   - Be wary of trips where recent rats died frequently
7. Use the survivalRate statistic as a guide, but weigh recent outcomes more heavily:
   - survivalRate below 30% with recent deaths = avoid
   - survivalRate 40-60% with good recent gains = worth the risk
   - survivalRate above 70% = safe, but make sure the reward is worth it

## Response Format
Respond with a JSON object containing:
- tripId: The full ID of your chosen trip
- explanation: A brief (1-2 sentence) explanation of why you chose this trip

Example:
\`\`\`json
{
  "tripId": "0x1234...",
  "explanation": "High balance pool with treasure mentioned in prompt - worth the 55% survival odds for potential +25 value."
}
\`\`\`

Respond with ONLY the JSON object, no other text.`;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }]
    });
    const content = response.content[0];
    if (content.type !== "text") {
      console.warn("Unexpected response type from Claude, falling back to heuristic");
      return fallbackSelection(trips);
    }
    let parsed;
    try {
      let jsonText = content.text.trim();
      if (jsonText.startsWith("```json")) {
        jsonText = jsonText.slice(7);
      }
      if (jsonText.startsWith("```")) {
        jsonText = jsonText.slice(3);
      }
      if (jsonText.endsWith("```")) {
        jsonText = jsonText.slice(0, -3);
      }
      parsed = JSON.parse(jsonText.trim());
    } catch {
      console.warn("Failed to parse Claude response as JSON:", content.text);
      return fallbackSelection(trips);
    }
    const selectedTrip = trips.find((t) => t.id === parsed.tripId);
    if (!selectedTrip) {
      console.warn(`Claude selected unknown trip ID: ${parsed.tripId}, falling back to heuristic`);
      return fallbackSelection(trips);
    }
    return {
      trip: selectedTrip,
      explanation: parsed.explanation
    };
  } catch (error) {
    console.error("Error calling Claude API:", error);
    console.warn("Falling back to heuristic selection");
    return fallbackSelection(trips);
  }
}
function fallbackSelection(trips) {
  const trip = trips.sort((a, b) => b.balance - a.balance)[0];
  return {
    trip,
    explanation: "Fallback: selected trip with highest balance"
  };
}

// src/modules/cms/index.ts
import { createClient } from "@sanity/client";
var PUBLIC_SANITY_CMS_ID = "saljmqwt";
var sanityClient = createClient({
  projectId: PUBLIC_SANITY_CMS_ID,
  dataset: "production",
  apiVersion: "2025-06-01",
  useCdn: false
});
async function getRecentOutcomes(worldAddress, limit = 50) {
  const query = `*[_type == "outcome" && worldAddress == $worldAddress] | order(_createdAt desc) [0...$limit] {
    _id,
    tripId,
    ratId,
    ratName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance,
    "tripPrompt": *[_type == "trip" && _id == ^.tripRef._ref][0].prompt
  }`;
  return sanityClient.fetch(query, { worldAddress, limit });
}
async function getAllOutcomesForWorld(worldAddress) {
  const query = `*[_type == "outcome" && worldAddress == $worldAddress] {
    _id,
    tripId,
    ratId,
    ratName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance
  }`;
  return sanityClient.fetch(query, { worldAddress });
}

// src/modules/trip-selector/historical.ts
function calculateScore(stats) {
  if (stats.survivals === 0) return -Infinity;
  return stats.survivalEv * (1 - stats.deathRate) * stats.activeRate;
}
async function selectWithClaude(anthropic, candidates, rat, inventoryDetails) {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) {
    return { selected: candidates[0], reasoning: "Only one candidate" };
  }
  const totalInventoryValue = inventoryDetails.reduce((sum, item) => sum + item.value, 0);
  let inventorySection = "";
  if (inventoryDetails.length > 0) {
    const itemsList = inventoryDetails.map((i) => `- ${i.name} (value: ${i.value})`).join("\n");
    inventorySection = `
## Current Inventory (${inventoryDetails.length} items)
${itemsList}
Total inventory value: ${totalInventoryValue}

**Strategic note**: You have items! Look for trips where these items provide an advantage. Match item names to trip themes (e.g., "torch" \u2192 dark/cave trips, "key" \u2192 locked areas, "weapon" \u2192 combat).
`;
  } else {
    inventorySection = `
## Current Inventory
**EMPTY** - The rat has no items.

**Strategic priority**: With an empty inventory, your TOP PRIORITY should be acquiring items. Look for trips mentioning treasure, loot, discoveries, or rewards. Build your toolkit before attempting high-risk ventures.
`;
  }
  const candidatesList = candidates.map((c, i) => {
    const survivalPct = (100 - c.deathRate * 100).toFixed(0);
    const evStr = c.survivalEv >= 0 ? `+${c.survivalEv.toFixed(1)}` : c.survivalEv.toFixed(1);
    return `${i + 1}. "${c.trip.prompt}"
   - Trip balance: ${c.trip.balance}
   - Survival rate: ${survivalPct}%
   - Expected value when surviving: ${evStr}
   - Historical outcomes: ${c.outcomes}
   - Score: ${c.score.toFixed(2)}`;
  }).join("\n\n");
  const prompt = `You are helping a rat choose the best trip using an ITEM ACCUMULATION STRATEGY.

## Core Strategy: Item Collection
Your PRIMARY goal is to accumulate items that unlock or improve outcomes in OTHER trips. Items are force multipliers - a rat with the right items can survive dangerous trips and extract maximum value.

## Rat Status
- Name: ${rat.name}
- Balance: ${rat.balance}
- Total value: ${rat.balance + totalInventoryValue}
${inventorySection}
## Candidate Trips
${candidatesList}

## Item Acquisition Priority (MOST IMPORTANT)
Think about trips in terms of their ITEM POTENTIAL:

1. **Trips that GIVE items**: Look for keywords suggesting item rewards:
   - "treasure", "chest", "loot", "find", "discover", "artifact", "relic"
   - "tool", "weapon", "key", "map", "potion", "scroll", "gem"
   - "reward", "prize", "gift", "equipment", "gear"
   These trips are HIGH PRIORITY even if the immediate value gain is lower.

2. **Items as prerequisites**: Many dangerous trips become safer with items:
   - Keys open locked doors/chests
   - Weapons help in combat encounters
   - Lights/torches help in dark places
   - Maps/compasses help in mazes/forests
   - Protective gear reduces death risk

3. **Build inventory BEFORE high-risk/high-reward trips**:
   - If you see a lucrative but dangerous trip, ask: "What item would help here?"
   - Then prioritize trips that might GIVE that item first
   - This is how you turn death traps into profitable ventures

## Decision Framework
1. **If inventory is EMPTY or LOW**: Prioritize item-acquisition trips above all else
   - Accept lower immediate value for trips that mention finding/discovering items
   - Build your toolkit before tackling dangerous high-value trips

2. **If inventory has useful items**: Look for trips where those items provide advantage
   - Match your items to trip requirements (torch \u2192 dark cave, key \u2192 locked door)
   - Now you can tackle higher-risk trips that others can't survive

3. **Score is secondary**: A trip with score +5 that gives an item beats a trip with score +15 that doesn't
   - Items compound value over multiple trips
   - Immediate value is one-time; items are reusable advantages

4. **Survival matters for item carriers**: If you have valuable items, be slightly more conservative
   - Dying loses all items - wasting the investment
   - But don't be too timid - items exist to be used

## AVOID: Gambling & Chance-Based Trips
**STRONGLY DEPRIORITIZE** trips that rely on pure luck/gambling. Watch for keywords:
- "gamble", "bet", "wager", "casino", "dice", "cards", "slots", "roulette"
- "flip a coin", "roll", "spin", "chance", "lucky", "fortune", "lottery"
- "all or nothing", "double or nothing", "50/50"

Why avoid gambling trips:
- Outcomes are random - items and strategy provide NO advantage
- Can't improve odds through preparation or inventory
- High variance wastes runs that could build inventory
- Even "good odds" gambling is worse than strategic item accumulation

Exception: Only consider gambling trips if ALL other options are worse (very low survival or negative scores)

## Response
Choose the trip that best serves the ITEM ACCUMULATION STRATEGY.

Respond with JSON only:
\`\`\`json
{
  "choice": 1,
  "reasoning": "Brief explanation focusing on item strategy"
}
\`\`\``;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      temperature: 1,
      messages: [{ role: "user", content: prompt }]
    });
    const content = response.content[0];
    if (content.type !== "text") return null;
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
    const parsed = JSON.parse(jsonText.trim());
    const choiceIndex = (parsed.choice || 1) - 1;
    if (choiceIndex >= 0 && choiceIndex < candidates.length) {
      return {
        selected: candidates[choiceIndex],
        reasoning: parsed.reasoning || "Claude selection"
      };
    }
  } catch (error) {
    console.warn("[Claude] Failed to select from shortlist:", error);
  }
  return null;
}
async function selectTripHistorical(trips, worldAddress, anthropic, rat, inventoryDetails = []) {
  if (trips.length === 0) return null;
  const allOutcomes = await getAllOutcomesForWorld(worldAddress);
  console.log(`Fetched ${allOutcomes.length} total outcomes from CMS`);
  const tripIdSet = new Set(trips.map((t) => t.id.toLowerCase()));
  const outcomes = allOutcomes.filter(
    (o) => tripIdSet.has(o.tripId.toLowerCase()) && o.ratValueChange !== void 0 && o.ratValueChange !== null
  );
  console.log(`${outcomes.length} valid outcomes match ${trips.length} available trips`);
  const statsByTrip = /* @__PURE__ */ new Map();
  for (const trip of trips) {
    statsByTrip.set(trip.id.toLowerCase(), {
      trip,
      outcomes: 0,
      survivals: 0,
      wins: 0,
      losses: 0,
      zeros: 0,
      deaths: 0,
      survivalValue: 0,
      survivalEv: 0,
      winRate: 0,
      deathRate: 0,
      activeRate: 0,
      score: -Infinity
    });
  }
  for (const outcome of outcomes) {
    const key = outcome.tripId.toLowerCase();
    const stats = statsByTrip.get(key);
    if (!stats) continue;
    stats.outcomes++;
    const isDeath = (outcome.newRatBalance ?? -1) === 0 && (outcome.oldRatBalance ?? 0) > 0;
    if (isDeath) {
      stats.deaths++;
    } else {
      stats.survivals++;
      stats.survivalValue += outcome.ratValueChange;
      if (outcome.ratValueChange > 0) {
        stats.wins++;
      } else if (outcome.ratValueChange < 0) {
        stats.losses++;
      } else {
        stats.zeros++;
      }
    }
  }
  for (const stats of statsByTrip.values()) {
    if (stats.outcomes > 0) {
      stats.deathRate = stats.deaths / stats.outcomes;
      if (stats.survivals > 0) {
        stats.survivalEv = stats.survivalValue / stats.survivals;
        stats.winRate = stats.wins / stats.survivals;
        stats.activeRate = (stats.wins + stats.losses) / stats.survivals;
      }
      stats.score = calculateScore(stats);
    }
  }
  const allTripsWithData = Array.from(statsByTrip.values()).filter((s) => s.outcomes >= 1).sort((a, b) => b.score - a.score);
  console.log(`
ALL ${allTripsWithData.length} trips with scores (score = survivalEv \xD7 (1-deathRate) \xD7 activeRate):`);
  allTripsWithData.forEach((s, i) => {
    const evStr2 = s.survivalEv >= 0 ? `+${s.survivalEv.toFixed(1)}` : s.survivalEv.toFixed(1);
    const deathPct = (s.deathRate * 100).toFixed(0);
    const winPct2 = (s.winRate * 100).toFixed(0);
    const activePct = (s.activeRate * 100).toFixed(0);
    const survivalPct2 = (100 - s.deathRate * 100).toFixed(0);
    const tripDesc = s.trip.prompt.slice(0, 20).padEnd(20);
    console.log(`  ${i + 1}. "${tripDesc}" score: ${s.score.toFixed(2)}, survEV: ${evStr2}, survival: ${survivalPct2}%, active: ${activePct}%, win: ${winPct2}%, n=${s.outcomes}`);
  });
  const validTrips = allTripsWithData.filter((s) => s.score > 0 && s.deathRate <= 0.7);
  console.log(`
Valid trips (score > 0, survival >= 30%): ${validTrips.length}`);
  if (validTrips.length === 0) {
    if (allTripsWithData.length > 0) {
      console.log("Using fallback (ignoring death filter)");
      const best = allTripsWithData[0];
      const evStr2 = best.survivalEv >= 0 ? `+${best.survivalEv.toFixed(1)}` : best.survivalEv.toFixed(1);
      const survivalPct2 = (100 - best.deathRate * 100).toFixed(0);
      return {
        trip: best.trip,
        explanation: `Fallback: score ${best.score.toFixed(2)}, survEV ${evStr2}, ${survivalPct2}% survival (${best.outcomes} outcomes)`
      };
    }
    console.log("No trips with data found!");
    return null;
  }
  const candidates = Array.from(statsByTrip.values());
  const poolSource = `all ${candidates.length} available trips`;
  let selected;
  let selectionSource;
  if (anthropic && rat && candidates.length > 1) {
    console.log(`[Claude] Selecting from ${candidates.length} candidates...`);
    const claudeResult = await selectWithClaude(anthropic, candidates, rat, inventoryDetails);
    if (claudeResult) {
      selected = claudeResult.selected;
      selectionSource = `Claude (${poolSource}): ${claudeResult.reasoning}`;
      console.log(`[Claude] Selected: "${selected.trip.prompt.slice(0, 30)}..."`);
    } else {
      const randomIndex = Math.floor(Math.random() * candidates.length);
      selected = candidates[randomIndex];
      selectionSource = `random from ${poolSource} (Claude failed)`;
    }
  } else {
    const randomIndex = Math.floor(Math.random() * candidates.length);
    selected = candidates[randomIndex];
    selectionSource = `random from ${poolSource}`;
  }
  const evStr = selected.survivalEv >= 0 ? `+${selected.survivalEv.toFixed(1)}` : selected.survivalEv.toFixed(1);
  const survivalPct = (100 - selected.deathRate * 100).toFixed(0);
  const winPct = (selected.winRate * 100).toFixed(0);
  const explanation = `${selectionSource}: score ${selected.score.toFixed(2)}, survEV ${evStr}, ${winPct}% wins, ${survivalPct}% survival (${selected.outcomes} outcomes)`;
  console.log(`Selected via ${selectionSource}`);
  return {
    trip: selected.trip,
    explanation
  };
}

// src/modules/trip-selector/scalper.ts
var state = {
  currentTripId: null,
  currentTripPrompt: null,
  lastValueChange: null,
  lastOutcomeLog: null,
  unprofitableTrips: /* @__PURE__ */ new Set()
};
function updateScalperState(tripId, tripPrompt, valueChange, outcomeLog) {
  state.currentTripId = tripId;
  state.currentTripPrompt = tripPrompt;
  state.lastValueChange = valueChange;
  state.lastOutcomeLog = outcomeLog;
  if (valueChange <= 0) {
    state.unprofitableTrips.add(tripId);
    console.log(`[Scalper] Marked trip as unprofitable (${state.unprofitableTrips.size} total blacklisted)`);
  }
  console.log(`[Scalper] Updated state: trip=${tripId.slice(0, 10)}..., valueChange=${valueChange}`);
}
function resetScalperState() {
  state.currentTripId = null;
  state.currentTripPrompt = null;
  state.lastValueChange = null;
  state.lastOutcomeLog = null;
  state.unprofitableTrips.clear();
  console.log("[Scalper] State reset (cleared unprofitable trips list)");
}
async function selectWithClaude2(anthropic, trips, rat, inventoryDetails) {
  if (trips.length === 0) return null;
  if (trips.length === 1) {
    return { selected: trips[0], reasoning: "Only one new trip available" };
  }
  const totalInventoryValue = inventoryDetails.reduce((sum, item) => sum + item.value, 0);
  let inventorySection = "";
  if (inventoryDetails.length > 0) {
    const itemsList = inventoryDetails.map((i) => `- ${i.name} (value: ${i.value})`).join("\n");
    inventorySection = `
## Current Inventory (${inventoryDetails.length} items)
${itemsList}
Total inventory value: ${totalInventoryValue}
`;
  } else {
    inventorySection = `
## Current Inventory
**EMPTY** - The rat has no items.
`;
  }
  let lastOutcomeSection = "";
  if (state.lastOutcomeLog && state.lastOutcomeLog.length > 0 && state.currentTripPrompt) {
    const outcomeText = state.lastOutcomeLog.join("\n");
    const profitStatus = state.lastValueChange !== null ? state.lastValueChange > 0 ? `+${state.lastValueChange} (profitable)` : `${state.lastValueChange} (not profitable)` : "unknown";
    lastOutcomeSection = `
## Last Trip Outcome
**Trip:** "${state.currentTripPrompt}"
**Result:** ${profitStatus}
**Log:**
${outcomeText}
`;
  }
  const tripsList = trips.map((t, i) => {
    return `${i + 1}. "${t.prompt}"
   - Balance: ${t.balance}
   - Visit count: ${t.visitCount}
   - Kill count: ${t.killCount}`;
  }).join("\n\n");
  const prompt = `You are helping a rat choose the best trip to scalp.

## Strategy: Scalping Newest Trips
You're targeting the newest trips. The goal is to find underexplored opportunities before other players discover them.
${lastOutcomeSection}
## Rat Status
- Name: ${rat.name}
- Balance: ${rat.balance}
- Total value: ${rat.balance + totalInventoryValue}
${inventorySection}
## Available Trips (${trips.length} newest trips)
${tripsList}

## Selection Criteria
1. **Low visit/kill counts are good** - Less explored means more potential
2. **Higher balance is attractive** - More rewards available
3. **Read the prompt carefully** - Avoid obvious death traps
4. **Match inventory to trip theme** - Use items you have for advantage
5. **Avoid gambling/chance trips** - Pure luck doesn't benefit from strategy

## Response
Choose the best trip for scalping.

Respond with JSON only:
\`\`\`json
{
  "choice": 1,
  "reasoning": "Brief explanation"
}
\`\`\``;
  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 200,
      temperature: 1,
      messages: [{ role: "user", content: prompt }]
    });
    const content = response.content[0];
    if (content.type !== "text") return null;
    let jsonText = content.text.trim();
    if (jsonText.startsWith("```json")) jsonText = jsonText.slice(7);
    if (jsonText.startsWith("```")) jsonText = jsonText.slice(3);
    if (jsonText.endsWith("```")) jsonText = jsonText.slice(0, -3);
    const parsed = JSON.parse(jsonText.trim());
    const choiceIndex = (parsed.choice || 1) - 1;
    if (choiceIndex >= 0 && choiceIndex < trips.length) {
      return {
        selected: trips[choiceIndex],
        reasoning: parsed.reasoning || "Claude selection"
      };
    }
  } catch (error) {
    console.warn("[Scalper] Claude selection failed:", error);
  }
  return null;
}
async function selectTripScalper(options) {
  const {
    trips,
    currentBlockNumber,
    anthropic,
    rat,
    inventoryDetails = [],
    newestCount = 10
  } = options;
  if (trips.length === 0) return null;
  const sortedByCreation = [...trips].sort((a, b) => b.creationBlock - a.creationBlock);
  const newestTrips = sortedByCreation.slice(0, newestCount);
  const eligibleTrips = newestTrips.filter((t) => !state.unprofitableTrips.has(t.id));
  if (state.unprofitableTrips.size > 0) {
    console.log(`[Scalper] Excluding ${newestTrips.length - eligibleTrips.length} unprofitable trips`);
  }
  if (eligibleTrips.length === 0) {
    console.log("[Scalper] All newest trips are blacklisted, no eligible trips");
    return null;
  }
  console.log(`[Scalper] Selecting from ${eligibleTrips.length} eligible trips (of ${trips.length} total):`);
  eligibleTrips.forEach((t) => {
    const ageBlocks = currentBlockNumber - t.creationBlock;
    const ageMinutes = Math.round(ageBlocks * 2 / 60);
    console.log(
      `  - "${t.prompt.slice(0, 30)}..." (${ageMinutes}m old, ${t.visitCount} visits, balance: ${t.balance})`
    );
  });
  if (state.currentTripId !== null && state.lastValueChange !== null && state.lastValueChange > 0) {
    const currentTrip = eligibleTrips.find((t) => t.id === state.currentTripId);
    if (currentTrip) {
      console.log(
        `[Scalper] Sticking with profitable trip: "${currentTrip.prompt.slice(0, 30)}..." (last: +${state.lastValueChange})`
      );
      return {
        trip: currentTrip,
        explanation: `Scalper: continuing profitable trip (last: +${state.lastValueChange})`
      };
    }
    console.log("[Scalper] Previous trip no longer in eligible pool, selecting new");
  } else if (state.currentTripId !== null && state.lastValueChange !== null) {
    console.log(`[Scalper] Previous trip was not profitable (${state.lastValueChange}), switching`);
  }
  console.log(`[Scalper] Asking Claude to select from ${eligibleTrips.length} eligible trips...`);
  const claudeResult = await selectWithClaude2(anthropic, eligibleTrips, rat, inventoryDetails);
  if (claudeResult) {
    const { selected: selected2, reasoning } = claudeResult;
    state.currentTripId = selected2.id;
    state.lastValueChange = null;
    const ageBlocks = currentBlockNumber - selected2.creationBlock;
    const ageMinutes = Math.round(ageBlocks * 2 / 60);
    console.log(`[Scalper] Claude selected: "${selected2.prompt.slice(0, 30)}..."`);
    return {
      trip: selected2,
      explanation: `Scalper (Claude): ${reasoning} (${ageMinutes}m old, ${selected2.visitCount} visits)`
    };
  }
  console.log("[Scalper] Claude failed, falling back to random selection");
  const randomIndex = Math.floor(Math.random() * eligibleTrips.length);
  const selected = eligibleTrips[randomIndex];
  state.currentTripId = selected.id;
  state.lastValueChange = null;
  return {
    trip: selected,
    explanation: `Scalper (random fallback): ${selected.visitCount} visits, balance ${selected.balance}`
  };
}

// src/modules/trip-selector/index.ts
async function selectTrip(configOrOptions, trips, rat, anthropic, inventoryDetails = [], worldAddress) {
  let config;
  let tripsArray;
  let ratObj;
  let anthropicClient;
  let inventory;
  let worldAddr;
  let currentBlock;
  if ("config" in configOrOptions) {
    config = configOrOptions.config;
    tripsArray = configOrOptions.trips;
    ratObj = configOrOptions.rat;
    anthropicClient = configOrOptions.anthropic;
    inventory = configOrOptions.inventoryDetails ?? [];
    worldAddr = configOrOptions.worldAddress;
    currentBlock = configOrOptions.currentBlockNumber;
  } else {
    config = configOrOptions;
    tripsArray = trips;
    ratObj = rat;
    anthropicClient = anthropic;
    inventory = inventoryDetails;
    worldAddr = worldAddress;
  }
  if (tripsArray.length === 0) {
    return null;
  }
  if (config.tripSelector === "claude" && anthropicClient) {
    console.log("Using Claude AI to select trip...");
    let recentOutcomes = [];
    if (worldAddr) {
      try {
        console.log("Fetching recent outcomes from CMS...");
        recentOutcomes = await getRecentOutcomes(worldAddr, 50);
        console.log(`Fetched ${recentOutcomes.length} recent outcomes`);
      } catch (error) {
        console.warn("Failed to fetch recent outcomes:", error);
      }
    }
    return selectTripWithClaude(anthropicClient, tripsArray, ratObj, inventory, recentOutcomes);
  } else if (config.tripSelector === "random") {
    console.log("Using random selection...");
    const trip = selectTripRandom(tripsArray);
    if (!trip) return null;
    return {
      trip,
      explanation: "Selected trip randomly"
    };
  } else if (config.tripSelector === "historical" && worldAddr) {
    console.log("Using historical data from CMS to select trip...");
    return selectTripHistorical(tripsArray, worldAddr, anthropicClient, ratObj, inventory);
  } else if (config.tripSelector === "scalper" && anthropicClient && currentBlock) {
    console.log("Using scalper strategy (target trips created in last hour)...");
    return selectTripScalper({
      trips: tripsArray,
      currentBlockNumber: currentBlock,
      anthropic: anthropicClient,
      rat: ratObj,
      inventoryDetails: inventory
    });
  } else {
    console.log("Using heuristic (highest balance) to select trip...");
    const trip = selectTripHeuristic(tripsArray);
    if (!trip) return null;
    return {
      trip,
      explanation: "Selected trip with highest balance"
    };
  }
}

// src/modules/utils.ts
function addressToId(address) {
  if (!address) return "0x0";
  return "0x" + address.slice(2).padStart(64, "0").toLowerCase();
}
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function retryUntilResult(fn, timeoutMs = 5e3, retryIntervalMs = 100, condition) {
  const startTime = Date.now();
  while (Date.now() - startTime < timeoutMs) {
    const result = fn();
    const isValid = condition ? condition(result) : Boolean(result);
    if (isValid) {
      return result;
    }
    await sleep(retryIntervalMs);
  }
  return null;
}

// src/modules/logger.ts
var colors = {
  reset: "\x1B[0m",
  bright: "\x1B[1m",
  dim: "\x1B[2m",
  red: "\x1B[31m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  blue: "\x1B[34m",
  magenta: "\x1B[35m",
  cyan: "\x1B[36m"
};
function logInfo(message) {
  console.log(`${colors.cyan}[INFO]${colors.reset} ${message}`);
}
function logSuccess(message) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`);
}
function logWarning(message) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`);
}
function logError(message) {
  console.log(`${colors.red}[ERROR]${colors.reset} ${message}`);
}
function logTrip(tripNumber, message) {
  console.log(`${colors.magenta}[TRIP ${tripNumber}]${colors.reset} ${message}`);
}
function logRat(ratName, message) {
  console.log(`${colors.blue}[RAT: ${ratName}]${colors.reset} ${message}`);
}
function logDeath(ratName, tripCount) {
  console.log(`${colors.red}${colors.bright}`);
  console.log(`==========================================`);
  console.log(`  RAT "${ratName}" HAS DIED`);
  console.log(`  Survived ${tripCount} trips`);
  console.log(`==========================================`);
  console.log(`${colors.reset}`);
}
function logStats(stats) {
  const profitLoss = stats.finalBalance - stats.startingBalance;
  const profitLossColor = profitLoss >= 0 ? colors.green : colors.red;
  console.log(`${colors.bright}`);
  console.log(`==========================================`);
  console.log(`  RUN STATISTICS`);
  console.log(`==========================================`);
  console.log(`${colors.reset}`);
  console.log(`  Rat Name:        ${stats.ratName}`);
  console.log(`  Total Trips:     ${stats.totalTrips}`);
  console.log(`  Starting Balance: ${stats.startingBalance}`);
  console.log(`  Final Balance:    ${stats.finalBalance}`);
  console.log(
    `  ${profitLossColor}Profit/Loss:     ${profitLoss >= 0 ? "+" : ""}${profitLoss}${colors.reset}`
  );
  console.log(``);
}
function logSessionStats(stats) {
  const profitLossColor = stats.totalProfitLoss >= 0 ? colors.green : colors.red;
  console.log(`${colors.bright}${colors.cyan}`);
  console.log(`==========================================`);
  console.log(`  SESSION STATISTICS`);
  console.log(`==========================================`);
  console.log(`${colors.reset}`);
  console.log(`  Total Rats:      ${stats.totalRats}`);
  console.log(`  Total Trips:     ${stats.totalTrips}`);
  console.log(
    `  ${profitLossColor}Total P/L:       ${stats.totalProfitLoss >= 0 ? "+" : ""}${stats.totalProfitLoss}${colors.reset}`
  );
  console.log(``);
}
function logValueBar(options) {
  const { currentValue, liquidateBelowValue, liquidateAtValue } = options;
  if (liquidateBelowValue === void 0 && liquidateAtValue === void 0) {
    return;
  }
  const barWidth = 40;
  const minValue = liquidateBelowValue ?? 0;
  const maxValue = liquidateAtValue ?? currentValue * 1.5;
  const range = maxValue - minValue;
  const position = range > 0 ? Math.max(0, Math.min(1, (currentValue - minValue) / range)) : 0.5;
  const filledWidth = Math.round(position * barWidth);
  const filledPart = "\u2588".repeat(filledWidth);
  const emptyPart = "\u2591".repeat(barWidth - filledWidth);
  let barColor;
  if (position < 0.2) {
    barColor = colors.red;
  } else if (position < 0.4) {
    barColor = colors.yellow;
  } else if (position > 0.9) {
    barColor = colors.green;
  } else {
    barColor = colors.cyan;
  }
  const leftLabel = liquidateBelowValue !== void 0 ? `${liquidateBelowValue}` : "0";
  const rightLabel = liquidateAtValue !== void 0 ? `${liquidateAtValue}` : "\u221E";
  console.log(
    `${colors.dim}[VALUE]${colors.reset} ${leftLabel} ${barColor}${filledPart}${colors.dim}${emptyPart}${colors.reset} ${rightLabel} (${currentValue})`
  );
}

// src/bot.ts
async function liquidateRat(mud) {
  console.log("Liquidating rat...");
  const tx = await mud.worldContract.write.ratfun__liquidateRat();
  console.log(`Liquidate transaction sent: ${tx}`);
  await mud.waitForTransaction(tx);
  console.log("Rat liquidated successfully!");
  return tx;
}
async function runBot(config) {
  logInfo("Starting Rattus Bot...");
  logInfo(`Chain ID: ${config.chainId}`);
  logInfo(`Server URL: ${config.serverUrl}`);
  logInfo(`Trip selector: ${config.tripSelector}`);
  logInfo(`Auto-respawn: ${config.autoRespawn}`);
  if (config.liquidateAtValue) {
    logInfo(`Liquidate at value: ${config.liquidateAtValue}`);
  }
  if (config.liquidateBelowValue) {
    logInfo(`Liquidate below value: ${config.liquidateBelowValue}`);
  }
  let anthropic;
  if (config.tripSelector === "claude" || config.tripSelector === "historical" || config.tripSelector === "scalper") {
    anthropic = new Anthropic({ apiKey: config.anthropicApiKey });
    logInfo("Claude API client initialized");
  }
  logInfo("Setting up MUD connection...");
  const mud = await setupMud(config.privateKey, config.chainId, config.worldAddress);
  logSuccess("MUD setup complete!");
  logInfo("Waiting for state sync...");
  await sleep(2e3);
  const walletAddress = mud.walletClient.account.address;
  const playerId = addressToId(walletAddress);
  logInfo(`Wallet address: ${walletAddress}`);
  logInfo(`Player ID: ${playerId}`);
  logInfo("Checking player status...");
  let player = await retryUntilResult(() => getPlayer(mud, playerId), 5e3, 500);
  if (!player) {
    logInfo("Player not found, spawning...");
    await spawn(mud, config.ratName);
    logInfo("Waiting for player to sync...");
    player = await retryUntilResult(() => getPlayer(mud, playerId), 1e4, 500);
    if (!player) {
      throw new Error("Failed to create player - timeout waiting for sync");
    }
    logSuccess(`Player spawned: ${player.name}`);
  } else {
    logSuccess(`Player found: ${player.name}`);
  }
  logInfo("Checking token allowance...");
  const gameConfig = getGameConfig(mud);
  const allowance = await getAllowance(mud, walletAddress);
  const requiredAllowance = BigInt(gameConfig.ratCreationCost) * BigInt(10 ** 18);
  if (allowance < requiredAllowance) {
    logWarning("Insufficient token allowance, approving max...");
    await approveMaxTokens(mud);
    logSuccess("Token allowance approved!");
  } else {
    logSuccess("Token allowance sufficient");
  }
  logInfo("Checking rat status...");
  let rat = null;
  let ratId = player.currentRat;
  if (ratId) {
    rat = getRat(mud, ratId);
    if (rat && !rat.dead) {
      logSuccess(`Found live rat: ${rat.name} (balance: ${rat.balance})`);
    } else if (rat?.dead) {
      logWarning(`Rat ${rat.name} is dead`);
      rat = null;
      ratId = null;
    }
  }
  if (!rat) {
    logInfo(`Creating new rat: ${config.ratName}...`);
    await createRat(mud, config.ratName);
    logInfo("Waiting for rat to sync...");
    await sleep(3e3);
    player = getPlayer(mud, playerId);
    if (player?.currentRat) {
      ratId = player.currentRat;
      rat = await retryUntilResult(() => getRat(mud, ratId), 1e4, 500);
    }
    if (!rat) {
      throw new Error("Failed to create rat - timeout waiting for sync");
    }
    logSuccess(`Rat created: ${rat.name} (balance: ${rat.balance})`);
  }
  let tripCount = 0;
  let startingBalance = rat.balance;
  let startingRatName = rat.name;
  let sessionTotalRats = 1;
  let sessionTotalTrips = 0;
  let sessionTotalProfitLoss = 0;
  logInfo("Starting main loop...");
  logInfo("==========================================");
  while (true) {
    if (config.liquidateAtValue && rat) {
      const totalValue = getRatTotalValue(mud, rat);
      if (totalValue >= config.liquidateAtValue) {
        logSuccess(
          `Rat value (${totalValue}) reached liquidation threshold (${config.liquidateAtValue})!`
        );
        sessionTotalTrips += tripCount;
        sessionTotalProfitLoss += totalValue - startingBalance;
        logStats({
          ratName: rat.name,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: totalValue
        });
        logSessionStats({
          totalRats: sessionTotalRats,
          totalTrips: sessionTotalTrips,
          totalProfitLoss: sessionTotalProfitLoss
        });
        await liquidateRat(mud);
        logSuccess("Rat liquidated! Creating new rat...");
        await createRat(mud, config.ratName);
        await sleep(3e3);
        player = getPlayer(mud, playerId);
        if (player?.currentRat) {
          ratId = player.currentRat;
          rat = await retryUntilResult(() => getRat(mud, ratId), 1e4, 500);
        }
        if (!rat) {
          throw new Error("Failed to create new rat after liquidation");
        }
        logSuccess(`New rat created: ${rat.name} (balance: ${rat.balance})`);
        sessionTotalRats++;
        startingBalance = rat.balance;
        startingRatName = rat.name;
        tripCount = 0;
        continue;
      }
    }
    if (config.liquidateBelowValue && rat) {
      const totalValue = getRatTotalValue(mud, rat);
      if (totalValue < config.liquidateBelowValue) {
        logWarning(`Rat value (${totalValue}) fell below threshold (${config.liquidateBelowValue})`);
        sessionTotalTrips += tripCount;
        sessionTotalProfitLoss += totalValue - startingBalance;
        logStats({
          ratName: rat.name,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: totalValue
        });
        logSessionStats({
          totalRats: sessionTotalRats,
          totalTrips: sessionTotalTrips,
          totalProfitLoss: sessionTotalProfitLoss
        });
        await liquidateRat(mud);
        logInfo("Rat liquidated due to low value. Creating new rat...");
        await createRat(mud, config.ratName);
        await sleep(3e3);
        player = getPlayer(mud, playerId);
        if (player?.currentRat) {
          ratId = player.currentRat;
          rat = await retryUntilResult(() => getRat(mud, ratId), 1e4, 500);
        }
        if (!rat) {
          throw new Error("Failed to create new rat after liquidation");
        }
        logSuccess(`New rat created: ${rat.name} (balance: ${rat.balance})`);
        sessionTotalRats++;
        startingBalance = rat.balance;
        startingRatName = rat.name;
        tripCount = 0;
        continue;
      }
    }
    const trips = getAvailableTrips(mud);
    logInfo(`Found ${trips.length} available trips`);
    if (trips.length === 0) {
      logWarning("No trips available, waiting 10 seconds...");
      await sleep(1e4);
      continue;
    }
    const enterableTrips = trips.filter((trip) => canRatEnterTrip(mud, rat, trip));
    logInfo(`${enterableTrips.length} trips are enterable with current rat value`);
    if (enterableTrips.length === 0) {
      logWarning("Rat value too low to enter any trips, waiting 10 seconds...");
      await sleep(1e4);
      continue;
    }
    const worldAddress = mud.worldContract.address;
    const inventoryDetails = getInventoryDetails(mud, rat);
    const currentBlockNumber = Number(await mud.publicClient.getBlockNumber());
    const selection = await selectTrip({
      config,
      trips: enterableTrips,
      rat,
      anthropic,
      inventoryDetails,
      worldAddress,
      currentBlockNumber
    });
    if (!selection) {
      if (config.tripSelector === "scalper") {
        logInfo("No new trips available (created in last hour), waiting 30 seconds...");
        await sleep(3e4);
      } else {
        logError("Failed to select a trip");
        await sleep(5e3);
      }
      continue;
    }
    const { trip: selectedTrip, explanation } = selection;
    tripCount++;
    logTrip(tripCount, `Entering: "${selectedTrip.prompt.slice(0, 60)}..."`);
    logTrip(tripCount, `Trip balance: ${selectedTrip.balance}`);
    logInfo(`Selection reason: ${explanation}`);
    const totalValueBefore = getRatTotalValue(mud, rat);
    try {
      const outcome = await enterTrip(config.serverUrl, mud.walletClient, selectedTrip.id, rat.id);
      const logEntries = [];
      if (outcome.log && outcome.log.length > 0) {
        console.log("");
        for (const entry of outcome.log) {
          console.log(`  ${entry.event}`);
          logEntries.push(entry.event);
        }
        console.log("");
      }
      if (outcome.ratDead) {
        logDeath(rat.name, tripCount);
        if (config.tripSelector === "scalper") {
          resetScalperState();
        }
        sessionTotalTrips += tripCount;
        sessionTotalProfitLoss += 0 - startingBalance;
        logStats({
          ratName: startingRatName,
          totalTrips: tripCount,
          startingBalance,
          finalBalance: 0
        });
        logSessionStats({
          totalRats: sessionTotalRats,
          totalTrips: sessionTotalTrips,
          totalProfitLoss: sessionTotalProfitLoss
        });
        if (config.autoRespawn) {
          logInfo("Auto-respawn enabled, creating new rat...");
          await createRat(mud, config.ratName);
          await sleep(3e3);
          player = getPlayer(mud, playerId);
          if (player?.currentRat) {
            ratId = player.currentRat;
            rat = await retryUntilResult(() => getRat(mud, ratId), 1e4, 500);
          }
          if (!rat) {
            throw new Error("Failed to create new rat after death");
          }
          logSuccess(`New rat created: ${rat.name} (balance: ${rat.balance})`);
          sessionTotalRats++;
          startingBalance = rat.balance;
          startingRatName = rat.name;
          tripCount = 0;
        } else {
          logInfo("Auto-respawn disabled, exiting...");
          break;
        }
      } else {
        await sleep(2e3);
        rat = getRat(mud, rat.id);
        if (rat) {
          const totalValueAfter = getRatTotalValue(mud, rat);
          const valueChange = totalValueAfter - totalValueBefore;
          const changeStr = valueChange >= 0 ? `+${valueChange}` : `${valueChange}`;
          const inventoryItems = getInventoryDetails(mud, rat);
          const inventoryStr = inventoryItems.length > 0 ? `, Inventory: [${inventoryItems.map((i) => `${i.name}(${i.value})`).join(", ")}]` : "";
          logRat(
            rat.name,
            `Balance: ${rat.balance}, Total Value: ${totalValueAfter} (${changeStr}), Trips: ${tripCount}${inventoryStr}`
          );
          if (config.tripSelector === "scalper") {
            updateScalperState(selectedTrip.id, selectedTrip.prompt, valueChange, logEntries);
          }
          logValueBar({
            currentValue: totalValueAfter,
            liquidateBelowValue: config.liquidateBelowValue,
            liquidateAtValue: config.liquidateAtValue
          });
        }
      }
      await sleep(2e3);
    } catch (error) {
      logError(`Failed to enter trip: ${error instanceof Error ? error.message : String(error)}`);
      await sleep(5e3);
    }
  }
  logInfo("Bot stopped.");
}

// src/config.ts
function getServerUrl(chainId) {
  switch (chainId) {
    case 8453:
      return "https://base.rat-fun-server.com";
    case 84532:
      return "https://base-sepolia.rat-fun-server.com";
    default:
      return "http://localhost:3131";
  }
}
function loadConfig(opts) {
  const chainId = Number(opts.chain || process.env.CHAIN_ID || "84532");
  let privateKey = process.env.PRIVATE_KEY;
  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is required");
  }
  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`;
  }
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error(
      "Invalid PRIVATE_KEY format. Expected 32 bytes hex string (64 hex chars, optionally prefixed with 0x)"
    );
  }
  const anthropicApiKey = process.env.ANTHROPIC_API_KEY;
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required");
  }
  const liquidateAtEnv = process.env.LIQUIDATE_AT_VALUE;
  const liquidateAtOpt = opts.liquidateAt;
  const liquidateAtValue = liquidateAtOpt ? Number(liquidateAtOpt) : liquidateAtEnv ? Number(liquidateAtEnv) : void 0;
  const liquidateBelowEnv = process.env.LIQUIDATE_BELOW_VALUE;
  const liquidateBelowOpt = opts.liquidateBelow;
  const liquidateBelowValue = liquidateBelowOpt ? Number(liquidateBelowOpt) : liquidateBelowEnv ? Number(liquidateBelowEnv) : void 0;
  return {
    privateKey,
    anthropicApiKey,
    chainId,
    serverUrl: process.env.SERVER_URL || getServerUrl(chainId),
    tripSelector: opts.selector || process.env.TRIP_SELECTOR || "claude",
    autoRespawn: opts.autoRespawn ?? process.env.AUTO_RESPAWN === "true",
    ratName: opts.name || process.env.RAT_NAME || "RattusBot",
    worldAddress: process.env.WORLD_ADDRESS,
    rpcHttpUrl: process.env.RPC_HTTP_URL,
    liquidateAtValue,
    liquidateBelowValue
  };
}

// src/index.ts
var program = new Command().name("rattus-bot").description("Autonomous rat.fun player bot").version("1.0.0").option("-c, --chain <id>", "Chain ID (8453=Base, 84532=Base Sepolia, 31337=local)").option("-s, --selector <type>", "Trip selector: claude, heuristic, random, historical, scalper").option("-r, --auto-respawn", "Automatically create new rat on death").option("-n, --name <name>", "Name for the rat").option("-l, --liquidate-at <value>", "Liquidate rat when total value reaches this threshold").option(
  "-b, --liquidate-below <value>",
  "Liquidate rat when total value falls below this threshold"
).action(async (options) => {
  try {
    const config = loadConfig({
      chain: options.chain,
      selector: options.selector,
      autoRespawn: options.autoRespawn,
      name: options.name,
      liquidateAt: options.liquidateAt,
      liquidateBelow: options.liquidateBelow
    });
    await runBot(config);
  } catch (error) {
    console.error("Fatal error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
});
program.parse();
//# sourceMappingURL=index.js.map