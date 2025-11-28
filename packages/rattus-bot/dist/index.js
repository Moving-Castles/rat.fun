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
    address: "0xAD73982AE505ba40d98b375B5f65C4B265a8C193",
    blockNumber: 33500368
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
    TripCreationCost: "uint256"
    // Initial balance of trip.
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
  try {
    await new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        reject(new Error("Sync timeout"));
      }, 3e4);
      const subscription = storedBlockLogs$.subscribe({
        next: (block) => {
          if (block.blockNumber > 0n) {
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            resolve();
          }
        },
        error: (err) => {
          clearTimeout(timeoutId);
          reject(err);
        }
      });
    });
    console.log("MUD sync complete!");
  } catch (e) {
    console.log("Warning: Sync timeout, proceeding with available data...");
  }
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

// src/modules/trip-selector/index.ts
async function selectTrip(configOrOptions, trips, rat, anthropic, outcomeHistory = [], worldAddress) {
  let config;
  let tripsArray;
  let ratObj;
  let anthropicClient;
  let history;
  let worldAddr;
  if ("config" in configOrOptions) {
    config = configOrOptions.config;
    tripsArray = configOrOptions.trips;
    ratObj = configOrOptions.rat;
    anthropicClient = configOrOptions.anthropic;
    history = configOrOptions.outcomeHistory ?? [];
    worldAddr = configOrOptions.worldAddress;
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
  if (config.liquidateBelowValue) {
    logInfo(`Liquidate below value: ${config.liquidateBelowValue}`);
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
    const selection = await selectTrip(config, enterableTrips, rat, anthropic, outcomeHistory, worldAddress);
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
        outcomeHistory.push({
          tripId: selectedTrip.id,
          tripPrompt: selectedTrip.prompt,
          totalValueBefore,
          totalValueAfter: 0,
          valueChange: -totalValueBefore,
          died: true,
          logSummary: logEntries.slice(0, 3).join(" | ")
        });
        saveOutcomeHistory(outcomeHistory);
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
          const changeStr = valueChange >= 0 ? `+${valueChange}` : `${valueChange}`;
          const inventoryItems = getInventoryDetails(mud, rat);
          const inventoryStr = inventoryItems.length > 0 ? `, Inventory: [${inventoryItems.map((i) => `${i.name}(${i.value})`).join(", ")}]` : "";
          logRat(
            rat.name,
            `Balance: ${rat.balance}, Total Value: ${totalValueAfter} (${changeStr}), Trips: ${tripCount}${inventoryStr}`
          );
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
var program = new Command().name("rattus-bot").description("Autonomous rat.fun player bot").version("1.0.0").option("-c, --chain <id>", "Chain ID (8453=Base, 84532=Base Sepolia, 31337=local)").option("-s, --selector <type>", "Trip selector: claude or heuristic").option("-r, --auto-respawn", "Automatically create new rat on death").option("-n, --name <name>", "Name for the rat").option("-l, --liquidate-at <value>", "Liquidate rat when total value reaches this threshold").option(
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