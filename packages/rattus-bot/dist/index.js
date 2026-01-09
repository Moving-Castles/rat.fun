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
  const { EntityType, Balance, Prompt, TripCreationCost, Owner, VisitCount, KillCount } = mud.components;
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
        trips.push({
          id: entityId,
          prompt,
          balance,
          tripCreationCost,
          owner,
          visitCount,
          killCount
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
async function selectTripWithClaude(anthropic, trips, rat, outcomeHistory = []) {
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
  let historySection = "";
  if (outcomeHistory.length > 0) {
    const availableTripIds = new Set(trips.map((t) => t.id));
    const relevantHistory = outcomeHistory.filter((h) => availableTripIds.has(h.tripId)).slice(-10);
    if (relevantHistory.length > 0) {
      historySection = `
## Previous Trip Outcomes (for learning)
Here are the outcomes of recent trips this rat has taken on currently available trips. Use this to inform your strategy:
${JSON.stringify(relevantHistory, null, 2)}

Note: valueChange represents the change in TOTAL VALUE (balance + inventory items). This is the key success metric.

Analyze patterns:
\u2013 If rat died or lost a lot of value in a trip, do not re-enter unless there is very clear ground to assume the outcome will be different this time.
- Which types of trip prompts led to positive vs negative valueChange?
- How do items gained/lost affect total value?
- What scenarios were dangerous (led to death or large value losses)?
- What strategies seem to work best?
- health, token, cash, money, points etc all mean the same thing and are interchangeable. exhanging one for the other 1:1 is pointless.
`;
    }
  }
  const prompt = `You are an AI strategist helping a rat named "${rat.name}" choose which trip to enter in a game.

## Primary Goal
Your goal is to INCREASE the rat's TOTAL VALUE (balance + inventory item values). The rat gains value by completing trips that provide positive value changes - this includes gaining balance OR valuable items. Trips that result in 0 value change are wasteful - they risk death without any reward. Always prioritize trips likely to yield positive total value gains.

## Current Rat State
- Balance: ${rat.balance} credits
- Items in inventory: ${rat.inventory.length}
- Total trips survived: ${rat.tripCount}
${historySection}
## Available Trips
${JSON.stringify(tripsForPrompt, null, 2)}

## Your Task
Analyze each trip's prompt, balance, and statistics to maximize TOTAL VALUE gain. Consider:
1. Which trip is most likely to result in a POSITIVE value change (balance + items)? Avoid trips that seem likely to have no reward.
2. Which trip has the best risk/reward ratio? High balance trips often mean higher potential gains.
3. Based on the trip prompt, does it suggest opportunities for the rat to find loot, treasure, or rewards?
4. Avoid trips with prompts suggesting high danger with no clear reward opportunity.
5. Carefully evaluate if a trip requires the rat to have a particular item to succeed. Or if a particular item that the rat currently has gives it an advantage.
6. IMPORTANT: Use the trip statistics to assess danger:
   - survivalRate: Bayesian-weighted survival percentage (accounts for sample size uncertainty)
   - confidence: "high" (10+ visits), "medium" (5-9 visits), "low" (<5 visits)
   - Prefer trips with high survivalRate AND high confidence. Be cautious of "low" confidence trips - their survival rate is uncertain.
${outcomeHistory.length > 0 ? "6. What patterns from previous outcomes show which trip types yield gains vs losses or deaths?" : ""}

## Response Format
Respond with a JSON object containing:
- tripId: The full ID of your chosen trip
- explanation: A brief (1-2 sentence) explanation of why you chose this trip

Example:
\`\`\`json
{
  "tripId": "0x1234...",
  "explanation": "This trip offers high rewards with a relatively safe scenario based on the prompt."
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
async function getOutcomesForTrips(tripIds, worldAddress) {
  const query = `*[_type == "outcome" && tripId in $tripIds && worldAddress == $worldAddress] {
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
  return sanityClient.fetch(query, { tripIds, worldAddress });
}

// src/modules/trip-selector/historical.ts
function calculateTripStats(trips, outcomes) {
  const outcomesByTrip = /* @__PURE__ */ new Map();
  for (const outcome of outcomes) {
    const existing = outcomesByTrip.get(outcome.tripId) || [];
    existing.push(outcome);
    outcomesByTrip.set(outcome.tripId, existing);
  }
  return trips.map((trip) => {
    const tripOutcomes = outcomesByTrip.get(trip.id) || [];
    const totalOutcomes = tripOutcomes.length;
    if (totalOutcomes === 0) {
      return {
        tripId: trip.id,
        trip,
        totalOutcomes: 0,
        avgValueChange: 0,
        totalValueChange: 0,
        survivalRate: 0.5,
        // Unknown, assume 50%
        deaths: 0
      };
    }
    const totalValueChange = tripOutcomes.reduce((sum, o) => sum + (o.ratValueChange ?? 0), 0);
    const avgValueChange = totalValueChange / totalOutcomes;
    const deaths = tripOutcomes.filter(
      (o) => (o.newRatBalance ?? 0) === 0 && (o.oldRatBalance ?? 0) > 0
    ).length;
    const survivalRate = (totalOutcomes - deaths) / totalOutcomes;
    return {
      tripId: trip.id,
      trip,
      totalOutcomes,
      avgValueChange,
      totalValueChange,
      survivalRate,
      deaths
    };
  });
}
function scoreTrip(stats) {
  if (stats.totalOutcomes === 0) {
    return stats.trip.balance * 0.1;
  }
  const confidenceBonus = Math.min(stats.totalOutcomes / 20, 1) * 10;
  return stats.avgValueChange + confidenceBonus;
}
async function selectTripHistorical(trips, worldAddress) {
  if (trips.length === 0) return null;
  const tripIds = trips.map((t) => t.id);
  const outcomes = await getOutcomesForTrips(tripIds, worldAddress);
  const stats = calculateTripStats(trips, outcomes);
  const scoredTrips = stats.map((s) => ({
    stats: s,
    score: scoreTrip(s)
  }));
  scoredTrips.sort((a, b) => b.score - a.score);
  const best = scoredTrips[0];
  if (!best) return null;
  let explanation;
  if (best.stats.totalOutcomes === 0) {
    explanation = `No historical data, selected based on trip balance (${best.stats.trip.balance})`;
  } else {
    const avgStr = best.stats.avgValueChange >= 0 ? `+${best.stats.avgValueChange.toFixed(1)}` : best.stats.avgValueChange.toFixed(1);
    const survivalPct = (best.stats.survivalRate * 100).toFixed(0);
    explanation = `Best historical performance: avg ${avgStr} value change, ${survivalPct}% survival rate (${best.stats.totalOutcomes} outcomes)`;
  }
  return {
    trip: best.stats.trip,
    explanation
  };
}

// src/modules/trip-selector/graph/types.ts
var VALUE_BUCKET_RANGES = {
  very_low: { min: 0, max: 200 },
  low: { min: 200, max: 1e3 },
  medium: { min: 1e3, max: 3e3 },
  high: { min: 3e3, max: 1e4 },
  very_high: { min: 1e4, max: Infinity }
};

// src/modules/trip-selector/graph/statistics.ts
function getValueBucket(value) {
  for (const [bucket, range] of Object.entries(VALUE_BUCKET_RANGES)) {
    if (value >= range.min && value < range.max) {
      return bucket;
    }
  }
  return "very_high";
}
function median(values) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function stdDev(values, mean) {
  if (values.length < 2) return 0;
  const squaredDiffs = values.map((v) => Math.pow(v - mean, 2));
  return Math.sqrt(squaredDiffs.reduce((a, b) => a + b, 0) / values.length);
}
function normalizeOutcome(outcome) {
  return {
    ...outcome,
    inventoryOnEntrance: outcome.inventoryOnEntrance || [],
    itemChanges: outcome.itemChanges || [],
    itemsLostOnDeath: outcome.itemsLostOnDeath || [],
    died: outcome.newRatBalance === 0 && outcome.oldRatBalance > 0,
    survived: !(outcome.newRatBalance === 0 && outcome.oldRatBalance > 0)
  };
}
function calculateTripStatistics(trip, outcomes, allOutcomes) {
  const normalizedOutcomes = outcomes.map(normalizeOutcome);
  const tripId = trip.id;
  const stats = {
    tripId,
    totalOutcomes: normalizedOutcomes.length,
    lastUpdated: /* @__PURE__ */ new Date(),
    overall: {
      avgValueChange: 0,
      medianValueChange: 0,
      stdDevValueChange: 0,
      survivalRate: 0,
      avgValueGainOnSurvival: 0,
      avgValueLossOnDeath: 0
    },
    byValueBucket: /* @__PURE__ */ new Map(),
    itemInfluence: /* @__PURE__ */ new Map(),
    itemAwards: [],
    commonPredecessors: [],
    commonSuccessors: []
  };
  if (normalizedOutcomes.length === 0) {
    return stats;
  }
  const valueChanges = normalizedOutcomes.map((o) => o.ratValueChange);
  const survived = normalizedOutcomes.filter((o) => o.survived);
  const died = normalizedOutcomes.filter((o) => o.died);
  stats.overall.avgValueChange = valueChanges.reduce((a, b) => a + b, 0) / valueChanges.length;
  stats.overall.medianValueChange = median(valueChanges);
  stats.overall.stdDevValueChange = stdDev(valueChanges, stats.overall.avgValueChange);
  stats.overall.survivalRate = survived.length / normalizedOutcomes.length;
  if (survived.length > 0) {
    stats.overall.avgValueGainOnSurvival = survived.map((o) => o.ratValueChange).reduce((a, b) => a + b, 0) / survived.length;
  }
  if (died.length > 0) {
    stats.overall.avgValueLossOnDeath = died.map((o) => o.ratValueChange).reduce((a, b) => a + b, 0) / died.length;
  }
  stats.byValueBucket = calculateBucketStats(normalizedOutcomes);
  stats.itemInfluence = calculateItemInfluence(normalizedOutcomes);
  stats.itemAwards = calculateItemAwards(normalizedOutcomes);
  if (allOutcomes && allOutcomes.length > 0) {
    const { predecessors, successors } = calculateTripSequencePatterns(
      tripId,
      allOutcomes.map(normalizeOutcome)
    );
    stats.commonPredecessors = predecessors;
    stats.commonSuccessors = successors;
  }
  return stats;
}
function calculateBucketStats(outcomes) {
  const bucketMap = /* @__PURE__ */ new Map();
  const bucketOutcomes = /* @__PURE__ */ new Map();
  for (const outcome of outcomes) {
    const bucket = getValueBucket(outcome.oldRatValue || 0);
    const existing = bucketOutcomes.get(bucket) || [];
    existing.push(outcome);
    bucketOutcomes.set(bucket, existing);
  }
  for (const [bucket, bucketOuts] of bucketOutcomes) {
    const valueChanges = bucketOuts.map((o) => o.ratValueChange);
    const survived = bucketOuts.filter((o) => o.survived);
    const died = bucketOuts.filter((o) => o.died);
    const avgValueChange = valueChanges.reduce((a, b) => a + b, 0) / valueChanges.length;
    const bucketStats = {
      bucket,
      outcomes: bucketOuts.length,
      avgValueChange,
      medianValueChange: median(valueChanges),
      stdDevValueChange: stdDev(valueChanges, avgValueChange),
      survivalRate: survived.length / bucketOuts.length,
      avgValueGainOnSurvival: survived.length > 0 ? survived.map((o) => o.ratValueChange).reduce((a, b) => a + b, 0) / survived.length : 0,
      avgValueLossOnDeath: died.length > 0 ? died.map((o) => o.ratValueChange).reduce((a, b) => a + b, 0) / died.length : 0
    };
    bucketMap.set(bucket, bucketStats);
  }
  return bucketMap;
}
function calculateItemInfluence(outcomes) {
  const influenceMap = /* @__PURE__ */ new Map();
  const allItems = /* @__PURE__ */ new Map();
  for (const outcome of outcomes) {
    for (const item of outcome.inventoryOnEntrance) {
      if (item.name) {
        allItems.set(item.name, { id: item.id, name: item.name });
      }
    }
  }
  for (const [itemName, itemInfo] of allItems) {
    const withItem = outcomes.filter(
      (o) => o.inventoryOnEntrance.some((i) => i.name === itemName)
    );
    const withoutItem = outcomes.filter(
      (o) => !o.inventoryOnEntrance.some((i) => i.name === itemName)
    );
    if (withItem.length < 2 || withoutItem.length < 2) {
      continue;
    }
    const withItemSurvived = withItem.filter((o) => o.survived);
    const withoutItemSurvived = withoutItem.filter((o) => o.survived);
    const withItemAvgChange = withItem.map((o) => o.ratValueChange).reduce((a, b) => a + b, 0) / withItem.length;
    const withoutItemAvgChange = withoutItem.map((o) => o.ratValueChange).reduce((a, b) => a + b, 0) / withoutItem.length;
    const withItemSurvivalRate = withItemSurvived.length / withItem.length;
    const withoutItemSurvivalRate = withoutItemSurvived.length / withoutItem.length;
    const itemGains = /* @__PURE__ */ new Map();
    for (const outcome of withItem) {
      for (const change of outcome.itemChanges) {
        if (change.type === "gained" && change.name) {
          itemGains.set(change.name, (itemGains.get(change.name) || 0) + 1);
        }
      }
    }
    const commonGains = Array.from(itemGains.entries()).map(([name, count]) => ({ itemName: name, frequency: count / withItem.length })).filter((g) => g.frequency > 0.1).sort((a, b) => b.frequency - a.frequency).slice(0, 5);
    const valueInfluence = withItemAvgChange - withoutItemAvgChange;
    const survivalInfluence = (withItemSurvivalRate - withoutItemSurvivalRate) * 100;
    const influenceScore = valueInfluence + survivalInfluence;
    const influence = {
      itemId: itemInfo.id,
      itemName,
      withItem: {
        outcomes: withItem.length,
        avgValueChange: withItemAvgChange,
        survivalRate: withItemSurvivalRate,
        commonGains
      },
      withoutItem: {
        outcomes: withoutItem.length,
        avgValueChange: withoutItemAvgChange,
        survivalRate: withoutItemSurvivalRate
      },
      influenceScore
    };
    influenceMap.set(itemName, influence);
  }
  return influenceMap;
}
function calculateItemAwards(outcomes) {
  const itemCounts = /* @__PURE__ */ new Map();
  for (const outcome of outcomes) {
    for (const change of outcome.itemChanges) {
      if (change.type === "gained" && change.name) {
        const existing = itemCounts.get(change.name) || {
          count: 0,
          value: change.value || 0,
          id: change.id || "",
          successCount: 0
        };
        existing.count++;
        if (outcome.survived && outcome.ratValueChange > 0) {
          existing.successCount++;
        }
        itemCounts.set(change.name, existing);
      }
    }
  }
  const awards = [];
  for (const [itemName, data] of itemCounts) {
    const frequency = data.count / outcomes.length;
    const conditionalOnSuccess = data.successCount / data.count > 0.7;
    awards.push({
      itemId: data.id,
      itemName,
      itemValue: data.value,
      frequency,
      conditionalOnSuccess
    });
  }
  return awards.filter((a) => a.frequency > 0.05).sort((a, b) => b.frequency - a.frequency);
}
function calculateTripSequencePatterns(tripId, allOutcomes) {
  const outcomesbyRat = /* @__PURE__ */ new Map();
  for (const outcome of allOutcomes) {
    const existing = outcomesbyRat.get(outcome.ratId) || [];
    existing.push(outcome);
    outcomesbyRat.set(outcome.ratId, existing);
  }
  for (const outcomes of outcomesbyRat.values()) {
    outcomes.sort((a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime());
  }
  const predecessorCounts = /* @__PURE__ */ new Map();
  const successorCounts = /* @__PURE__ */ new Map();
  for (const ratOutcomes of outcomesbyRat.values()) {
    for (let i = 0; i < ratOutcomes.length; i++) {
      if (ratOutcomes[i].tripId === tripId) {
        if (i > 0) {
          const prevTripId = ratOutcomes[i - 1].tripId;
          const existing = predecessorCounts.get(prevTripId) || { count: 0, valueChanges: [] };
          existing.count++;
          existing.valueChanges.push(ratOutcomes[i].ratValueChange);
          predecessorCounts.set(prevTripId, existing);
        }
        if (i < ratOutcomes.length - 1 && ratOutcomes[i].survived) {
          const nextTripId = ratOutcomes[i + 1].tripId;
          const existing = successorCounts.get(nextTripId) || { count: 0, valueChanges: [] };
          existing.count++;
          existing.valueChanges.push(ratOutcomes[i + 1].ratValueChange);
          successorCounts.set(nextTripId, existing);
        }
      }
    }
  }
  const thisTripsOutcomes = allOutcomes.filter((o) => o.tripId === tripId);
  const totalOccurrences = thisTripsOutcomes.length;
  const predecessors = Array.from(predecessorCounts.entries()).map(([predTripId, data]) => ({
    tripId: predTripId,
    frequency: data.count / totalOccurrences,
    avgValueChangeAfter: data.valueChanges.length > 0 ? data.valueChanges.reduce((a, b) => a + b, 0) / data.valueChanges.length : 0
  })).filter((p) => p.frequency > 0.05).sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  const survivedCount = thisTripsOutcomes.filter((o) => o.survived).length;
  const successors = Array.from(successorCounts.entries()).map(([succTripId, data]) => ({
    tripId: succTripId,
    frequency: survivedCount > 0 ? data.count / survivedCount : 0,
    avgValueChangeOnSuccessor: data.valueChanges.length > 0 ? data.valueChanges.reduce((a, b) => a + b, 0) / data.valueChanges.length : 0
  })).filter((s) => s.frequency > 0.05).sort((a, b) => b.frequency - a.frequency).slice(0, 10);
  return { predecessors, successors };
}
function updateStatisticsWithOutcome(existingStats, newOutcome) {
  const outcome = normalizeOutcome(newOutcome);
  const n = existingStats.totalOutcomes;
  const newN = n + 1;
  const newAvgValueChange = (existingStats.overall.avgValueChange * n + outcome.ratValueChange) / newN;
  const oldSurvivedCount = existingStats.overall.survivalRate * n;
  const newSurvivedCount = oldSurvivedCount + (outcome.survived ? 1 : 0);
  const newSurvivalRate = newSurvivedCount / newN;
  const updatedStats = {
    ...existingStats,
    totalOutcomes: newN,
    lastUpdated: /* @__PURE__ */ new Date(),
    overall: {
      ...existingStats.overall,
      avgValueChange: newAvgValueChange,
      survivalRate: newSurvivalRate
      // Note: median and stdDev would need full recalculation for accuracy
      // but we keep them as approximations for performance
    }
  };
  const bucket = getValueBucket(outcome.oldRatValue || 0);
  const existingBucket = existingStats.byValueBucket.get(bucket);
  if (existingBucket) {
    const bucketN = existingBucket.outcomes;
    const newBucketN = bucketN + 1;
    const newBucketAvg = (existingBucket.avgValueChange * bucketN + outcome.ratValueChange) / newBucketN;
    const oldBucketSurvived = existingBucket.survivalRate * bucketN;
    const newBucketSurvived = oldBucketSurvived + (outcome.survived ? 1 : 0);
    updatedStats.byValueBucket.set(bucket, {
      ...existingBucket,
      outcomes: newBucketN,
      avgValueChange: newBucketAvg,
      survivalRate: newBucketSurvived / newBucketN
    });
  } else {
    updatedStats.byValueBucket.set(bucket, {
      bucket,
      outcomes: 1,
      avgValueChange: outcome.ratValueChange,
      medianValueChange: outcome.ratValueChange,
      stdDevValueChange: 0,
      survivalRate: outcome.survived ? 1 : 0,
      avgValueGainOnSurvival: outcome.survived ? outcome.ratValueChange : 0,
      avgValueLossOnDeath: outcome.died ? outcome.ratValueChange : 0
    });
  }
  return updatedStats;
}

// src/modules/trip-selector/graph/path-reconstruction.ts
function reconstructJourneys(outcomes) {
  const outcomesByRat = /* @__PURE__ */ new Map();
  for (const outcome of outcomes) {
    const existing = outcomesByRat.get(outcome.ratId) || [];
    existing.push(outcome);
    outcomesByRat.set(outcome.ratId, existing);
  }
  const journeys = [];
  for (const [ratId, ratOutcomes] of outcomesByRat) {
    const sorted = [...ratOutcomes].sort(
      (a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
    );
    const journey = buildJourney(ratId, sorted);
    if (journey.steps.length > 0) {
      journeys.push(journey);
    }
  }
  return journeys;
}
function buildJourney(ratId, sortedOutcomes) {
  const steps = [];
  let peakValue = 0;
  let peakValueStep = 0;
  const uniqueItems = /* @__PURE__ */ new Set();
  for (let i = 0; i < sortedOutcomes.length; i++) {
    const outcome = sortedOutcomes[i];
    const died = outcome.newRatBalance === 0 && outcome.oldRatBalance > 0;
    const survived = !died;
    const itemsOnEntrance = (outcome.inventoryOnEntrance || []).map((item) => ({
      id: item.id || "",
      name: item.name || "",
      value: item.value || 0
    }));
    const itemsGained = (outcome.itemChanges || []).filter((c) => c.type === "gained").map((c) => ({
      id: c.id || "",
      name: c.name || "",
      value: c.value || 0
    }));
    const itemsLost = died ? (outcome.itemsLostOnDeath || []).map((item) => ({
      id: item.id || "",
      name: item.name || "",
      value: item.value || 0
    })) : (outcome.itemChanges || []).filter((c) => c.type === "lost").map((c) => ({
      id: c.id || "",
      name: c.name || "",
      value: c.value || 0
    }));
    for (const item of itemsGained) {
      if (item.name) uniqueItems.add(item.name);
    }
    const step = {
      tripId: outcome.tripId,
      tripPrompt: "",
      // We don't have this in outcomes, will be enriched later
      valueChange: outcome.ratValueChange,
      valueBefore: outcome.oldRatValue || 0,
      valueAfter: outcome.ratValue || 0,
      survived,
      itemsOnEntrance,
      itemsGained,
      itemsLost
    };
    steps.push(step);
    if (step.valueAfter > peakValue) {
      peakValue = step.valueAfter;
      peakValueStep = i;
    }
    if (died) {
      break;
    }
  }
  const firstOutcome = sortedOutcomes[0];
  const lastStep = steps[steps.length - 1];
  return {
    ratId,
    ratName: firstOutcome?.ratName || "",
    playerId: firstOutcome?.playerId || "",
    steps,
    totalTrips: steps.length,
    totalValueGained: steps.reduce((sum, s) => sum + s.valueChange, 0),
    finalValue: lastStep?.valueAfter || 0,
    survived: lastStep?.survived ?? false,
    peakValue,
    peakValueStep,
    uniqueItemsCollected: Array.from(uniqueItems)
  };
}
var DEFAULT_SUCCESS_CRITERIA = {
  minTrips: 3,
  minTotalValueGain: 500,
  minFinalValue: 1e3,
  mustSurvive: false
  // Even dead rats can have successful paths up to a point
};
function filterSuccessfulJourneys(journeys, criteria = {}) {
  const c = { ...DEFAULT_SUCCESS_CRITERIA, ...criteria };
  return journeys.filter((journey) => {
    if (journey.totalTrips < c.minTrips) return false;
    if (journey.totalValueGained < c.minTotalValueGain) return false;
    if (journey.peakValue < c.minFinalValue) return false;
    if (c.mustSurvive && !journey.survived) return false;
    return true;
  });
}
function extractPathPatterns(journeys, minOccurrences = 3, maxPatternLength = 5) {
  const patterns = [];
  for (let length = 2; length <= maxPatternLength; length++) {
    const subsequenceCounts = /* @__PURE__ */ new Map();
    for (const journey of journeys) {
      for (let start = 0; start <= journey.steps.length - length; start++) {
        const subsequence = journey.steps.slice(start, start + length);
        const tripIds = subsequence.map((s) => s.tripId);
        const key = tripIds.join("->");
        const valueGain = subsequence.reduce((sum, s) => sum + s.valueChange, 0);
        const completed = subsequence.every((s, i) => i === subsequence.length - 1 || s.survived);
        const existing = subsequenceCounts.get(key) || {
          tripSequence: tripIds,
          journeys: [],
          totalValueGains: [],
          completionCount: 0
        };
        existing.journeys.push(journey);
        existing.totalValueGains.push(valueGain);
        if (completed) existing.completionCount++;
        subsequenceCounts.set(key, existing);
      }
    }
    for (const [, data] of subsequenceCounts) {
      if (data.journeys.length < minOccurrences) continue;
      const avgTotalValueGain = data.totalValueGains.reduce((a, b) => a + b, 0) / data.totalValueGains.length;
      const completionRate = data.completionCount / data.journeys.length;
      const keyItems = findKeyItemsForPattern(data.journeys, data.tripSequence);
      const entryValues = data.journeys.map((j) => {
        const startStep = j.steps.find((s) => s.tripId === data.tripSequence[0]);
        return startStep?.valueBefore || 0;
      });
      const optimalRange = findOptimalValueRange(entryValues, data.totalValueGains);
      patterns.push({
        tripSequence: data.tripSequence,
        occurrences: data.journeys.length,
        avgTotalValueGain,
        completionRate,
        keyItems,
        optimalEntryValueRange: optimalRange
      });
    }
  }
  return patterns.filter((p) => p.completionRate > 0.3).sort((a, b) => {
    const scoreA = a.avgTotalValueGain * a.completionRate * Math.log(a.occurrences + 1);
    const scoreB = b.avgTotalValueGain * b.completionRate * Math.log(b.occurrences + 1);
    return scoreB - scoreA;
  }).slice(0, 50);
}
function findKeyItemsForPattern(journeys, tripSequence) {
  const itemAtStep = /* @__PURE__ */ new Map();
  for (const journey of journeys) {
    const patternStart = findPatternStart(journey.steps, tripSequence);
    if (patternStart === -1) continue;
    for (let i = 0; i < tripSequence.length; i++) {
      const step = journey.steps[patternStart + i];
      if (!step) continue;
      for (const item of step.itemsOnEntrance) {
        if (!item.name) continue;
        const itemSteps = itemAtStep.get(item.name) || /* @__PURE__ */ new Map();
        itemSteps.set(i, (itemSteps.get(i) || 0) + 1);
        itemAtStep.set(item.name, itemSteps);
      }
    }
  }
  const keyItems = [];
  for (const [itemName, stepCounts] of itemAtStep) {
    let maxStep = 0;
    let maxCount = 0;
    for (const [step, count] of stepCounts) {
      if (count > maxCount) {
        maxCount = count;
        maxStep = step;
      }
    }
    const frequency = maxCount / journeys.length;
    if (frequency > 0.3) {
      keyItems.push({
        itemName,
        acquiredAtStep: maxStep,
        importanceScore: frequency
      });
    }
  }
  return keyItems.sort((a, b) => b.importanceScore - a.importanceScore).slice(0, 5);
}
function findPatternStart(steps, tripSequence) {
  for (let i = 0; i <= steps.length - tripSequence.length; i++) {
    let matches = true;
    for (let j = 0; j < tripSequence.length; j++) {
      if (steps[i + j].tripId !== tripSequence[j]) {
        matches = false;
        break;
      }
    }
    if (matches) return i;
  }
  return -1;
}
function findOptimalValueRange(entryValues, valueGains) {
  if (entryValues.length === 0) {
    return { min: 0, max: Infinity };
  }
  const pairs = entryValues.map((v, i) => ({ entry: v, gain: valueGains[i] }));
  pairs.sort((a, b) => a.entry - b.entry);
  const windowSize = Math.max(3, Math.floor(pairs.length / 3));
  let bestAvg = -Infinity;
  let bestMin = 0;
  let bestMax = Infinity;
  for (let i = 0; i <= pairs.length - windowSize; i++) {
    const window = pairs.slice(i, i + windowSize);
    const avgGain = window.reduce((sum, p) => sum + p.gain, 0) / windowSize;
    if (avgGain > bestAvg) {
      bestAvg = avgGain;
      bestMin = window[0].entry;
      bestMax = window[window.length - 1].entry;
    }
  }
  const range = bestMax - bestMin;
  return {
    min: Math.max(0, bestMin - range * 0.1),
    max: bestMax + range * 0.1
  };
}

// src/modules/trip-selector/graph/graph-builder.ts
async function fetchExtendedOutcomes(tripIds, worldAddress) {
  if (tripIds.length === 0) return [];
  const query = `*[_type == "outcome" && tripId in $tripIds && worldAddress == $worldAddress] {
    _id,
    _createdAt,
    tripId,
    tripIndex,
    ratId,
    ratName,
    playerId,
    playerName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance,
    inventoryOnEntrance[] {
      "id": id,
      "name": name,
      "value": value
    },
    itemChanges[] {
      "name": name,
      "type": type,
      "value": value,
      "id": id
    },
    itemsLostOnDeath[] {
      "id": id,
      "name": name,
      "value": value
    }
  }`;
  const outcomes = await sanityClient.fetch(query, { tripIds, worldAddress });
  return outcomes.map((o) => ({
    ...o,
    died: o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0,
    survived: !(o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0)
  }));
}
async function fetchAllOutcomes(worldAddress) {
  const query = `*[_type == "outcome" && worldAddress == $worldAddress] | order(_createdAt asc) {
    _id,
    _createdAt,
    tripId,
    tripIndex,
    ratId,
    ratName,
    playerId,
    playerName,
    ratValueChange,
    ratValue,
    oldRatValue,
    newRatBalance,
    oldRatBalance,
    inventoryOnEntrance[] {
      "id": id,
      "name": name,
      "value": value
    },
    itemChanges[] {
      "name": name,
      "type": type,
      "value": value,
      "id": id
    },
    itemsLostOnDeath[] {
      "id": id,
      "name": name,
      "value": value
    }
  }`;
  const outcomes = await sanityClient.fetch(query, { worldAddress });
  return outcomes.map((o) => ({
    ...o,
    died: o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0,
    survived: !(o.newRatBalance === 0 && (o.oldRatBalance ?? 0) > 0)
  }));
}
var TripGraphBuilder = class {
  constructor(worldAddress, minRatValueToEnterPercent = 30) {
    this.initialized = false;
    this.graph = {
      worldAddress,
      nodes: /* @__PURE__ */ new Map(),
      edges: /* @__PURE__ */ new Map(),
      successfulJourneys: [],
      pathPatterns: [],
      lastFullRebuild: /* @__PURE__ */ new Date(),
      outcomeCount: 0,
      minRatValueToEnterPercent
    };
  }
  /**
   * Get the current graph state
   */
  getGraph() {
    return this.graph;
  }
  /**
   * Check if graph is initialized
   */
  isInitialized() {
    return this.initialized;
  }
  /**
   * Initialize the graph from CMS data
   */
  async initialize(trips) {
    console.log(`[GraphBuilder] Initializing graph with ${trips.length} trips...`);
    console.log(`[GraphBuilder] Fetching all outcomes from CMS...`);
    const allOutcomes = await fetchAllOutcomes(this.graph.worldAddress);
    console.log(`[GraphBuilder] Fetched ${allOutcomes.length} outcomes`);
    this.graph.outcomeCount = allOutcomes.length;
    const outcomesByTrip = /* @__PURE__ */ new Map();
    for (const outcome of allOutcomes) {
      const existing = outcomesByTrip.get(outcome.tripId) || [];
      existing.push(outcome);
      outcomesByTrip.set(outcome.tripId, existing);
    }
    console.log(`[GraphBuilder] Building trip nodes...`);
    for (const trip of trips) {
      const tripOutcomes = outcomesByTrip.get(trip.id) || [];
      const stats = calculateTripStatistics(trip, tripOutcomes, allOutcomes);
      const minEntryValue = Math.floor(
        trip.tripCreationCost * this.graph.minRatValueToEnterPercent / 100
      );
      const node = {
        tripId: trip.id,
        trip,
        stats,
        minEntryValue,
        active: trip.balance > 0
      };
      this.graph.nodes.set(trip.id, node);
    }
    console.log(`[GraphBuilder] Reconstructing rat journeys...`);
    const journeys = reconstructJourneys(allOutcomes);
    console.log(`[GraphBuilder] Found ${journeys.length} rat journeys`);
    const successfulJourneys = filterSuccessfulJourneys(journeys, {
      minTrips: 3,
      minTotalValueGain: 300,
      minFinalValue: 500
    });
    console.log(`[GraphBuilder] Found ${successfulJourneys.length} successful journeys`);
    this.graph.successfulJourneys = successfulJourneys;
    console.log(`[GraphBuilder] Extracting path patterns...`);
    const patterns = extractPathPatterns(successfulJourneys, 2);
    console.log(`[GraphBuilder] Found ${patterns.length} path patterns`);
    this.graph.pathPatterns = patterns;
    console.log(`[GraphBuilder] Computing trip edges...`);
    this.computeEdges(allOutcomes);
    this.graph.lastFullRebuild = /* @__PURE__ */ new Date();
    this.initialized = true;
    console.log(`[GraphBuilder] Graph initialization complete`);
    this.logGraphStats();
  }
  /**
   * Compute edges between trips based on historical transitions
   */
  computeEdges(allOutcomes) {
    const outcomesByRat = /* @__PURE__ */ new Map();
    for (const outcome of allOutcomes) {
      const existing = outcomesByRat.get(outcome.ratId) || [];
      existing.push(outcome);
      outcomesByRat.set(outcome.ratId, existing);
    }
    const transitions = /* @__PURE__ */ new Map();
    for (const outcomes of outcomesByRat.values()) {
      const sorted = [...outcomes].sort(
        (a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        const from = sorted[i];
        const to = sorted[i + 1];
        if (!from.survived) continue;
        const key = `${from.tripId}->${to.tripId}`;
        const existing = transitions.get(key) || {
          fromTripId: from.tripId,
          toTripId: to.tripId,
          count: 0,
          survivedCount: 0,
          valueGains: []
        };
        existing.count++;
        if (to.survived) existing.survivedCount++;
        existing.valueGains.push(to.ratValueChange);
        transitions.set(key, existing);
      }
    }
    for (const [, data] of transitions) {
      if (data.count < 2) continue;
      const avgValueGain = data.valueGains.reduce((a, b) => a + b, 0) / data.valueGains.length;
      const successRate = data.survivedCount / data.count;
      const beneficialItems = this.findBeneficialItemsForTransition(
        data.fromTripId,
        data.toTripId,
        allOutcomes
      );
      const edge = {
        fromTripId: data.fromTripId,
        toTripId: data.toTripId,
        accessibilityProbability: successRate,
        // Simplified - real value depends on rat value
        expectedValueGain: avgValueGain,
        beneficialItems,
        transitionSuccessRate: successRate,
        transitionCount: data.count
      };
      const existing = this.graph.edges.get(data.fromTripId) || [];
      existing.push(edge);
      this.graph.edges.set(data.fromTripId, existing);
    }
  }
  /**
   * Find items that improve outcomes when transitioning between two trips
   */
  findBeneficialItemsForTransition(fromTripId, toTripId, allOutcomes) {
    const outcomesByRat = /* @__PURE__ */ new Map();
    for (const outcome of allOutcomes) {
      const existing = outcomesByRat.get(outcome.ratId) || [];
      existing.push(outcome);
      outcomesByRat.set(outcome.ratId, existing);
    }
    const transitionOutcomes = [];
    for (const outcomes of outcomesByRat.values()) {
      const sorted = [...outcomes].sort(
        (a, b) => new Date(a._createdAt).getTime() - new Date(b._createdAt).getTime()
      );
      for (let i = 0; i < sorted.length - 1; i++) {
        if (sorted[i].tripId === fromTripId && sorted[i + 1].tripId === toTripId) {
          transitionOutcomes.push({
            itemsOnEntrance: (sorted[i + 1].inventoryOnEntrance || []).map((item) => item.name).filter(Boolean),
            valueChange: sorted[i + 1].ratValueChange,
            survived: sorted[i + 1].survived
          });
        }
      }
    }
    if (transitionOutcomes.length < 3) return [];
    const itemImpact = /* @__PURE__ */ new Map();
    const allItems = /* @__PURE__ */ new Set();
    for (const t of transitionOutcomes) {
      for (const item of t.itemsOnEntrance) {
        allItems.add(item);
      }
    }
    for (const item of allItems) {
      const withItem = transitionOutcomes.filter((t) => t.itemsOnEntrance.includes(item)).map((t) => t.valueChange);
      const withoutItem = transitionOutcomes.filter((t) => !t.itemsOnEntrance.includes(item)).map((t) => t.valueChange);
      if (withItem.length >= 2 && withoutItem.length >= 2) {
        itemImpact.set(item, { withItem, withoutItem });
      }
    }
    const beneficial = [];
    for (const [item, impact] of itemImpact) {
      const avgWith = impact.withItem.reduce((a, b) => a + b, 0) / impact.withItem.length;
      const avgWithout = impact.withoutItem.reduce((a, b) => a + b, 0) / impact.withoutItem.length;
      if (avgWith > avgWithout + 50) {
        beneficial.push(item);
      }
    }
    return beneficial.slice(0, 3);
  }
  /**
   * Update the graph with a new outcome (incremental update)
   */
  updateWithOutcome(tripId, outcome) {
    const node = this.graph.nodes.get(tripId);
    if (!node) {
      console.log(`[GraphBuilder] Trip ${tripId} not in graph, skipping update`);
      return;
    }
    node.stats = updateStatisticsWithOutcome(node.stats, outcome);
    this.graph.outcomeCount++;
  }
  /**
   * Mark a trip as depleted (balance = 0)
   */
  markTripDepleted(tripId) {
    const node = this.graph.nodes.get(tripId);
    if (node) {
      node.active = false;
      console.log(`[GraphBuilder] Marked trip ${tripId} as depleted`);
    }
  }
  /**
   * Add a new trip to the graph
   */
  async addTrip(trip) {
    const outcomes = await fetchExtendedOutcomes([trip.id], this.graph.worldAddress);
    const allOutcomes = await fetchAllOutcomes(this.graph.worldAddress);
    const stats = calculateTripStatistics(trip, outcomes, allOutcomes);
    const minEntryValue = Math.floor(
      trip.tripCreationCost * this.graph.minRatValueToEnterPercent / 100
    );
    const node = {
      tripId: trip.id,
      trip,
      stats,
      minEntryValue,
      active: trip.balance > 0
    };
    this.graph.nodes.set(trip.id, node);
    console.log(`[GraphBuilder] Added new trip ${trip.id}`);
  }
  /**
   * Update trip data (e.g., new balance)
   */
  updateTrip(trip) {
    const node = this.graph.nodes.get(trip.id);
    if (node) {
      node.trip = trip;
      node.active = trip.balance > 0;
      node.minEntryValue = Math.floor(
        trip.tripCreationCost * this.graph.minRatValueToEnterPercent / 100
      );
    }
  }
  /**
   * Get edges from a trip
   */
  getEdgesFrom(tripId) {
    return this.graph.edges.get(tripId) || [];
  }
  /**
   * Get active trips that a rat can enter
   */
  getAccessibleTrips(ratValue) {
    const accessible = [];
    for (const node of this.graph.nodes.values()) {
      if (node.active && ratValue >= node.minEntryValue) {
        accessible.push(node);
      }
    }
    return accessible;
  }
  /**
   * Full rebuild of the graph (call periodically for accuracy)
   */
  async rebuild(trips) {
    console.log(`[GraphBuilder] Performing full graph rebuild...`);
    this.initialized = false;
    this.graph.nodes.clear();
    this.graph.edges.clear();
    await this.initialize(trips);
  }
  /**
   * Log graph statistics
   */
  logGraphStats() {
    const activeNodes = Array.from(this.graph.nodes.values()).filter((n) => n.active).length;
    const totalEdges = Array.from(this.graph.edges.values()).reduce(
      (sum, edges) => sum + edges.length,
      0
    );
    console.log(`[GraphBuilder] Graph stats:`);
    console.log(`  - Total trips: ${this.graph.nodes.size}`);
    console.log(`  - Active trips: ${activeNodes}`);
    console.log(`  - Total edges: ${totalEdges}`);
    console.log(`  - Outcomes: ${this.graph.outcomeCount}`);
    console.log(`  - Successful journeys: ${this.graph.successfulJourneys.length}`);
    console.log(`  - Path patterns: ${this.graph.pathPatterns.length}`);
  }
};
var graphInstance = null;
function getGraphBuilder(worldAddress, minRatValueToEnterPercent = 30) {
  if (!graphInstance || graphInstance.getGraph().worldAddress !== worldAddress) {
    graphInstance = new TripGraphBuilder(worldAddress, minRatValueToEnterPercent);
  }
  return graphInstance;
}

// src/modules/trip-selector/graph/index.ts
var graphBuilder = null;
var graphInitPromise = null;
async function initializeGraph(worldAddress, trips, minRatValueToEnterPercent = 30) {
  if (graphBuilder && graphBuilder.getGraph().worldAddress === worldAddress && graphBuilder.isInitialized()) {
    return graphBuilder;
  }
  if (graphInitPromise) {
    await graphInitPromise;
    if (graphBuilder) return graphBuilder;
  }
  graphBuilder = getGraphBuilder(worldAddress, minRatValueToEnterPercent);
  graphInitPromise = graphBuilder.initialize(trips);
  await graphInitPromise;
  graphInitPromise = null;
  return graphBuilder;
}
function updateGraphWithOutcome(tripId, outcome) {
  if (graphBuilder) {
    graphBuilder.updateWithOutcome(tripId, outcome);
  }
}
function markTripDepleted(tripId) {
  if (graphBuilder) {
    graphBuilder.markTripDepleted(tripId);
  }
}
async function selectTripWithGraph(options) {
  const {
    trips,
    ratTotalValue,
    worldAddress,
    minRatValueToEnterPercent = 30,
    currentPath = []
  } = options;
  console.log(`[Graph] Starting trip selection (rat value: ${ratTotalValue}, trips available: ${trips.length})`);
  if (trips.length === 0) {
    return null;
  }
  const availableTripIds = new Set(trips.map((t) => t.id));
  console.log(`[Graph] Ensuring graph is initialized...`);
  const builder = await initializeGraph(worldAddress, trips, minRatValueToEnterPercent);
  const graph = builder.getGraph();
  const journeys = [...graph.successfulJourneys].sort((a, b) => b.peakValue - a.peakValue);
  console.log(`[Graph] Found ${journeys.length} profitable journeys to learn from`);
  if (journeys.length === 0) {
    console.log(`[Graph] No journeys found, falling back to highest balance trip`);
    const sorted2 = [...trips].sort((a, b) => b.balance - a.balance);
    return {
      trip: sorted2[0],
      explanation: "Fallback: highest balance trip (no journey data)"
    };
  }
  console.log(`[Graph] Top profitable journeys:`);
  for (let i = 0; i < Math.min(3, journeys.length); i++) {
    const j = journeys[i];
    console.log(`[Graph]   ${i + 1}. ${j.ratName} - peak: ${j.peakValue}, trips: ${j.totalTrips}, gain: ${j.totalValueGained}`);
  }
  const currentStep = currentPath.length;
  console.log(`[Graph] Current step: ${currentStep} (path: ${currentPath.length > 0 ? currentPath.map((id) => id.slice(0, 8)).join(" -> ") : "start"})`);
  for (const journey of journeys) {
    const journeyTripIds = journey.steps.map((s) => s.tripId);
    if (currentStep === 0) {
      const firstTripId = journeyTripIds[0];
      if (availableTripIds.has(firstTripId)) {
        const trip = trips.find((t) => t.id === firstTripId);
        console.log(`[Graph] Following journey of "${journey.ratName}" (peak: ${journey.peakValue})`);
        console.log(`[Graph] Journey path: ${journeyTripIds.map((id) => id.slice(0, 8)).join(" -> ")}`);
        console.log(`[Graph] Starting with trip 1/${journeyTripIds.length}`);
        return {
          trip,
          explanation: `Following ${journey.ratName}'s journey (peak: ${journey.peakValue}) - step 1/${journeyTripIds.length}`
        };
      }
      continue;
    }
    let matchesPrefix = true;
    for (let i = 0; i < currentPath.length && i < journeyTripIds.length; i++) {
      if (currentPath[i] !== journeyTripIds[i]) {
        matchesPrefix = false;
        break;
      }
    }
    if (matchesPrefix && currentStep < journeyTripIds.length) {
      const nextTripId = journeyTripIds[currentStep];
      if (availableTripIds.has(nextTripId)) {
        const trip = trips.find((t) => t.id === nextTripId);
        console.log(`[Graph] Continuing journey of "${journey.ratName}" (peak: ${journey.peakValue})`);
        console.log(`[Graph] Next trip: step ${currentStep + 1}/${journeyTripIds.length}`);
        return {
          trip,
          explanation: `Following ${journey.ratName}'s journey (peak: ${journey.peakValue}) - step ${currentStep + 1}/${journeyTripIds.length}`
        };
      }
    }
  }
  console.log(`[Graph] No exact journey match, looking for any profitable trip...`);
  const tripScores = /* @__PURE__ */ new Map();
  for (const journey of journeys) {
    for (let i = 0; i < journey.steps.length; i++) {
      const tripId = journey.steps[i].tripId;
      if (!availableTripIds.has(tripId)) continue;
      const positionBonus = (journey.steps.length - i) / journey.steps.length;
      const score = journey.peakValue * positionBonus;
      const existing = tripScores.get(tripId);
      if (!existing || score > existing.score) {
        tripScores.set(tripId, { score, journeyPeak: journey.peakValue, journeyName: journey.ratName });
      }
    }
  }
  let bestTripId = null;
  let bestScore = -Infinity;
  let bestData = null;
  for (const [tripId, data] of tripScores) {
    if (data.score > bestScore) {
      bestScore = data.score;
      bestTripId = tripId;
      bestData = data;
    }
  }
  if (bestTripId && bestData) {
    const trip = trips.find((t) => t.id === bestTripId);
    console.log(`[Graph] Selected trip from ${bestData.journeyName}'s journey (peak: ${bestData.journeyPeak})`);
    return {
      trip,
      explanation: `Trip from ${bestData.journeyName}'s journey (peak: ${bestData.journeyPeak})`
    };
  }
  console.log(`[Graph] No matching trips, falling back to highest balance`);
  const sorted = [...trips].sort((a, b) => b.balance - a.balance);
  return {
    trip: sorted[0],
    explanation: "Fallback: highest balance trip"
  };
}
async function getRecommendedPath(ratValue, _inventory, worldAddress, trips, maxSteps = 5) {
  const builder = await initializeGraph(worldAddress, trips);
  const graph = builder.getGraph();
  const availableTripIds = new Set(trips.map((t) => t.id));
  const journeys = [...graph.successfulJourneys].sort((a, b) => b.peakValue - a.peakValue);
  if (journeys.length === 0) {
    return [];
  }
  for (const journey of journeys) {
    const journeyTripIds = journey.steps.map((s) => s.tripId);
    const firstTripId = journeyTripIds[0];
    if (!availableTripIds.has(firstTripId)) continue;
    const path = [];
    let cumulativeValue = ratValue;
    for (let i = 0; i < Math.min(maxSteps, journey.steps.length); i++) {
      const step = journey.steps[i];
      if (!availableTripIds.has(step.tripId)) break;
      cumulativeValue += step.valueChange;
      path.push({
        tripId: step.tripId,
        expectedValue: step.valueChange,
        cumulativeValue
      });
    }
    if (path.length > 0) {
      console.log(`[Graph] Recommended path from ${journey.ratName}'s journey (peak: ${journey.peakValue})`);
      return path;
    }
  }
  return [];
}

// src/modules/trip-selector/index.ts
async function selectTrip(configOrOptions, trips, rat, anthropic, outcomeHistory = [], worldAddress) {
  let config;
  let tripsArray;
  let ratObj;
  let anthropicClient;
  let history;
  let worldAddr;
  let ratTotalValue;
  let minRatValueToEnterPercent;
  let graphConfig;
  let currentPath;
  let inventory;
  if ("config" in configOrOptions) {
    config = configOrOptions.config;
    tripsArray = configOrOptions.trips;
    ratObj = configOrOptions.rat;
    anthropicClient = configOrOptions.anthropic;
    history = configOrOptions.outcomeHistory ?? [];
    worldAddr = configOrOptions.worldAddress;
    ratTotalValue = configOrOptions.ratTotalValue;
    minRatValueToEnterPercent = configOrOptions.minRatValueToEnterPercent;
    graphConfig = configOrOptions.graphConfig;
    currentPath = configOrOptions.currentPath;
    inventory = configOrOptions.inventory;
  } else {
    config = configOrOptions;
    tripsArray = trips;
    ratObj = rat;
    anthropicClient = anthropic;
    history = outcomeHistory;
    worldAddr = worldAddress;
  }
  if (tripsArray.length === 0) {
    return null;
  }
  if (config.tripSelector === "claude" && anthropicClient) {
    console.log("Using Claude AI to select trip...");
    return selectTripWithClaude(anthropicClient, tripsArray, ratObj, history);
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
    return selectTripHistorical(tripsArray, worldAddr);
  } else if (config.tripSelector === "graph" && worldAddr) {
    console.log("Using graph-based pathfinding to select trip...");
    return selectTripWithGraph({
      trips: tripsArray,
      rat: ratObj,
      ratTotalValue: ratTotalValue ?? ratObj.balance,
      worldAddress: worldAddr,
      minRatValueToEnterPercent,
      config: graphConfig,
      currentPath,
      inventory
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

// src/modules/history/index.ts
import { readFileSync, writeFileSync, existsSync } from "fs";
var HISTORY_FILE = "outcome-history.json";
function loadOutcomeHistory() {
  try {
    if (existsSync(HISTORY_FILE)) {
      const data = readFileSync(HISTORY_FILE, "utf-8");
      const history = JSON.parse(data);
      console.log(`Loaded ${history.length} previous outcomes from ${HISTORY_FILE}`);
      return history;
    }
  } catch (error) {
    console.warn(
      `Failed to load outcome history: ${error instanceof Error ? error.message : error}`
    );
  }
  return [];
}
function saveOutcomeHistory(history) {
  try {
    writeFileSync(HISTORY_FILE, JSON.stringify(history, null, 2));
  } catch (error) {
    console.warn(
      `Failed to save outcome history: ${error instanceof Error ? error.message : error}`
    );
  }
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
  let anthropic;
  if (config.tripSelector === "claude") {
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
  const outcomeHistory = loadOutcomeHistory();
  let currentPath = [];
  const gamePercentagesConfig = getGamePercentagesConfig(mud);
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
        currentPath = [];
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
    const ratTotalValue = getRatTotalValue(mud, rat);
    const inventoryItems = getInventoryDetails(mud, rat);
    const inventoryNames = inventoryItems.map((i) => i.name);
    const selection = await selectTrip({
      config,
      trips: enterableTrips,
      rat,
      ratTotalValue,
      anthropic,
      outcomeHistory,
      worldAddress,
      minRatValueToEnterPercent: gamePercentagesConfig.minRatValueToEnter,
      currentPath,
      inventory: inventoryNames
    });
    if (!selection) {
      logError("Failed to select a trip");
      await sleep(5e3);
      continue;
    }
    const { trip: selectedTrip, explanation } = selection;
    tripCount++;
    logTrip(tripCount, `Entering: "${selectedTrip.prompt.slice(0, 60)}..."`);
    logTrip(tripCount, `Trip balance: ${selectedTrip.balance}`);
    logInfo(`Selection reason: ${explanation}`);
    if (config.tripSelector === "graph") {
      try {
        const plannedRoute = await getRecommendedPath(
          ratTotalValue,
          inventoryNames,
          worldAddress,
          enterableTrips,
          5
          // Look ahead 5 trips
        );
        if (plannedRoute.length > 0) {
          console.log("");
          logInfo("=== PLANNED ROUTE ===");
          let cumulativeEV = ratTotalValue;
          for (let i = 0; i < plannedRoute.length; i++) {
            const step = plannedRoute[i];
            const tripData = enterableTrips.find((t) => t.id === step.tripId);
            const prompt = tripData?.prompt?.slice(0, 40) || "Unknown";
            cumulativeEV += step.expectedValue;
            const evSign = step.expectedValue >= 0 ? "+" : "";
            logInfo(`  ${i + 1}. "${prompt}..." (EV: ${evSign}${step.expectedValue.toFixed(0)}, cumulative: ${cumulativeEV.toFixed(0)})`);
          }
          logInfo("=====================");
          console.log("");
        }
      } catch (e) {
      }
    }
    currentPath.push(selectedTrip.id);
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
      if (outcome.tripDepleted) {
        markTripDepleted(selectedTrip.id);
      }
      if (outcome.ratDead) {
        const historyEntry = {
          tripId: selectedTrip.id,
          tripPrompt: selectedTrip.prompt,
          totalValueBefore,
          totalValueAfter: 0,
          valueChange: -totalValueBefore,
          died: true,
          logSummary: logEntries.slice(0, 3).join(" | ")
        };
        outcomeHistory.push(historyEntry);
        saveOutcomeHistory(outcomeHistory);
        updateGraphWithOutcome(selectedTrip.id, {
          _id: "",
          _createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          tripId: selectedTrip.id,
          tripIndex: 0,
          ratId: rat.id,
          ratName: rat.name,
          playerId,
          playerName: player?.name || "",
          ratValueChange: -totalValueBefore,
          ratValue: 0,
          oldRatValue: totalValueBefore,
          newRatBalance: 0,
          oldRatBalance: rat.balance,
          inventoryOnEntrance: inventoryItems.map((i) => ({ id: "", name: i.name, value: i.value })),
          itemChanges: [],
          itemsLostOnDeath: inventoryItems.map((i) => ({ id: "", name: i.name, value: i.value })),
          died: true,
          survived: false
        });
        logDeath(rat.name, tripCount);
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
          currentPath = [];
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
          const updatedInventoryItems = getInventoryDetails(mud, rat);
          outcomeHistory.push({
            tripId: selectedTrip.id,
            tripPrompt: selectedTrip.prompt,
            totalValueBefore,
            totalValueAfter,
            valueChange,
            died: false,
            logSummary: logEntries.slice(0, 3).join(" | ")
          });
          saveOutcomeHistory(outcomeHistory);
          updateGraphWithOutcome(selectedTrip.id, {
            _id: "",
            _createdAt: (/* @__PURE__ */ new Date()).toISOString(),
            tripId: selectedTrip.id,
            tripIndex: 0,
            ratId: rat.id,
            ratName: rat.name,
            playerId,
            playerName: player?.name || "",
            ratValueChange: valueChange,
            ratValue: totalValueAfter,
            oldRatValue: totalValueBefore,
            newRatBalance: rat.balance,
            oldRatBalance: totalValueBefore - inventoryItems.reduce((sum, i) => sum + i.value, 0),
            inventoryOnEntrance: inventoryItems.map((i) => ({ id: "", name: i.name, value: i.value })),
            itemChanges: [],
            // Would need to compare inventories to populate this
            itemsLostOnDeath: [],
            died: false,
            survived: true
          });
          const changeStr = valueChange >= 0 ? `+${valueChange}` : `${valueChange}`;
          const inventoryStr = updatedInventoryItems.length > 0 ? `, Inventory: [${updatedInventoryItems.map((i) => `${i.name}(${i.value})`).join(", ")}]` : "";
          logRat(
            rat.name,
            `Balance: ${rat.balance}, Total Value: ${totalValueAfter} (${changeStr}), Trips: ${tripCount}${inventoryStr}`
          );
          logValueBar({
            currentValue: totalValueAfter,
            liquidateBelowValue: config.liquidateBelowValue,
            liquidateAtValue: config.liquidateAtValue
          });
          if (config.tripSelector === "graph") {
            try {
              const updatedInventoryNames = updatedInventoryItems.map((i) => i.name);
              const updatedTrips = getAvailableTrips(mud).filter((trip) => canRatEnterTrip(mud, rat, trip));
              const updatedRoute = await getRecommendedPath(
                totalValueAfter,
                updatedInventoryNames,
                worldAddress,
                updatedTrips,
                5
              );
              if (updatedRoute.length > 0) {
                console.log("");
                logInfo("=== UPDATED ROUTE (after outcome) ===");
                let cumulativeEV = totalValueAfter;
                for (let i = 0; i < updatedRoute.length; i++) {
                  const step = updatedRoute[i];
                  const tripData = updatedTrips.find((t) => t.id === step.tripId);
                  const prompt = tripData?.prompt?.slice(0, 40) || "Unknown";
                  cumulativeEV += step.expectedValue;
                  const evSign = step.expectedValue >= 0 ? "+" : "";
                  logInfo(`  ${i + 1}. "${prompt}..." (EV: ${evSign}${step.expectedValue.toFixed(0)}, cumulative: ${cumulativeEV.toFixed(0)})`);
                }
                logInfo("=====================================");
                console.log("");
              }
            } catch (e) {
            }
          }
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
var program = new Command().name("rattus-bot").description("Autonomous rat.fun player bot").version("1.0.0").option("-c, --chain <id>", "Chain ID (8453=Base, 84532=Base Sepolia, 31337=local)").option("-s, --selector <type>", "Trip selector: claude, heuristic, random, historical, or graph").option("-r, --auto-respawn", "Automatically create new rat on death").option("-n, --name <name>", "Name for the rat").option("-l, --liquidate-at <value>", "Liquidate rat when total value reaches this threshold").option(
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