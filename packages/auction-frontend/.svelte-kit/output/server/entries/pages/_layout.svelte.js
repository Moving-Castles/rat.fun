import { s as store_get, u as unsubscribe_stores, e as ensure_array_like, a as attr_class, b as attr, c as clsx, d as stringify, f as bind_props, g as slot } from "../../chunks/index2.js";
import { V as ssr_context, W as escape_html } from "../../chunks/context.js";
import "howler";
import { w as writable, r as readable, d as derived, g as get$2 } from "../../chunks/index.js";
import "@latticexyz/common/actions";
import { resourceToHex } from "@latticexyz/common";
import { slice, erc20Abi, decodeErrorResult, BaseError, hexToBigInt, keccak256, toBytes, parseAbi as parseAbi$1, isHex, concatHex, maxUint256, parseEventLogs, encodePacked, parseAbiParameters, maxUint128, encodeAbiParameters, zeroAddress, formatUnits } from "viem";
import { parseAbi } from "abitype";
import { groupBy, mapObject } from "@latticexyz/common/utils";
import require$$1 from "tty";
import require$$1$1 from "util";
import require$$0 from "os";
import "@latticexyz/common/errors";
import { mudFoundry } from "@latticexyz/common/chains";
import { baseSepolia, base } from "viem/chains";
import require$$0$5 from "events";
import require$$1$4 from "https";
import require$$2 from "http";
import require$$3 from "net";
import require$$4 from "tls";
import require$$1$3 from "crypto";
import require$$0$4 from "stream";
import require$$7 from "url";
import require$$0$2 from "zlib";
import require$$0$1 from "fs";
import require$$1$2 from "path";
import require$$0$3 from "buffer";
import { getAddresses, DYNAMIC_FEE_FLAG } from "@whetstone-research/doppler-sdk";
import * as Sentry from "@sentry/sveltekit";
import { simulateContract, signTypedData, watchAsset } from "viem/actions";
import gsap from "gsap";
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function onDestroy(fn) {
  /** @type {SSRContext} */
  ssr_context.r.on_destroy(fn);
}
const ratfunUI = {
  tick: {
    src: "/sounds/ratfun/ui/tick.mp3",
    author: "leo",
    volume: 1
  },
  bigButtonDown: {
    src: "/sounds/ratfun/ui/bigButton-down.mp3",
    author: "leo",
    volume: 1
  },
  bigButtonUp: {
    src: "/sounds/ratfun/ui/bigButton-up.mp3",
    author: "leo",
    volume: 1
  },
  smallButtonDown: {
    src: "/sounds/ratfun/ui/smallButton-down.mp3",
    author: "leo",
    volume: 1
  },
  smallButtonUp: {
    src: "/sounds/ratfun/ui/smallButton-up.mp3",
    author: "leo",
    volume: 0.5
  },
  boing: {
    src: "/sounds/ratfun/ui/boing.mp3",
    author: "leo",
    volume: 0.5
  }
};
const soundLibrary = {
  ratfunUI
};
function playSound(category, id, loop = false, fadeIn = false, pitch = 1, delay = 0, volume = void 0) {
  if (!soundLibrary[category]) {
    console.warn(`Sound category "${category}" not found in sound library`);
    return void 0;
  }
  if (!soundLibrary[category][id]) {
    console.warn(`Sound "${id}" not found in category "${category}"`);
    return void 0;
  }
  const sound = soundLibrary[category][id].sound;
  if (!sound) {
    console.warn(
      `Sound "${id}" in category "${category}" has not been initialized. Make sure to call initSound() first.`
    );
    return void 0;
  }
  if (volume !== void 0) {
    sound.volume(volume);
  }
  sound.loop(loop);
  sound.rate(pitch);
  const playWithDelay = () => {
    sound.play();
    if (fadeIn) {
      const FADE_TIME = 2e3;
      sound.fade(0, volume !== void 0 ? volume : soundLibrary[category][id].volume, FADE_TIME);
    }
  };
  if (delay > 0) {
    setTimeout(playWithDelay, delay);
  } else {
    playWithDelay();
  }
  return sound;
}
function randomPitch() {
  const max = 2;
  const min = 0.8;
  return Math.random() * (max - min) + min;
}
var AppError = class extends Error {
  constructor(code = "APP_ERROR", errorType = "Unknown error", message) {
    super(message);
    this.code = code;
    this.errorType = errorType;
  }
};
var BlockchainError = class extends AppError {
  constructor(code = "BLOCKCHAIN_ERROR", errorType = "Blockchain error", message) {
    super(code, errorType, message);
  }
};
var TransactionError = class extends BlockchainError {
  constructor(message, originalError) {
    super("TRANSACTION_ERROR", "Transaction failed", message);
    this.originalError = originalError;
  }
};
var TransactionRevertedError = class extends BlockchainError {
  constructor(message, reason, originalError) {
    super("TRANSACTION_REVERTED", "Transaction reverted", message);
    this.reason = reason;
    this.originalError = originalError;
  }
};
var InsufficientFundsError = class extends BlockchainError {
  constructor(message, originalError) {
    super("INSUFFICIENT_FUNDS", "Insufficient funds", message);
    this.originalError = originalError;
  }
};
var UserRejectedTransactionError = class extends BlockchainError {
  constructor(message = "User rejected the transaction", originalError) {
    super("USER_REJECTED", "Transaction rejected", message);
    this.originalError = originalError;
  }
};
var GasEstimationError = class extends BlockchainError {
  constructor(message, originalError) {
    super("GAS_ESTIMATION_ERROR", "Gas estimation failed", message);
    this.originalError = originalError;
  }
};
var GraphicsError = class extends AppError {
  constructor(code = "GRAPHICS_ERROR", errorType = "Graphics error", message) {
    super(code, errorType, message);
  }
};
var WebGLError = class extends GraphicsError {
  constructor(message, context) {
    super("WEBGL_ERROR", "WebGL error", message);
    this.context = context;
  }
};
var ShaderError = class extends GraphicsError {
  constructor(message, shaderType, shaderSource) {
    super("SHADER_ERROR", "Shader compilation error", message);
    this.shaderType = shaderType;
    this.shaderSource = shaderSource;
  }
};
var WebGLContextError = class extends GraphicsError {
  constructor(message = "Failed to create WebGL context") {
    super("WEBGL_CONTEXT_ERROR", "WebGL context error", message);
  }
};
var UniformLocationError = class extends GraphicsError {
  constructor(uniformName) {
    super(
      "UNIFORM_LOCATION_ERROR",
      "WebGL uniform error",
      `Could not find uniform location for: ${uniformName}`
    );
  }
};
var WebGLContextLimitError = class extends GraphicsError {
  constructor(message = "Too many active WebGL contexts", activeContexts2) {
    super("WEBGL_CONTEXT_LIMIT_ERROR", "WebGL context limit reached", message);
    this.activeContexts = activeContexts2;
  }
};
var ShaderInitializationError = class extends GraphicsError {
  constructor(message, shaderKey, originalError) {
    super("SHADER_INITIALIZATION_ERROR", "Shader initialization failed", message);
    this.shaderKey = shaderKey;
    this.originalError = originalError;
  }
};
var StateError = class extends AppError {
  constructor(code = "STATE_ERROR", errorType = "State management error", message) {
    super(code, errorType, message);
  }
};
var InvalidStateTransitionError = class extends StateError {
  constructor(code = "INVALID_STATE_TRANSITION_ERROR", errorType = "State management error", message) {
    super(code, errorType, message);
  }
};
const IWorldAbi = /* @__PURE__ */ JSON.parse('[{"type":"function","name":"batchCall","inputs":[{"name":"systemCalls","type":"tuple[]","internalType":"struct SystemCallData[]","components":[{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"callData","type":"bytes","internalType":"bytes"}]}],"outputs":[{"name":"returnDatas","type":"bytes[]","internalType":"bytes[]"}],"stateMutability":"nonpayable"},{"type":"function","name":"batchCallFrom","inputs":[{"name":"systemCalls","type":"tuple[]","internalType":"struct SystemCallFromData[]","components":[{"name":"from","type":"address","internalType":"address"},{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"callData","type":"bytes","internalType":"bytes"}]}],"outputs":[{"name":"returnDatas","type":"bytes[]","internalType":"bytes[]"}],"stateMutability":"nonpayable"},{"type":"function","name":"call","inputs":[{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"callData","type":"bytes","internalType":"bytes"}],"outputs":[{"name":"","type":"bytes","internalType":"bytes"}],"stateMutability":"payable"},{"type":"function","name":"callFrom","inputs":[{"name":"delegator","type":"address","internalType":"address"},{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"callData","type":"bytes","internalType":"bytes"}],"outputs":[{"name":"","type":"bytes","internalType":"bytes"}],"stateMutability":"payable"},{"type":"function","name":"creator","inputs":[],"outputs":[{"name":"","type":"address","internalType":"address"}],"stateMutability":"view"},{"type":"function","name":"deleteRecord","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"getDynamicField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","internalType":"uint8"}],"outputs":[{"name":"","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},{"type":"function","name":"getDynamicFieldLength","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","internalType":"uint8"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getDynamicFieldSlice","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","internalType":"uint8"},{"name":"start","type":"uint256","internalType":"uint256"},{"name":"end","type":"uint256","internalType":"uint256"}],"outputs":[{"name":"data","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},{"type":"function","name":"getField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"},{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"}],"outputs":[{"name":"data","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},{"type":"function","name":"getField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"}],"outputs":[{"name":"data","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},{"type":"function","name":"getFieldLayout","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"}],"outputs":[{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"}],"stateMutability":"view"},{"type":"function","name":"getFieldLength","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"},{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getFieldLength","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"getKeySchema","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"}],"outputs":[{"name":"keySchema","type":"bytes32","internalType":"Schema"}],"stateMutability":"view"},{"type":"function","name":"getRecord","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"}],"outputs":[{"name":"staticData","type":"bytes","internalType":"bytes"},{"name":"encodedLengths","type":"bytes32","internalType":"EncodedLengths"},{"name":"dynamicData","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},{"type":"function","name":"getRecord","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"}],"outputs":[{"name":"staticData","type":"bytes","internalType":"bytes"},{"name":"encodedLengths","type":"bytes32","internalType":"EncodedLengths"},{"name":"dynamicData","type":"bytes","internalType":"bytes"}],"stateMutability":"view"},{"type":"function","name":"getStaticField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"},{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"}],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},{"type":"function","name":"getValueSchema","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"}],"outputs":[{"name":"valueSchema","type":"bytes32","internalType":"Schema"}],"stateMutability":"view"},{"type":"function","name":"grantAccess","inputs":[{"name":"resourceId","type":"bytes32","internalType":"ResourceId"},{"name":"grantee","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"initialize","inputs":[{"name":"initModule","type":"address","internalType":"contract IModule"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"installModule","inputs":[{"name":"module","type":"address","internalType":"contract IModule"},{"name":"encodedArgs","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"installRootModule","inputs":[{"name":"module","type":"address","internalType":"contract IModule"},{"name":"encodedArgs","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"popFromDynamicField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","internalType":"uint8"},{"name":"byteLengthToPop","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"pushToDynamicField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","internalType":"uint8"},{"name":"dataToPush","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__applyOutcome","inputs":[{"name":"_ratId","type":"bytes32","internalType":"bytes32"},{"name":"_tripId","type":"bytes32","internalType":"bytes32"},{"name":"_balanceTransferToOrFromRat","type":"int256","internalType":"int256"},{"name":"_itemsToRemoveFromRat","type":"bytes32[]","internalType":"bytes32[]"},{"name":"_itemsToAddToRat","type":"tuple[]","internalType":"struct Item[]","components":[{"name":"name","type":"string","internalType":"string"},{"name":"value","type":"uint256","internalType":"uint256"}]}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__balanceOf","inputs":[{"name":"playerId","type":"bytes32","internalType":"bytes32"}],"outputs":[{"name":"","type":"uint256","internalType":"uint256"}],"stateMutability":"view"},{"type":"function","name":"ratfun__closeTrip","inputs":[{"name":"_tripId","type":"bytes32","internalType":"bytes32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__createRat","inputs":[{"name":"_name","type":"string","internalType":"string"}],"outputs":[{"name":"ratId","type":"bytes32","internalType":"bytes32"}],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__createTrip","inputs":[{"name":"_playerId","type":"bytes32","internalType":"bytes32"},{"name":"_tripId","type":"bytes32","internalType":"bytes32"},{"name":"_tripCreationCost","type":"uint256","internalType":"uint256"},{"name":"_prompt","type":"string","internalType":"string"}],"outputs":[{"name":"newTripId","type":"bytes32","internalType":"bytes32"}],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__giveCallerTokens","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__giveMasterKey","inputs":[{"name":"playerId","type":"bytes32","internalType":"bytes32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__liquidateRat","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__removeWorldEvent","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__setCooldownCloseTrip","inputs":[{"name":"_cooldownCloseTrip","type":"uint32","internalType":"uint32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__setMaxValuePerWin","inputs":[{"name":"_maxValuePerWin","type":"uint32","internalType":"uint32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__setMinRatValueToEnter","inputs":[{"name":"_minRatValueToEnter","type":"uint32","internalType":"uint32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__setRatsKilledForAdminAccess","inputs":[{"name":"_ratsKilledForAdminAccess","type":"uint32","internalType":"uint32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__setTaxationCloseTrip","inputs":[{"name":"_taxationCloseTrip","type":"uint32","internalType":"uint32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__setTaxationLiquidateRat","inputs":[{"name":"_taxationLiquidateRat","type":"uint32","internalType":"uint32"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__setWorldEvent","inputs":[{"name":"cmsId","type":"string","internalType":"string"},{"name":"title","type":"string","internalType":"string"},{"name":"prompt","type":"string","internalType":"string"},{"name":"durationInBlocks","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__spawn","inputs":[{"name":"_name","type":"string","internalType":"string"}],"outputs":[{"name":"playerId","type":"bytes32","internalType":"bytes32"}],"stateMutability":"nonpayable"},{"type":"function","name":"ratfun__unlockAdmin","inputs":[],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"registerDelegation","inputs":[{"name":"delegatee","type":"address","internalType":"address"},{"name":"delegationControlId","type":"bytes32","internalType":"ResourceId"},{"name":"initCallData","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"registerFunctionSelector","inputs":[{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"systemFunctionSignature","type":"string","internalType":"string"}],"outputs":[{"name":"worldFunctionSelector","type":"bytes4","internalType":"bytes4"}],"stateMutability":"nonpayable"},{"type":"function","name":"registerNamespace","inputs":[{"name":"namespaceId","type":"bytes32","internalType":"ResourceId"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"registerNamespaceDelegation","inputs":[{"name":"namespaceId","type":"bytes32","internalType":"ResourceId"},{"name":"delegationControlId","type":"bytes32","internalType":"ResourceId"},{"name":"initCallData","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"registerRootFunctionSelector","inputs":[{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"worldFunctionSignature","type":"string","internalType":"string"},{"name":"systemFunctionSignature","type":"string","internalType":"string"}],"outputs":[{"name":"worldFunctionSelector","type":"bytes4","internalType":"bytes4"}],"stateMutability":"nonpayable"},{"type":"function","name":"registerStoreHook","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"hookAddress","type":"address","internalType":"contract IStoreHook"},{"name":"enabledHooksBitmap","type":"uint8","internalType":"uint8"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"registerSystem","inputs":[{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"system","type":"address","internalType":"contract System"},{"name":"publicAccess","type":"bool","internalType":"bool"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"registerSystemHook","inputs":[{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"hookAddress","type":"address","internalType":"contract ISystemHook"},{"name":"enabledHooksBitmap","type":"uint8","internalType":"uint8"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"registerTable","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"},{"name":"keySchema","type":"bytes32","internalType":"Schema"},{"name":"valueSchema","type":"bytes32","internalType":"Schema"},{"name":"keyNames","type":"string[]","internalType":"string[]"},{"name":"fieldNames","type":"string[]","internalType":"string[]"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"renounceOwnership","inputs":[{"name":"namespaceId","type":"bytes32","internalType":"ResourceId"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"revokeAccess","inputs":[{"name":"resourceId","type":"bytes32","internalType":"ResourceId"},{"name":"grantee","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setDynamicField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","internalType":"uint8"},{"name":"data","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"},{"name":"data","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"},{"name":"data","type":"bytes","internalType":"bytes"},{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setRecord","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"staticData","type":"bytes","internalType":"bytes"},{"name":"encodedLengths","type":"bytes32","internalType":"EncodedLengths"},{"name":"dynamicData","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"setStaticField","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"fieldIndex","type":"uint8","internalType":"uint8"},{"name":"data","type":"bytes","internalType":"bytes"},{"name":"fieldLayout","type":"bytes32","internalType":"FieldLayout"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"spliceDynamicData","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","internalType":"uint8"},{"name":"startWithinField","type":"uint40","internalType":"uint40"},{"name":"deleteCount","type":"uint40","internalType":"uint40"},{"name":"data","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"spliceStaticData","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","internalType":"bytes32[]"},{"name":"start","type":"uint48","internalType":"uint48"},{"name":"data","type":"bytes","internalType":"bytes"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"storeVersion","inputs":[],"outputs":[{"name":"version","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},{"type":"function","name":"transferBalanceToAddress","inputs":[{"name":"fromNamespaceId","type":"bytes32","internalType":"ResourceId"},{"name":"toAddress","type":"address","internalType":"address"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferBalanceToNamespace","inputs":[{"name":"fromNamespaceId","type":"bytes32","internalType":"ResourceId"},{"name":"toNamespaceId","type":"bytes32","internalType":"ResourceId"},{"name":"amount","type":"uint256","internalType":"uint256"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"transferOwnership","inputs":[{"name":"namespaceId","type":"bytes32","internalType":"ResourceId"},{"name":"newOwner","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"unregisterDelegation","inputs":[{"name":"delegatee","type":"address","internalType":"address"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"unregisterNamespaceDelegation","inputs":[{"name":"namespaceId","type":"bytes32","internalType":"ResourceId"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"unregisterStoreHook","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"hookAddress","type":"address","internalType":"contract IStoreHook"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"unregisterSystemHook","inputs":[{"name":"systemId","type":"bytes32","internalType":"ResourceId"},{"name":"hookAddress","type":"address","internalType":"contract ISystemHook"}],"outputs":[],"stateMutability":"nonpayable"},{"type":"function","name":"worldVersion","inputs":[],"outputs":[{"name":"","type":"bytes32","internalType":"bytes32"}],"stateMutability":"view"},{"type":"event","name":"HelloStore","inputs":[{"name":"storeVersion","type":"bytes32","indexed":true,"internalType":"bytes32"}],"anonymous":false},{"type":"event","name":"HelloWorld","inputs":[{"name":"worldVersion","type":"bytes32","indexed":true,"internalType":"bytes32"}],"anonymous":false},{"type":"event","name":"Store_DeleteRecord","inputs":[{"name":"tableId","type":"bytes32","indexed":true,"internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","indexed":false,"internalType":"bytes32[]"}],"anonymous":false},{"type":"event","name":"Store_SetRecord","inputs":[{"name":"tableId","type":"bytes32","indexed":true,"internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","indexed":false,"internalType":"bytes32[]"},{"name":"staticData","type":"bytes","indexed":false,"internalType":"bytes"},{"name":"encodedLengths","type":"bytes32","indexed":false,"internalType":"EncodedLengths"},{"name":"dynamicData","type":"bytes","indexed":false,"internalType":"bytes"}],"anonymous":false},{"type":"event","name":"Store_SpliceDynamicData","inputs":[{"name":"tableId","type":"bytes32","indexed":true,"internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","indexed":false,"internalType":"bytes32[]"},{"name":"dynamicFieldIndex","type":"uint8","indexed":false,"internalType":"uint8"},{"name":"start","type":"uint48","indexed":false,"internalType":"uint48"},{"name":"deleteCount","type":"uint40","indexed":false,"internalType":"uint40"},{"name":"encodedLengths","type":"bytes32","indexed":false,"internalType":"EncodedLengths"},{"name":"data","type":"bytes","indexed":false,"internalType":"bytes"}],"anonymous":false},{"type":"event","name":"Store_SpliceStaticData","inputs":[{"name":"tableId","type":"bytes32","indexed":true,"internalType":"ResourceId"},{"name":"keyTuple","type":"bytes32[]","indexed":false,"internalType":"bytes32[]"},{"name":"start","type":"uint48","indexed":false,"internalType":"uint48"},{"name":"data","type":"bytes","indexed":false,"internalType":"bytes"}],"anonymous":false},{"type":"error","name":"EncodedLengths_InvalidLength","inputs":[{"name":"length","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"FieldLayout_Empty","inputs":[]},{"type":"error","name":"FieldLayout_InvalidStaticDataLength","inputs":[{"name":"staticDataLength","type":"uint256","internalType":"uint256"},{"name":"computedStaticDataLength","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"FieldLayout_StaticLengthDoesNotFitInAWord","inputs":[{"name":"index","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"FieldLayout_StaticLengthIsNotZero","inputs":[{"name":"index","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"FieldLayout_StaticLengthIsZero","inputs":[{"name":"index","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"FieldLayout_TooManyDynamicFields","inputs":[{"name":"numFields","type":"uint256","internalType":"uint256"},{"name":"maxFields","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"FieldLayout_TooManyFields","inputs":[{"name":"numFields","type":"uint256","internalType":"uint256"},{"name":"maxFields","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Module_AlreadyInstalled","inputs":[]},{"type":"error","name":"Module_MissingDependency","inputs":[{"name":"dependency","type":"address","internalType":"address"}]},{"type":"error","name":"Module_NonRootInstallNotSupported","inputs":[]},{"type":"error","name":"Module_RootInstallNotSupported","inputs":[]},{"type":"error","name":"Schema_InvalidLength","inputs":[{"name":"length","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Schema_StaticTypeAfterDynamicType","inputs":[]},{"type":"error","name":"Slice_OutOfBounds","inputs":[{"name":"data","type":"bytes","internalType":"bytes"},{"name":"start","type":"uint256","internalType":"uint256"},{"name":"end","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_IndexOutOfBounds","inputs":[{"name":"length","type":"uint256","internalType":"uint256"},{"name":"accessedIndex","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_InvalidBounds","inputs":[{"name":"start","type":"uint256","internalType":"uint256"},{"name":"end","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_InvalidFieldNamesLength","inputs":[{"name":"expected","type":"uint256","internalType":"uint256"},{"name":"received","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_InvalidKeyNamesLength","inputs":[{"name":"expected","type":"uint256","internalType":"uint256"},{"name":"received","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_InvalidResourceType","inputs":[{"name":"expected","type":"bytes2","internalType":"bytes2"},{"name":"resourceId","type":"bytes32","internalType":"ResourceId"},{"name":"resourceIdString","type":"string","internalType":"string"}]},{"type":"error","name":"Store_InvalidSplice","inputs":[{"name":"startWithinField","type":"uint40","internalType":"uint40"},{"name":"deleteCount","type":"uint40","internalType":"uint40"},{"name":"fieldLength","type":"uint40","internalType":"uint40"}]},{"type":"error","name":"Store_InvalidStaticDataLength","inputs":[{"name":"expected","type":"uint256","internalType":"uint256"},{"name":"received","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_InvalidValueSchemaDynamicLength","inputs":[{"name":"expected","type":"uint256","internalType":"uint256"},{"name":"received","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_InvalidValueSchemaLength","inputs":[{"name":"expected","type":"uint256","internalType":"uint256"},{"name":"received","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_InvalidValueSchemaStaticLength","inputs":[{"name":"expected","type":"uint256","internalType":"uint256"},{"name":"received","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"Store_TableAlreadyExists","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"tableIdString","type":"string","internalType":"string"}]},{"type":"error","name":"Store_TableNotFound","inputs":[{"name":"tableId","type":"bytes32","internalType":"ResourceId"},{"name":"tableIdString","type":"string","internalType":"string"}]},{"type":"error","name":"World_AccessDenied","inputs":[{"name":"resource","type":"string","internalType":"string"},{"name":"caller","type":"address","internalType":"address"}]},{"type":"error","name":"World_AlreadyInitialized","inputs":[]},{"type":"error","name":"World_CallbackNotAllowed","inputs":[{"name":"functionSelector","type":"bytes4","internalType":"bytes4"}]},{"type":"error","name":"World_DelegationNotFound","inputs":[{"name":"delegator","type":"address","internalType":"address"},{"name":"delegatee","type":"address","internalType":"address"}]},{"type":"error","name":"World_FunctionSelectorAlreadyExists","inputs":[{"name":"functionSelector","type":"bytes4","internalType":"bytes4"}]},{"type":"error","name":"World_FunctionSelectorNotFound","inputs":[{"name":"functionSelector","type":"bytes4","internalType":"bytes4"}]},{"type":"error","name":"World_InsufficientBalance","inputs":[{"name":"balance","type":"uint256","internalType":"uint256"},{"name":"amount","type":"uint256","internalType":"uint256"}]},{"type":"error","name":"World_InterfaceNotSupported","inputs":[{"name":"contractAddress","type":"address","internalType":"address"},{"name":"interfaceId","type":"bytes4","internalType":"bytes4"}]},{"type":"error","name":"World_InvalidNamespace","inputs":[{"name":"namespace","type":"bytes14","internalType":"bytes14"}]},{"type":"error","name":"World_InvalidResourceId","inputs":[{"name":"resourceId","type":"bytes32","internalType":"ResourceId"},{"name":"resourceIdString","type":"string","internalType":"string"}]},{"type":"error","name":"World_InvalidResourceType","inputs":[{"name":"expected","type":"bytes2","internalType":"bytes2"},{"name":"resourceId","type":"bytes32","internalType":"ResourceId"},{"name":"resourceIdString","type":"string","internalType":"string"}]},{"type":"error","name":"World_ResourceAlreadyExists","inputs":[{"name":"resourceId","type":"bytes32","internalType":"ResourceId"},{"name":"resourceIdString","type":"string","internalType":"string"}]},{"type":"error","name":"World_ResourceNotFound","inputs":[{"name":"resourceId","type":"bytes32","internalType":"ResourceId"},{"name":"resourceIdString","type":"string","internalType":"string"}]},{"type":"error","name":"World_SystemAlreadyExists","inputs":[{"name":"system","type":"address","internalType":"address"}]},{"type":"error","name":"World_UnlimitedDelegationNotAllowed","inputs":[]}]');
var ABIS = [erc20Abi, IWorldAbi];
function decodeRevertData(hexData) {
  const selector = slice(hexData, 0, 4);
  const parametersHex = slice(hexData, 4);
  for (const abi of ABIS) {
    try {
      const decoded = decodeErrorResult({
        abi,
        data: hexData
      });
      if (decoded) {
        const argsString = decoded.args ? `(${decoded.args.join(", ")})` : "";
        return `${decoded.errorName}${argsString}`;
      }
    } catch {
      continue;
    }
  }
  return `Unknown error: Selector ${selector}, Data: ${parametersHex}`;
}
function extractRevertData(errorMessage) {
  const reasonPattern = /with reason:\s*(0x[a-fA-F0-9]+)/;
  const reasonMatch = errorMessage.match(reasonPattern);
  if (reasonMatch) {
    return reasonMatch[1];
  }
  const hexPattern = /0x[a-fA-F0-9]{8,}/g;
  const matches = errorMessage.match(hexPattern);
  return matches ? matches[0] : null;
}
function parseViemError(error2) {
  console.log("parseViemError", error2);
  if (error2.name === "UserRejectedRequestError") {
    return new UserRejectedTransactionError(
      error2.shortMessage || "User rejected the transaction",
      error2
    );
  }
  if (error2.name === "InsufficientFundsError") {
    return new InsufficientFundsError(
      error2.shortMessage || "Insufficient funds for transaction",
      error2
    );
  }
  if (error2.name === "EstimateGasExecutionError") {
    return new GasEstimationError(error2.shortMessage || "Failed to estimate gas", error2);
  }
  if (error2.name === "TransactionExecutionError" || error2.name === "UserOperationExecutionError") {
    const cause = error2.cause;
    if (cause?.name === "UserRejectedRequestError") {
      return new UserRejectedTransactionError(
        cause.shortMessage || "User rejected the transaction",
        error2
      );
    }
    let revertReason = cause?.reason || cause?.shortMessage;
    const fullMessage = error2.message || error2.shortMessage || "";
    const revertData = extractRevertData(fullMessage);
    if (revertData) {
      const decoded = decodeRevertData(revertData);
      if (decoded) {
        revertReason = decoded;
      }
    }
    if (revertReason) {
      return new TransactionRevertedError(
        `Transaction reverted: ${revertReason}`,
        revertReason,
        error2
      );
    }
    return new TransactionError(error2.shortMessage || "Transaction execution failed", error2);
  }
  if (error2.name === "ContractFunctionExecutionError") {
    const cause = error2.cause;
    let revertReason = cause?.reason || cause?.shortMessage;
    const fullMessage = error2.message || error2.shortMessage || "";
    const revertData = extractRevertData(fullMessage);
    if (revertData) {
      const decoded = decodeRevertData(revertData);
      if (decoded) {
        revertReason = revertReason ? `${revertReason} (${decoded})` : decoded;
      }
    }
    if (revertReason) {
      return new TransactionRevertedError(
        `Contract call reverted: ${revertReason}`,
        revertReason,
        error2
      );
    }
    return new TransactionError(error2.shortMessage || "Contract function execution failed", error2);
  }
  return new TransactionError(error2.shortMessage || error2.message || "Transaction failed", error2);
}
const processMessage = (msg) => {
  return msg.split(" ").map((word) => {
    if (word.length > 32) {
      return `${word.substring(0, 32)}...`;
    }
    return word;
  }).join(" ");
};
class ToastManager {
  toasts = [];
  add(toast) {
    const id = crypto.randomUUID();
    const newToast = { id, type: "error", duration: 1e4, ...toast };
    newToast.message = processMessage(newToast.message);
    this.toasts.push(newToast);
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(
        () => {
          this.remove(id);
        },
        newToast.duration
      );
    }
    return id;
  }
  remove(id) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }
  clear() {
    this.toasts = [];
  }
}
const toastManager = new ToastManager();
function captureMessage(message, level = "error", context) {
  if (context) {
    Sentry.withScope((scope) => {
      Object.entries(context).forEach(([key, value]) => {
        scope.setExtra(key, value);
      });
      Sentry.captureMessage(message, level);
    });
  } else {
    Sentry.captureMessage(message, level);
  }
}
function errorHandler(error2, message = "") {
  let processedError = error2;
  if (error2 instanceof BaseError) {
    try {
      processedError = parseViemError(error2);
    } catch (parseError) {
      console.warn("Failed to parse potential viem error:", parseError);
    }
  }
  const errorCode = processedError instanceof AppError ? processedError.code : "UNKNOWN_ERROR";
  const processedMessage = processedError instanceof AppError ? processedError.message : processedError instanceof Error ? processedError.message : "";
  const messageParts = [message, processedMessage].filter((part) => part && part.length > 0);
  const errorMessage = messageParts.length ? `${errorCode}: ${messageParts.join(" ")}` : errorCode;
  let severity = "error";
  if (processedError instanceof AppError) {
    if (processedError.code === "USER_REJECTED") {
      severity = "info";
    } else if (processedError.code.includes("VALIDATION") || processedError.code.includes("CHARACTER_LIMIT")) {
      severity = "warning";
    } else if (processedError.code.includes("NETWORK") || processedError.code.includes("TIMEOUT")) {
      severity = "info";
    } else if (processedError.code.includes("WEBGL_CONTEXT") || processedError.code.includes("SHADER") || processedError.code.includes("GRAPHICS") || processedError.code.includes("WORLD_ADDRESS")) {
      severity = "error";
    }
  }
  const sentryContext = {
    url: window.location.href,
    errorCode,
    errorMessage,
    errorType: processedError instanceof AppError ? processedError.errorType : "UNKNOWN_ERROR"
  };
  toastManager.add({ message: errorMessage, type: severity });
  captureMessage(errorMessage, severity, sentryContext);
  console.error(processedError);
}
var UI = /* @__PURE__ */ ((UI2) => {
  UI2["LOADING"] = "loading";
  UI2["READY"] = "ready";
  UI2["ERROR"] = "error";
  return UI2;
})(UI || {});
const UIState = writable(UI.LOADING);
const isPhone = writable(false);
const isFirefox = writable(false);
const singleFrameRender = writable(false);
if (typeof window !== "undefined") {
  const firefoxDetected = navigator.userAgent.toLowerCase().includes("firefox");
  isFirefox.set(firefoxDetected);
  const checkPhone = () => {
    const phoneDetected = window.innerWidth <= 800;
    isPhone.set(phoneDetected);
    singleFrameRender.set(phoneDetected || firefoxDetected);
  };
  checkPhone();
  window.addEventListener("resize", checkPhone);
}
var storeSetRecordEvent$1 = "event Store_SetRecord(bytes32 indexed tableId, bytes32[] keyTuple, bytes staticData, bytes32 encodedLengths, bytes dynamicData)";
var storeSpliceStaticDataEvent$1 = "event Store_SpliceStaticData(bytes32 indexed tableId, bytes32[] keyTuple, uint48 start, bytes data)";
var storeSpliceDynamicDataEvent$1 = "event Store_SpliceDynamicData(bytes32 indexed tableId, bytes32[] keyTuple, uint8 dynamicFieldIndex, uint48 start, uint40 deleteCount, bytes32 encodedLengths, bytes data)";
var storeDeleteRecordEvent$1 = "event Store_DeleteRecord(bytes32 indexed tableId, bytes32[] keyTuple)";
var storeEvents$1 = [
  storeSetRecordEvent$1,
  storeSpliceStaticDataEvent$1,
  storeSpliceDynamicDataEvent$1,
  storeDeleteRecordEvent$1
];
parseAbi(storeEvents$1);
var schemaAbiTypes$1 = [
  "uint8",
  "uint16",
  "uint24",
  "uint32",
  "uint40",
  "uint48",
  "uint56",
  "uint64",
  "uint72",
  "uint80",
  "uint88",
  "uint96",
  "uint104",
  "uint112",
  "uint120",
  "uint128",
  "uint136",
  "uint144",
  "uint152",
  "uint160",
  "uint168",
  "uint176",
  "uint184",
  "uint192",
  "uint200",
  "uint208",
  "uint216",
  "uint224",
  "uint232",
  "uint240",
  "uint248",
  "uint256",
  "int8",
  "int16",
  "int24",
  "int32",
  "int40",
  "int48",
  "int56",
  "int64",
  "int72",
  "int80",
  "int88",
  "int96",
  "int104",
  "int112",
  "int120",
  "int128",
  "int136",
  "int144",
  "int152",
  "int160",
  "int168",
  "int176",
  "int184",
  "int192",
  "int200",
  "int208",
  "int216",
  "int224",
  "int232",
  "int240",
  "int248",
  "int256",
  "bytes1",
  "bytes2",
  "bytes3",
  "bytes4",
  "bytes5",
  "bytes6",
  "bytes7",
  "bytes8",
  "bytes9",
  "bytes10",
  "bytes11",
  "bytes12",
  "bytes13",
  "bytes14",
  "bytes15",
  "bytes16",
  "bytes17",
  "bytes18",
  "bytes19",
  "bytes20",
  "bytes21",
  "bytes22",
  "bytes23",
  "bytes24",
  "bytes25",
  "bytes26",
  "bytes27",
  "bytes28",
  "bytes29",
  "bytes30",
  "bytes31",
  "bytes32",
  "bool",
  "address",
  "uint8[]",
  "uint16[]",
  "uint24[]",
  "uint32[]",
  "uint40[]",
  "uint48[]",
  "uint56[]",
  "uint64[]",
  "uint72[]",
  "uint80[]",
  "uint88[]",
  "uint96[]",
  "uint104[]",
  "uint112[]",
  "uint120[]",
  "uint128[]",
  "uint136[]",
  "uint144[]",
  "uint152[]",
  "uint160[]",
  "uint168[]",
  "uint176[]",
  "uint184[]",
  "uint192[]",
  "uint200[]",
  "uint208[]",
  "uint216[]",
  "uint224[]",
  "uint232[]",
  "uint240[]",
  "uint248[]",
  "uint256[]",
  "int8[]",
  "int16[]",
  "int24[]",
  "int32[]",
  "int40[]",
  "int48[]",
  "int56[]",
  "int64[]",
  "int72[]",
  "int80[]",
  "int88[]",
  "int96[]",
  "int104[]",
  "int112[]",
  "int120[]",
  "int128[]",
  "int136[]",
  "int144[]",
  "int152[]",
  "int160[]",
  "int168[]",
  "int176[]",
  "int184[]",
  "int192[]",
  "int200[]",
  "int208[]",
  "int216[]",
  "int224[]",
  "int232[]",
  "int240[]",
  "int248[]",
  "int256[]",
  "bytes1[]",
  "bytes2[]",
  "bytes3[]",
  "bytes4[]",
  "bytes5[]",
  "bytes6[]",
  "bytes7[]",
  "bytes8[]",
  "bytes9[]",
  "bytes10[]",
  "bytes11[]",
  "bytes12[]",
  "bytes13[]",
  "bytes14[]",
  "bytes15[]",
  "bytes16[]",
  "bytes17[]",
  "bytes18[]",
  "bytes19[]",
  "bytes20[]",
  "bytes21[]",
  "bytes22[]",
  "bytes23[]",
  "bytes24[]",
  "bytes25[]",
  "bytes26[]",
  "bytes27[]",
  "bytes28[]",
  "bytes29[]",
  "bytes30[]",
  "bytes31[]",
  "bytes32[]",
  "bool[]",
  "address[]",
  "bytes",
  "string"
];
var staticAbiTypes$1 = schemaAbiTypes$1.slice(0, 98);
function isSchemaAbiType$1(abiType) {
  return schemaAbiTypes$1.includes(abiType);
}
function isStaticAbiType$1(abiType) {
  return staticAbiTypes$1.includes(abiType);
}
var fixedArrayPattern$1 = /\[\d+\]$/;
function isFixedArrayAbiType$1(abiType) {
  return typeof abiType === "string" && fixedArrayPattern$1.test(abiType) && isStaticAbiType$1(abiType.replace(fixedArrayPattern$1, ""));
}
function fixedArrayToArray$1(abiType) {
  return abiType.replace(fixedArrayPattern$1, "[]");
}
const flatMorph = (o, flatMapEntry) => {
  const inputIsArray = Array.isArray(o);
  const entries = Object.entries(o).flatMap((entry, i) => {
    const result = inputIsArray ? flatMapEntry(i, entry[1]) : flatMapEntry(...entry, i);
    const entrySet = Array.isArray(result[0]) || result.length === 0 ? (
      // if we have an empty array (for filtering) or an array with
      // another array as its first element, treat it as a list of
      result
    ) : [result];
    return entrySet;
  });
  const objectResult = Object.fromEntries(entries);
  return typeof entries[0]?.[0] === "number" ? Object.values(objectResult) : objectResult;
};
const wellFormedNumberMatcher = /^(?!^-0$)-?(?:0|[1-9]\d*)(?:\.\d*[1-9])?$/;
wellFormedNumberMatcher.test.bind(wellFormedNumberMatcher);
const wellFormedIntegerMatcher = /^(?:0|(?:-?[1-9]\d*))$/;
wellFormedIntegerMatcher.test.bind(wellFormedIntegerMatcher);
const integerLikeMatcher = /^-?\d+$/;
integerLikeMatcher.test.bind(integerLikeMatcher);
const prototypeKeysOf = (value) => {
  const result = [];
  let curr = value;
  while (curr !== Object.prototype && curr !== null && curr !== void 0) {
    for (const k of Object.getOwnPropertyNames(curr))
      if (k !== "constructor" && !result.includes(k))
        result.push(k);
    for (const symbol of Object.getOwnPropertySymbols(curr))
      if (!result.includes(symbol))
        result.push(symbol);
    curr = Object.getPrototypeOf(curr);
  }
  return result;
};
({
  bigint: prototypeKeysOf(0n),
  boolean: prototypeKeysOf(false),
  number: prototypeKeysOf(0),
  string: prototypeKeysOf(""),
  symbol: prototypeKeysOf(Symbol())
});
function get$1(input, key) {
  return typeof input === "object" && input != null && hasOwnKey$1(input, key) ? input[key] : void 0;
}
function hasOwnKey$1(object, key) {
  return typeof object === "object" && object !== null && object.hasOwnProperty(key);
}
function isObject$1(input) {
  return input != null && typeof input === "object";
}
function mergeIfUndefined$1(base2, defaults) {
  const keys = [.../* @__PURE__ */ new Set([...Object.keys(base2), ...Object.keys(defaults)])];
  return Object.fromEntries(
    keys.map((key) => [
      key,
      typeof base2[key] === "undefined" ? defaults[key] : base2[key]
    ])
  );
}
var CODEGEN_DEFAULTS$3 = {
  storeImportPath: "@latticexyz/store/src",
  userTypesFilename: "common.sol",
  outputDirectory: "codegen",
  indexFilename: "index.sol"
};
var TABLE_CODEGEN_DEFAULTS$1 = {
  outputDirectory: "tables",
  tableIdArgument: false,
  storeArgument: false
};
var TABLE_DEPLOY_DEFAULTS$1 = {
  disabled: false
};
var TABLE_DEFAULTS$1 = {
  namespaceLabel: "",
  type: "table"
};
var CONFIG_DEFAULTS$3 = {
  sourceDirectory: "src",
  namespace: ""
};
var AbiTypeScope$1 = {
  types: Object.fromEntries(schemaAbiTypes$1.map((abiType) => [abiType, abiType]))
};
function extendScope$1(scope, additionalTypes) {
  return {
    types: {
      ...scope.types,
      ...additionalTypes
    }
  };
}
function validateSchema$1(schema, scope = AbiTypeScope$1) {
  if (!isObject$1(schema)) {
    throw new Error(`Expected schema, received ${JSON.stringify(schema)}`);
  }
  for (const internalType of Object.values(schema)) {
    if (isFixedArrayAbiType$1(internalType)) continue;
    if (hasOwnKey$1(scope.types, internalType)) continue;
    throw new Error(`"${String(internalType)}" is not a valid type in this scope.`);
  }
}
function resolveSchema$1(schema, scope = AbiTypeScope$1) {
  return Object.fromEntries(
    Object.entries(schema).map(([key, internalType]) => [
      key,
      {
        type: isFixedArrayAbiType$1(internalType) ? fixedArrayToArray$1(internalType) : scope.types[internalType],
        internalType
      }
    ])
  );
}
function isSchemaInput$1(input, scope = AbiTypeScope$1) {
  return typeof input === "object" && input != null && Object.values(input).every((fieldType) => isFixedArrayAbiType$1(fieldType) || hasOwnKey$1(scope.types, fieldType));
}
function getValidKeys$1(schema, scope = AbiTypeScope$1) {
  return Object.entries(schema).filter(([, internalType]) => hasOwnKey$1(scope.types, internalType) && isStaticAbiType$1(scope.types[internalType])).map(([key]) => key);
}
function isValidPrimaryKey$1(key, schema, scope = AbiTypeScope$1) {
  return Array.isArray(key) && key.every(
    (key2) => hasOwnKey$1(schema, key2) && hasOwnKey$1(scope.types, schema[key2]) && isStaticAbiType$1(scope.types[schema[key2]])
  );
}
function validateTable$1(input, scope = AbiTypeScope$1, options = { inStoreContext: false }) {
  if (typeof input !== "object" || input == null) {
    throw new Error(`Expected full table config, got \`${JSON.stringify(input)}\``);
  }
  if (!hasOwnKey$1(input, "schema")) {
    throw new Error("Missing schema input");
  }
  validateSchema$1(input.schema, scope);
  if (!hasOwnKey$1(input, "key") || !isValidPrimaryKey$1(input["key"], input["schema"], scope)) {
    throw new Error(
      `Invalid key. Expected \`(${getValidKeys$1(input["schema"], scope).map((item) => `"${String(item)}"`).join(" | ")})[]\`, received \`${hasOwnKey$1(input, "key") && Array.isArray(input.key) ? `[${input.key.map((item) => `"${item}"`).join(", ")}]` : String(get$1(input, "key"))}\``
    );
  }
  if (hasOwnKey$1(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`Table \`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey$1(input, "namespaceLabel") && typeof input.namespaceLabel === "string" && (!hasOwnKey$1(input, "namespace") || typeof input.namespace !== "string") && input.namespaceLabel.length > 14) {
    throw new Error(
      `Table \`namespace\` defaults to \`namespaceLabel\`, but must fit into a \`bytes14\` and "${input.namespaceLabel}" is too long. Provide explicit \`namespace\` override.`
    );
  }
  if (hasOwnKey$1(input, "name") && typeof input.name === "string" && input.name.length > 16) {
    throw new Error(`Table \`name\` must fit into a \`bytes16\`, but "${input.name}" is too long.`);
  }
  if (options.inStoreContext && (hasOwnKey$1(input, "label") || hasOwnKey$1(input, "namespaceLabel") || hasOwnKey$1(input, "namespace"))) {
    throw new Error(
      "Overrides of `label`, `namespaceLabel`, and `namespace` are not allowed for tables in this context."
    );
  }
}
function resolveTableCodegen$1(input) {
  const options = input.codegen;
  return {
    outputDirectory: get$1(options, "outputDirectory") ?? TABLE_CODEGEN_DEFAULTS$1.outputDirectory,
    tableIdArgument: get$1(options, "tableIdArgument") ?? TABLE_CODEGEN_DEFAULTS$1.tableIdArgument,
    storeArgument: get$1(options, "storeArgument") ?? TABLE_CODEGEN_DEFAULTS$1.storeArgument,
    // dataStruct is true if there are at least 2 value fields
    dataStruct: get$1(options, "dataStruct") ?? Object.keys(input.schema).length - input.key.length > 1
  };
}
function resolveTable$1(input, scope = AbiTypeScope$1) {
  const namespaceLabel = input.namespaceLabel ?? TABLE_DEFAULTS$1.namespaceLabel;
  const namespace = input.namespace ?? namespaceLabel;
  const label = input.label;
  const name = input.name ?? label.slice(0, 16);
  const type = input.type ?? TABLE_DEFAULTS$1.type;
  const tableId = resourceToHex({ type, namespace, name });
  return {
    label,
    type,
    namespace,
    namespaceLabel,
    name,
    tableId,
    schema: resolveSchema$1(input.schema, scope),
    key: input.key,
    codegen: resolveTableCodegen$1(input),
    deploy: mergeIfUndefined$1(input.deploy ?? {}, TABLE_DEPLOY_DEFAULTS$1)
  };
}
function isTableShorthandInput$1(shorthand) {
  return typeof shorthand === "string" || isObject$1(shorthand) && Object.values(shorthand).every((value) => typeof value === "string");
}
function validateTableShorthand$1(shorthand, scope = AbiTypeScope$1) {
  if (typeof shorthand === "string") {
    if (isFixedArrayAbiType$1(shorthand) || hasOwnKey$1(scope.types, shorthand)) {
      return;
    }
    throw new Error(`Invalid ABI type. \`${shorthand}\` not found in scope.`);
  }
  if (typeof shorthand === "object" && shorthand !== null) {
    if (isSchemaInput$1(shorthand, scope)) {
      if (hasOwnKey$1(shorthand, "id") && isStaticAbiType$1(scope.types[shorthand.id])) {
        return;
      }
      throw new Error(`Invalid schema. Expected an \`id\` field with a static ABI type or an explicit \`key\` option.`);
    }
    throw new Error(`Invalid schema. Are you using invalid types or missing types in your scope?`);
  }
  throw new Error(`Invalid table shorthand.`);
}
function expandTableShorthand$1(shorthand, scope) {
  if (typeof shorthand === "string") {
    return {
      schema: {
        id: "bytes32",
        value: shorthand
      },
      key: ["id"]
    };
  }
  if (isSchemaInput$1(shorthand, scope)) {
    return {
      schema: shorthand,
      key: ["id"]
    };
  }
  return shorthand;
}
function validateTables$1(input, scope) {
  if (isObject$1(input)) {
    for (const table of Object.values(input)) {
      if (isTableShorthandInput$1(table)) {
        validateTableShorthand$1(table, scope);
      } else {
        validateTable$1(table, scope, { inStoreContext: true });
      }
    }
    return;
  }
  throw new Error(`Expected tables config, received ${JSON.stringify(input)}`);
}
function resolveTables$1(tables, scope) {
  return Object.fromEntries(
    Object.entries(tables).map(([label, table]) => {
      return [label, resolveTable$1(mergeIfUndefined$1(expandTableShorthand$1(table, scope), { label }), scope)];
    })
  );
}
function extractInternalType$1(userTypes) {
  return mapObject(userTypes, (userType) => userType.type);
}
function isUserTypes$1(userTypes) {
  return isObject$1(userTypes) && Object.values(userTypes).every((userType) => isSchemaAbiType$1(userType.type));
}
function scopeWithUserTypes$1(userTypes, scope = AbiTypeScope$1) {
  return isUserTypes$1(userTypes) ? extendScope$1(scope, extractInternalType$1(userTypes)) : scope;
}
function validateUserTypes$1(userTypes) {
  if (!isObject$1(userTypes)) {
    throw new Error(`Expected userTypes, received ${JSON.stringify(userTypes)}`);
  }
  for (const { type } of Object.values(userTypes)) {
    if (!hasOwnKey$1(AbiTypeScope$1.types, type)) {
      throw new Error(`"${String(type)}" is not a valid ABI type.`);
    }
  }
}
function isEnums$1(enums) {
  return typeof enums === "object" && enums != null && Object.values(enums).every((item) => Array.isArray(item) && item.every((element) => typeof element === "string"));
}
function scopeWithEnums$1(enums, scope = AbiTypeScope$1) {
  if (isEnums$1(enums)) {
    const enumScope = Object.fromEntries(Object.keys(enums).map((key) => [key, "uint8"]));
    return extendScope$1(scope, enumScope);
  }
  return scope;
}
function resolveEnums$1(enums) {
  return enums;
}
function mapEnums$1(enums) {
  return flatMorph(enums, (enumName, enumElements) => [
    enumName,
    flatMorph(enumElements, (enumIndex, enumElement) => [enumElement, enumIndex])
  ]);
}
function resolveCodegen$3(codegen) {
  return isObject$1(codegen) ? mergeIfUndefined$1(codegen, CODEGEN_DEFAULTS$3) : CODEGEN_DEFAULTS$3;
}
function validateNamespace$3(input, scope) {
  if (hasOwnKey$1(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`\`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey$1(input, "tables")) {
    validateTables$1(input.tables, scope);
  }
}
function resolveNamespace$3(input, scope = AbiTypeScope$1) {
  const namespaceLabel = input.label;
  const namespace = input.namespace ?? namespaceLabel.slice(0, 14);
  return {
    label: namespaceLabel,
    namespace,
    tables: resolveTables$1(
      flatMorph(input.tables ?? {}, (label, table) => {
        return [label, mergeIfUndefined$1(expandTableShorthand$1(table, scope), { namespace, namespaceLabel })];
      }),
      scope
    )
  };
}
function validateNamespaces$3(namespaces, scope) {
  if (!isObject$1(namespaces)) {
    throw new Error(`Expected namespaces, received ${JSON.stringify(namespaces)}`);
  }
  for (const namespace of Object.values(namespaces)) {
    validateNamespace$3(namespace, scope);
  }
}
function resolveNamespaces$3(input, scope) {
  if (!isObject$1(input)) {
    throw new Error(`Expected namespaces config, received ${JSON.stringify(input)}`);
  }
  const namespaces = flatMorph(input, (label, namespace) => [
    label,
    resolveNamespace$3(mergeIfUndefined$1(namespace, { label }), scope)
  ]);
  const duplicates = Array.from(groupBy(Object.values(namespaces), (namespace) => namespace.namespace).entries()).filter(([, entries]) => entries.length > 1).map(([namespace]) => namespace);
  if (duplicates.length > 0) {
    throw new Error(`Found namespaces defined more than once in config: ${duplicates.join(", ")}`);
  }
  return namespaces;
}
function flattenNamespacedTables$1(config) {
  return Object.fromEntries(
    Object.entries(config.namespaces).flatMap(
      ([namespaceLabel, namespace]) => Object.entries(namespace.tables).map(([tableLabel, table]) => [
        namespaceLabel === "" ? tableLabel : `${namespaceLabel}__${tableLabel}`,
        table
      ])
    )
  );
}
function extendedScope$1(input) {
  return scopeWithEnums$1(get$1(input, "enums"), scopeWithUserTypes$1(get$1(input, "userTypes")));
}
function validateStore$1(input) {
  const scope = extendedScope$1(input);
  if (hasOwnKey$1(input, "namespaces")) {
    if (hasOwnKey$1(input, "namespace") || hasOwnKey$1(input, "tables")) {
      throw new Error("Cannot use `namespaces` with `namespace` or `tables` keys.");
    }
    validateNamespaces$3(input.namespaces, scope);
  }
  if (hasOwnKey$1(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`\`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey$1(input, "tables")) {
    validateTables$1(input.tables, scope);
  }
  if (hasOwnKey$1(input, "userTypes")) {
    validateUserTypes$1(input.userTypes);
  }
}
function resolveStore$1(input) {
  const scope = extendedScope$1(input);
  const baseNamespace = input.namespace ?? CONFIG_DEFAULTS$3["namespace"];
  const namespaces = input.namespaces ? {
    multipleNamespaces: true,
    namespace: null,
    namespaces: resolveNamespaces$3(input.namespaces, scope)
  } : {
    multipleNamespaces: false,
    namespace: baseNamespace,
    namespaces: resolveNamespaces$3({ [baseNamespace]: input }, scope)
  };
  const tables = flattenNamespacedTables$1(namespaces);
  return {
    ...namespaces,
    tables,
    sourceDirectory: input.sourceDirectory ?? CONFIG_DEFAULTS$3["sourceDirectory"],
    userTypes: input.userTypes ?? {},
    enums: resolveEnums$1(input.enums ?? {}),
    enumValues: mapEnums$1(input.enums ?? {}),
    codegen: resolveCodegen$3(input.codegen)
  };
}
var src = { exports: {} };
var browser = { exports: {} };
var ms;
var hasRequiredMs;
function requireMs() {
  if (hasRequiredMs) return ms;
  hasRequiredMs = 1;
  var s = 1e3;
  var m = s * 60;
  var h = m * 60;
  var d = h * 24;
  var w = d * 7;
  var y = d * 365.25;
  ms = function(val, options) {
    options = options || {};
    var type = typeof val;
    if (type === "string" && val.length > 0) {
      return parse(val);
    } else if (type === "number" && isFinite(val)) {
      return options.long ? fmtLong(val) : fmtShort(val);
    }
    throw new Error(
      "val is not a non-empty string or a valid number. val=" + JSON.stringify(val)
    );
  };
  function parse(str) {
    str = String(str);
    if (str.length > 100) {
      return;
    }
    var match = /^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(
      str
    );
    if (!match) {
      return;
    }
    var n = parseFloat(match[1]);
    var type = (match[2] || "ms").toLowerCase();
    switch (type) {
      case "years":
      case "year":
      case "yrs":
      case "yr":
      case "y":
        return n * y;
      case "weeks":
      case "week":
      case "w":
        return n * w;
      case "days":
      case "day":
      case "d":
        return n * d;
      case "hours":
      case "hour":
      case "hrs":
      case "hr":
      case "h":
        return n * h;
      case "minutes":
      case "minute":
      case "mins":
      case "min":
      case "m":
        return n * m;
      case "seconds":
      case "second":
      case "secs":
      case "sec":
      case "s":
        return n * s;
      case "milliseconds":
      case "millisecond":
      case "msecs":
      case "msec":
      case "ms":
        return n;
      default:
        return void 0;
    }
  }
  function fmtShort(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return Math.round(ms2 / d) + "d";
    }
    if (msAbs >= h) {
      return Math.round(ms2 / h) + "h";
    }
    if (msAbs >= m) {
      return Math.round(ms2 / m) + "m";
    }
    if (msAbs >= s) {
      return Math.round(ms2 / s) + "s";
    }
    return ms2 + "ms";
  }
  function fmtLong(ms2) {
    var msAbs = Math.abs(ms2);
    if (msAbs >= d) {
      return plural(ms2, msAbs, d, "day");
    }
    if (msAbs >= h) {
      return plural(ms2, msAbs, h, "hour");
    }
    if (msAbs >= m) {
      return plural(ms2, msAbs, m, "minute");
    }
    if (msAbs >= s) {
      return plural(ms2, msAbs, s, "second");
    }
    return ms2 + " ms";
  }
  function plural(ms2, msAbs, n, name) {
    var isPlural = msAbs >= n * 1.5;
    return Math.round(ms2 / n) + " " + name + (isPlural ? "s" : "");
  }
  return ms;
}
var common;
var hasRequiredCommon;
function requireCommon() {
  if (hasRequiredCommon) return common;
  hasRequiredCommon = 1;
  function setup(env) {
    createDebug2.debug = createDebug2;
    createDebug2.default = createDebug2;
    createDebug2.coerce = coerce2;
    createDebug2.disable = disable;
    createDebug2.enable = enable;
    createDebug2.enabled = enabled;
    createDebug2.humanize = requireMs();
    createDebug2.destroy = destroy;
    Object.keys(env).forEach((key) => {
      createDebug2[key] = env[key];
    });
    createDebug2.names = [];
    createDebug2.skips = [];
    createDebug2.formatters = {};
    function selectColor(namespace) {
      let hash = 0;
      for (let i = 0; i < namespace.length; i++) {
        hash = (hash << 5) - hash + namespace.charCodeAt(i);
        hash |= 0;
      }
      return createDebug2.colors[Math.abs(hash) % createDebug2.colors.length];
    }
    createDebug2.selectColor = selectColor;
    function createDebug2(namespace) {
      let prevTime;
      let enableOverride = null;
      let namespacesCache;
      let enabledCache;
      function debug3(...args) {
        if (!debug3.enabled) {
          return;
        }
        const self2 = debug3;
        const curr = Number(/* @__PURE__ */ new Date());
        const ms2 = curr - (prevTime || curr);
        self2.diff = ms2;
        self2.prev = prevTime;
        self2.curr = curr;
        prevTime = curr;
        args[0] = createDebug2.coerce(args[0]);
        if (typeof args[0] !== "string") {
          args.unshift("%O");
        }
        let index = 0;
        args[0] = args[0].replace(/%([a-zA-Z%])/g, (match, format) => {
          if (match === "%%") {
            return "%";
          }
          index++;
          const formatter = createDebug2.formatters[format];
          if (typeof formatter === "function") {
            const val = args[index];
            match = formatter.call(self2, val);
            args.splice(index, 1);
            index--;
          }
          return match;
        });
        createDebug2.formatArgs.call(self2, args);
        const logFn = self2.log || createDebug2.log;
        logFn.apply(self2, args);
      }
      debug3.namespace = namespace;
      debug3.useColors = createDebug2.useColors();
      debug3.color = createDebug2.selectColor(namespace);
      debug3.extend = extend;
      debug3.destroy = createDebug2.destroy;
      Object.defineProperty(debug3, "enabled", {
        enumerable: true,
        configurable: false,
        get: () => {
          if (enableOverride !== null) {
            return enableOverride;
          }
          if (namespacesCache !== createDebug2.namespaces) {
            namespacesCache = createDebug2.namespaces;
            enabledCache = createDebug2.enabled(namespace);
          }
          return enabledCache;
        },
        set: (v) => {
          enableOverride = v;
        }
      });
      if (typeof createDebug2.init === "function") {
        createDebug2.init(debug3);
      }
      return debug3;
    }
    function extend(namespace, delimiter) {
      const newDebug = createDebug2(this.namespace + (typeof delimiter === "undefined" ? ":" : delimiter) + namespace);
      newDebug.log = this.log;
      return newDebug;
    }
    function enable(namespaces) {
      createDebug2.save(namespaces);
      createDebug2.namespaces = namespaces;
      createDebug2.names = [];
      createDebug2.skips = [];
      const split = (typeof namespaces === "string" ? namespaces : "").trim().replace(/\s+/g, ",").split(",").filter(Boolean);
      for (const ns of split) {
        if (ns[0] === "-") {
          createDebug2.skips.push(ns.slice(1));
        } else {
          createDebug2.names.push(ns);
        }
      }
    }
    function matchesTemplate(search, template) {
      let searchIndex = 0;
      let templateIndex = 0;
      let starIndex = -1;
      let matchIndex = 0;
      while (searchIndex < search.length) {
        if (templateIndex < template.length && (template[templateIndex] === search[searchIndex] || template[templateIndex] === "*")) {
          if (template[templateIndex] === "*") {
            starIndex = templateIndex;
            matchIndex = searchIndex;
            templateIndex++;
          } else {
            searchIndex++;
            templateIndex++;
          }
        } else if (starIndex !== -1) {
          templateIndex = starIndex + 1;
          matchIndex++;
          searchIndex = matchIndex;
        } else {
          return false;
        }
      }
      while (templateIndex < template.length && template[templateIndex] === "*") {
        templateIndex++;
      }
      return templateIndex === template.length;
    }
    function disable() {
      const namespaces = [
        ...createDebug2.names,
        ...createDebug2.skips.map((namespace) => "-" + namespace)
      ].join(",");
      createDebug2.enable("");
      return namespaces;
    }
    function enabled(name) {
      for (const skip of createDebug2.skips) {
        if (matchesTemplate(name, skip)) {
          return false;
        }
      }
      for (const ns of createDebug2.names) {
        if (matchesTemplate(name, ns)) {
          return true;
        }
      }
      return false;
    }
    function coerce2(val) {
      if (val instanceof Error) {
        return val.stack || val.message;
      }
      return val;
    }
    function destroy() {
      console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
    }
    createDebug2.enable(createDebug2.load());
    return createDebug2;
  }
  common = setup;
  return common;
}
var hasRequiredBrowser;
function requireBrowser() {
  if (hasRequiredBrowser) return browser.exports;
  hasRequiredBrowser = 1;
  (function(module, exports) {
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.storage = localstorage();
    exports.destroy = /* @__PURE__ */ (() => {
      let warned = false;
      return () => {
        if (!warned) {
          warned = true;
          console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.");
        }
      };
    })();
    exports.colors = [
      "#0000CC",
      "#0000FF",
      "#0033CC",
      "#0033FF",
      "#0066CC",
      "#0066FF",
      "#0099CC",
      "#0099FF",
      "#00CC00",
      "#00CC33",
      "#00CC66",
      "#00CC99",
      "#00CCCC",
      "#00CCFF",
      "#3300CC",
      "#3300FF",
      "#3333CC",
      "#3333FF",
      "#3366CC",
      "#3366FF",
      "#3399CC",
      "#3399FF",
      "#33CC00",
      "#33CC33",
      "#33CC66",
      "#33CC99",
      "#33CCCC",
      "#33CCFF",
      "#6600CC",
      "#6600FF",
      "#6633CC",
      "#6633FF",
      "#66CC00",
      "#66CC33",
      "#9900CC",
      "#9900FF",
      "#9933CC",
      "#9933FF",
      "#99CC00",
      "#99CC33",
      "#CC0000",
      "#CC0033",
      "#CC0066",
      "#CC0099",
      "#CC00CC",
      "#CC00FF",
      "#CC3300",
      "#CC3333",
      "#CC3366",
      "#CC3399",
      "#CC33CC",
      "#CC33FF",
      "#CC6600",
      "#CC6633",
      "#CC9900",
      "#CC9933",
      "#CCCC00",
      "#CCCC33",
      "#FF0000",
      "#FF0033",
      "#FF0066",
      "#FF0099",
      "#FF00CC",
      "#FF00FF",
      "#FF3300",
      "#FF3333",
      "#FF3366",
      "#FF3399",
      "#FF33CC",
      "#FF33FF",
      "#FF6600",
      "#FF6633",
      "#FF9900",
      "#FF9933",
      "#FFCC00",
      "#FFCC33"
    ];
    function useColors() {
      if (typeof window !== "undefined" && window.process && (window.process.type === "renderer" || window.process.__nwjs)) {
        return true;
      }
      if (typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)) {
        return false;
      }
      let m;
      return typeof document !== "undefined" && document.documentElement && document.documentElement.style && document.documentElement.style.WebkitAppearance || // Is firebug? http://stackoverflow.com/a/398120/376773
      typeof window !== "undefined" && window.console && (window.console.firebug || window.console.exception && window.console.table) || // Is firefox >= v31?
      // https://developer.mozilla.org/en-US/docs/Tools/Web_Console#Styling_messages
      typeof navigator !== "undefined" && navigator.userAgent && (m = navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)) && parseInt(m[1], 10) >= 31 || // Double check webkit in userAgent just in case we are in a worker
      typeof navigator !== "undefined" && navigator.userAgent && navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/);
    }
    function formatArgs(args) {
      args[0] = (this.useColors ? "%c" : "") + this.namespace + (this.useColors ? " %c" : " ") + args[0] + (this.useColors ? "%c " : " ") + "+" + module.exports.humanize(this.diff);
      if (!this.useColors) {
        return;
      }
      const c = "color: " + this.color;
      args.splice(1, 0, c, "color: inherit");
      let index = 0;
      let lastC = 0;
      args[0].replace(/%[a-zA-Z%]/g, (match) => {
        if (match === "%%") {
          return;
        }
        index++;
        if (match === "%c") {
          lastC = index;
        }
      });
      args.splice(lastC, 0, c);
    }
    exports.log = console.debug || console.log || (() => {
    });
    function save(namespaces) {
      try {
        if (namespaces) {
          exports.storage.setItem("debug", namespaces);
        } else {
          exports.storage.removeItem("debug");
        }
      } catch (error2) {
      }
    }
    function load() {
      let r;
      try {
        r = exports.storage.getItem("debug") || exports.storage.getItem("DEBUG");
      } catch (error2) {
      }
      if (!r && typeof process !== "undefined" && "env" in process) {
        r = process.env.DEBUG;
      }
      return r;
    }
    function localstorage() {
      try {
        return localStorage;
      } catch (error2) {
      }
    }
    module.exports = requireCommon()(exports);
    const { formatters } = module.exports;
    formatters.j = function(v) {
      try {
        return JSON.stringify(v);
      } catch (error2) {
        return "[UnexpectedJSONParseError]: " + error2.message;
      }
    };
  })(browser, browser.exports);
  return browser.exports;
}
var node$1 = { exports: {} };
var hasFlag;
var hasRequiredHasFlag;
function requireHasFlag() {
  if (hasRequiredHasFlag) return hasFlag;
  hasRequiredHasFlag = 1;
  hasFlag = (flag, argv = process.argv) => {
    const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
    const position = argv.indexOf(prefix + flag);
    const terminatorPosition = argv.indexOf("--");
    return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
  };
  return hasFlag;
}
var supportsColor_1;
var hasRequiredSupportsColor;
function requireSupportsColor() {
  if (hasRequiredSupportsColor) return supportsColor_1;
  hasRequiredSupportsColor = 1;
  const os = require$$0;
  const tty = require$$1;
  const hasFlag2 = requireHasFlag();
  const { env } = process;
  let flagForceColor;
  if (hasFlag2("no-color") || hasFlag2("no-colors") || hasFlag2("color=false") || hasFlag2("color=never")) {
    flagForceColor = 0;
  } else if (hasFlag2("color") || hasFlag2("colors") || hasFlag2("color=true") || hasFlag2("color=always")) {
    flagForceColor = 1;
  }
  function envForceColor() {
    if ("FORCE_COLOR" in env) {
      if (env.FORCE_COLOR === "true") {
        return 1;
      }
      if (env.FORCE_COLOR === "false") {
        return 0;
      }
      return env.FORCE_COLOR.length === 0 ? 1 : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
    }
  }
  function translateLevel(level) {
    if (level === 0) {
      return false;
    }
    return {
      level,
      hasBasic: true,
      has256: level >= 2,
      has16m: level >= 3
    };
  }
  function supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
    const noFlagForceColor = envForceColor();
    if (noFlagForceColor !== void 0) {
      flagForceColor = noFlagForceColor;
    }
    const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
    if (forceColor === 0) {
      return 0;
    }
    if (sniffFlags) {
      if (hasFlag2("color=16m") || hasFlag2("color=full") || hasFlag2("color=truecolor")) {
        return 3;
      }
      if (hasFlag2("color=256")) {
        return 2;
      }
    }
    if (haveStream && !streamIsTTY && forceColor === void 0) {
      return 0;
    }
    const min = forceColor || 0;
    if (env.TERM === "dumb") {
      return min;
    }
    if (process.platform === "win32") {
      const osRelease = os.release().split(".");
      if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
        return Number(osRelease[2]) >= 14931 ? 3 : 2;
      }
      return 1;
    }
    if ("CI" in env) {
      if (["TRAVIS", "CIRCLECI", "APPVEYOR", "GITLAB_CI", "GITHUB_ACTIONS", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
        return 1;
      }
      return min;
    }
    if ("TEAMCITY_VERSION" in env) {
      return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
    }
    if (env.COLORTERM === "truecolor") {
      return 3;
    }
    if ("TERM_PROGRAM" in env) {
      const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".")[0], 10);
      switch (env.TERM_PROGRAM) {
        case "iTerm.app":
          return version >= 3 ? 3 : 2;
        case "Apple_Terminal":
          return 2;
      }
    }
    if (/-256(color)?$/i.test(env.TERM)) {
      return 2;
    }
    if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
      return 1;
    }
    if ("COLORTERM" in env) {
      return 1;
    }
    return min;
  }
  function getSupportLevel(stream2, options = {}) {
    const level = supportsColor(stream2, {
      streamIsTTY: stream2 && stream2.isTTY,
      ...options
    });
    return translateLevel(level);
  }
  supportsColor_1 = {
    supportsColor: getSupportLevel,
    stdout: getSupportLevel({ isTTY: tty.isatty(1) }),
    stderr: getSupportLevel({ isTTY: tty.isatty(2) })
  };
  return supportsColor_1;
}
var hasRequiredNode$1;
function requireNode$1() {
  if (hasRequiredNode$1) return node$1.exports;
  hasRequiredNode$1 = 1;
  (function(module, exports) {
    const tty = require$$1;
    const util2 = require$$1$1;
    exports.init = init;
    exports.log = log;
    exports.formatArgs = formatArgs;
    exports.save = save;
    exports.load = load;
    exports.useColors = useColors;
    exports.destroy = util2.deprecate(
      () => {
      },
      "Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."
    );
    exports.colors = [6, 2, 3, 4, 5, 1];
    try {
      const supportsColor = requireSupportsColor();
      if (supportsColor && (supportsColor.stderr || supportsColor).level >= 2) {
        exports.colors = [
          20,
          21,
          26,
          27,
          32,
          33,
          38,
          39,
          40,
          41,
          42,
          43,
          44,
          45,
          56,
          57,
          62,
          63,
          68,
          69,
          74,
          75,
          76,
          77,
          78,
          79,
          80,
          81,
          92,
          93,
          98,
          99,
          112,
          113,
          128,
          129,
          134,
          135,
          148,
          149,
          160,
          161,
          162,
          163,
          164,
          165,
          166,
          167,
          168,
          169,
          170,
          171,
          172,
          173,
          178,
          179,
          184,
          185,
          196,
          197,
          198,
          199,
          200,
          201,
          202,
          203,
          204,
          205,
          206,
          207,
          208,
          209,
          214,
          215,
          220,
          221
        ];
      }
    } catch (error2) {
    }
    exports.inspectOpts = Object.keys(process.env).filter((key) => {
      return /^debug_/i.test(key);
    }).reduce((obj, key) => {
      const prop = key.substring(6).toLowerCase().replace(/_([a-z])/g, (_, k) => {
        return k.toUpperCase();
      });
      let val = process.env[key];
      if (/^(yes|on|true|enabled)$/i.test(val)) {
        val = true;
      } else if (/^(no|off|false|disabled)$/i.test(val)) {
        val = false;
      } else if (val === "null") {
        val = null;
      } else {
        val = Number(val);
      }
      obj[prop] = val;
      return obj;
    }, {});
    function useColors() {
      return "colors" in exports.inspectOpts ? Boolean(exports.inspectOpts.colors) : tty.isatty(process.stderr.fd);
    }
    function formatArgs(args) {
      const { namespace: name, useColors: useColors2 } = this;
      if (useColors2) {
        const c = this.color;
        const colorCode = "\x1B[3" + (c < 8 ? c : "8;5;" + c);
        const prefix = `  ${colorCode};1m${name} \x1B[0m`;
        args[0] = prefix + args[0].split("\n").join("\n" + prefix);
        args.push(colorCode + "m+" + module.exports.humanize(this.diff) + "\x1B[0m");
      } else {
        args[0] = getDate() + name + " " + args[0];
      }
    }
    function getDate() {
      if (exports.inspectOpts.hideDate) {
        return "";
      }
      return (/* @__PURE__ */ new Date()).toISOString() + " ";
    }
    function log(...args) {
      return process.stderr.write(util2.formatWithOptions(exports.inspectOpts, ...args) + "\n");
    }
    function save(namespaces) {
      if (namespaces) {
        process.env.DEBUG = namespaces;
      } else {
        delete process.env.DEBUG;
      }
    }
    function load() {
      return process.env.DEBUG;
    }
    function init(debug3) {
      debug3.inspectOpts = {};
      const keys = Object.keys(exports.inspectOpts);
      for (let i = 0; i < keys.length; i++) {
        debug3.inspectOpts[keys[i]] = exports.inspectOpts[keys[i]];
      }
    }
    module.exports = requireCommon()(exports);
    const { formatters } = module.exports;
    formatters.o = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts).split("\n").map((str) => str.trim()).join(" ");
    };
    formatters.O = function(v) {
      this.inspectOpts.colors = this.useColors;
      return util2.inspect(v, this.inspectOpts);
    };
  })(node$1, node$1.exports);
  return node$1.exports;
}
var hasRequiredSrc;
function requireSrc() {
  if (hasRequiredSrc) return src.exports;
  hasRequiredSrc = 1;
  if (typeof process === "undefined" || process.type === "renderer" || process.browser === true || process.__nwjs) {
    src.exports = requireBrowser();
  } else {
    src.exports = requireNode$1();
  }
  return src.exports;
}
var srcExports = requireSrc();
const createDebug = /* @__PURE__ */ getDefaultExportFromCjs(srcExports);
var debug$3 = createDebug("mud:store");
debug$3.log = console.debug.bind(console);
var error$4 = createDebug("mud:store");
error$4.log = console.error.bind(console);
hexToBigInt(keccak256(toBytes("mud.store")));
var SYSTEM_DEPLOY_DEFAULTS$1 = {
  disabled: false,
  registerWorldFunctions: true
};
var SYSTEM_DEFAULTS$1 = {
  namespaceLabel: "",
  openAccess: true,
  accessList: []
};
var MODULE_DEFAULTS$1 = {
  root: false,
  useDelegation: false,
  args: [],
  artifactPath: void 0
};
var CODEGEN_DEFAULTS$2 = {
  worldInterfaceName: "IWorld",
  worldgenDirectory: "world",
  systemLibrariesDirectory: "systems",
  generateSystemLibraries: false,
  worldImportPath: "@latticexyz/world/src"
};
var DEPLOY_DEFAULTS$1 = {
  postDeployScript: "PostDeploy",
  deploysDirectory: "./deploys",
  worldsFile: "./worlds.json",
  upgradeableWorldImplementation: false
};
var CONFIG_DEFAULTS$2 = {
  systems: {},
  tables: {},
  excludeSystems: [],
  modules: [],
  codegen: CODEGEN_DEFAULTS$2,
  deploy: DEPLOY_DEFAULTS$1
};
function validateSystem$1(input, options = {}) {
  if (typeof input !== "object" || input == null) {
    throw new Error(`Expected full system config, got \`${JSON.stringify(input)}\``);
  }
  if (options.inNamespace && (hasOwnKey$1(input, "label") || hasOwnKey$1(input, "namespaceLabel") || hasOwnKey$1(input, "namespace"))) {
    throw new Error(
      "Overrides of `label`, `namespaceLabel`, and `namespace` are not allowed for systems in this context."
    );
  }
  if (hasOwnKey$1(input, "namespaceLabel") && typeof input.namespaceLabel === "string" && (!hasOwnKey$1(input, "namespace") || typeof input.namespace !== "string") && input.namespaceLabel.length > 14) {
    throw new Error(
      `System \`namespace\` defaults to \`namespaceLabel\`, but must fit into a \`bytes14\` and "${input.namespaceLabel}" is too long. Provide explicit \`namespace\` override.`
    );
  }
  if (hasOwnKey$1(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`System \`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey$1(input, "name") && typeof input.name === "string" && input.name.length > 16) {
    throw new Error(`System \`name\` must fit into a \`bytes16\`, but "${input.name}" is too long.`);
  }
}
function resolveSystem$1(input) {
  const namespaceLabel = input.namespaceLabel ?? SYSTEM_DEFAULTS$1.namespaceLabel;
  const namespace = input.namespace ?? namespaceLabel;
  const label = input.label;
  const name = input.name ?? label.slice(0, 16);
  const systemId = resourceToHex({ type: "system", namespace, name });
  return mergeIfUndefined$1(
    {
      ...input,
      label,
      namespaceLabel,
      namespace,
      name,
      systemId,
      deploy: mergeIfUndefined$1(input.deploy ?? {}, SYSTEM_DEPLOY_DEFAULTS$1)
    },
    SYSTEM_DEFAULTS$1
  );
}
function validateSystems$1(input) {
  if (isObject$1(input)) {
    for (const system of Object.values(input)) {
      validateSystem$1(system, { inNamespace: true });
    }
    return;
  }
  throw new Error(`Expected system config, received ${JSON.stringify(input)}`);
}
function resolveSystems$1(systems, namespaceLabel, namespace) {
  return Object.fromEntries(
    Object.entries(systems).map(([label, system]) => {
      return [label, resolveSystem$1({ ...system, label, namespaceLabel, namespace })];
    })
  );
}
function validateNamespace$2(input, scope) {
  if (hasOwnKey$1(input, "systems")) {
    validateSystems$1(input.systems);
  }
  validateNamespace$3(input, scope);
}
function resolveNamespace$2(input, scope = AbiTypeScope$1) {
  const namespace = resolveNamespace$3(input, scope);
  const systems = resolveSystems$1(input.systems ?? {}, namespace.label, namespace.namespace);
  return {
    ...namespace,
    systems
  };
}
function validateNamespaces$2(namespaces, scope) {
  if (!isObject$1(namespaces)) {
    throw new Error(`Expected namespaces, received ${JSON.stringify(namespaces)}`);
  }
  for (const namespace of Object.values(namespaces)) {
    validateNamespace$2(namespace, scope);
  }
}
function resolveNamespaces$2(input, scope) {
  if (!isObject$1(input)) {
    throw new Error(`Expected namespaces config, received ${JSON.stringify(input)}`);
  }
  const namespaces = flatMorph(input, (label, namespace) => [
    label,
    resolveNamespace$2(mergeIfUndefined$1(namespace, { label }), scope)
  ]);
  const duplicates = Array.from(groupBy(Object.values(namespaces), (namespace) => namespace.namespace).entries()).filter(([, entries]) => entries.length > 1).map(([namespace]) => namespace);
  if (duplicates.length > 0) {
    throw new Error(`Found namespaces defined more than once in config: ${duplicates.join(", ")}`);
  }
  return namespaces;
}
function resolveCodegen$2(codegen) {
  return isObject$1(codegen) ? mergeIfUndefined$1(codegen, CODEGEN_DEFAULTS$2) : CODEGEN_DEFAULTS$2;
}
function resolveDeploy$1(deploy) {
  return isObject$1(deploy) ? mergeIfUndefined$1(deploy, DEPLOY_DEFAULTS$1) : DEPLOY_DEFAULTS$1;
}
function validateWorld$1(input) {
  const scope = extendedScope$1(input);
  if (hasOwnKey$1(input, "namespaces")) {
    if (hasOwnKey$1(input, "namespace") || hasOwnKey$1(input, "tables") || hasOwnKey$1(input, "systems")) {
      throw new Error("Cannot use `namespaces` with `namespace`, `tables`, or `systems` keys.");
    }
    validateNamespaces$2(input.namespaces, scope);
  }
  if (hasOwnKey$1(input, "systems")) {
    validateSystems$1(input.systems);
  }
  validateStore$1(input);
}
function resolveWorld$1(input) {
  const scope = extendedScope$1(input);
  const store = resolveStore$1(input);
  const namespaces = input.namespaces ? resolveNamespaces$2(input.namespaces, scope) : resolveNamespaces$2({ [store.namespace]: input }, scope);
  const tables = flattenNamespacedTables$1({ namespaces });
  const modules = (input.modules ?? CONFIG_DEFAULTS$2.modules).map((mod) => mergeIfUndefined$1(mod, MODULE_DEFAULTS$1));
  return mergeIfUndefined$1(
    {
      ...store,
      namespaces,
      tables,
      // TODO: flatten systems from namespaces
      systems: !store.multipleNamespaces && input.systems ? resolveSystems$1(input.systems, store.namespace, store.namespace) : CONFIG_DEFAULTS$2.systems,
      excludeSystems: get$1(input, "excludeSystems"),
      codegen: mergeIfUndefined$1(store.codegen, resolveCodegen$2(input.codegen)),
      deploy: resolveDeploy$1(input.deploy),
      modules
    },
    CONFIG_DEFAULTS$2
  );
}
function defineWorld$1(input) {
  validateWorld$1(input);
  return resolveWorld$1(input);
}
var tablesConfig$1 = defineWorld$1({
  namespace: "world",
  userTypes: {
    ResourceId: { filePath: "@latticexyz/store/src/ResourceId.sol", type: "bytes32" }
  },
  tables: {
    NamespaceOwner: {
      schema: {
        namespaceId: "ResourceId",
        owner: "address"
      },
      key: ["namespaceId"]
    },
    ResourceAccess: {
      schema: {
        resourceId: "ResourceId",
        caller: "address",
        access: "bool"
      },
      key: ["resourceId", "caller"]
    },
    InstalledModules: {
      schema: {
        moduleAddress: "address",
        argumentsHash: "bytes32",
        // Hash of the params passed to the `install` function
        isInstalled: "bool"
      },
      key: ["moduleAddress", "argumentsHash"]
    },
    UserDelegationControl: {
      schema: {
        delegator: "address",
        delegatee: "address",
        delegationControlId: "ResourceId"
      },
      key: ["delegator", "delegatee"]
    },
    NamespaceDelegationControl: {
      schema: {
        namespaceId: "ResourceId",
        delegationControlId: "ResourceId"
      },
      key: ["namespaceId"]
    },
    Balances: {
      schema: {
        namespaceId: "ResourceId",
        balance: "uint256"
      },
      key: ["namespaceId"]
    },
    Systems: {
      schema: {
        systemId: "ResourceId",
        system: "address",
        publicAccess: "bool"
      },
      key: ["systemId"],
      codegen: {
        dataStruct: false
      }
    },
    SystemRegistry: {
      schema: {
        system: "address",
        systemId: "ResourceId"
      },
      key: ["system"]
    },
    SystemHooks: {
      schema: {
        systemId: "ResourceId",
        value: "bytes21[]"
      },
      key: ["systemId"]
    },
    FunctionSelectors: {
      schema: {
        worldFunctionSelector: "bytes4",
        systemId: "ResourceId",
        systemFunctionSelector: "bytes4"
      },
      key: ["worldFunctionSelector"],
      codegen: {
        dataStruct: false
      }
    },
    FunctionSignatures: {
      type: "offchainTable",
      schema: {
        functionSelector: "bytes4",
        functionSignature: "string"
      },
      key: ["functionSelector"]
    },
    InitModuleAddress: {
      schema: {
        value: "address"
      },
      key: []
    }
  }
});
defineWorld$1({
  namespace: "",
  codegen: {
    worldImportPath: "./src",
    worldgenDirectory: "interfaces",
    worldInterfaceName: "IBaseWorld",
    generateSystemLibraries: true,
    // generate into experimental dir until these are stable/audited
    systemLibrariesDirectory: "experimental/systems"
  },
  // Keep aligned with src/modules/init/constants.sol
  systems: {
    AccessManagementSystem: {
      name: "AccessManagement"
    },
    BalanceTransferSystem: {
      name: "BalanceTransfer"
    },
    BatchCallSystem: {
      name: "BatchCall"
    },
    RegistrationSystem: {
      name: "Registration"
    },
    // abstract systems that are deployed as part of RegistrationSystem
    ModuleInstallationSystem: {
      name: "Registration"
    },
    StoreRegistrationSystem: {
      name: "Registration"
    },
    WorldRegistrationSystem: {
      name: "Registration"
    }
  }
});
var mud_config_default$2 = tablesConfig$1;
defineWorld$1({
  userTypes: {
    ResourceId: { filePath: "@latticexyz/store/src/ResourceId.sol", type: "bytes32" }
  },
  tables: {
    CallWithSignatureNonces: {
      schema: { signer: "address", nonce: "uint256" },
      key: ["signer"]
    }
  }
});
defineWorld$1({
  userTypes: {
    ResourceId: { filePath: "@latticexyz/store/src/ResourceId.sol", type: "bytes32" }
  },
  tables: {
    AltCallWithSignatureNonces: {
      schema: { signer: "address", nonce: "uint256" },
      key: ["signer"]
    }
  }
});
var DrawbridgeStatus = /* @__PURE__ */ ((DrawbridgeStatus2) => {
  DrawbridgeStatus2["UNINITIALIZED"] = "uninitialized";
  DrawbridgeStatus2["DISCONNECTED"] = "disconnected";
  DrawbridgeStatus2["CONNECTING"] = "connecting";
  DrawbridgeStatus2["CONNECTED"] = "connected";
  DrawbridgeStatus2["SETTING_UP_SESSION"] = "setting_up_session";
  DrawbridgeStatus2["READY"] = "ready";
  DrawbridgeStatus2["ERROR"] = "error";
  return DrawbridgeStatus2;
})(DrawbridgeStatus || {});
resourceToHex({
  type: "system",
  namespace: "",
  name: "unlimited"
});
mud_config_default$2.namespaces.world.tables;
parseAbi$1([
  "function registerDelegation(address delegatee, bytes32 delegationControlId, bytes initCallData)"
]);
var logger = {
  log: (...args) => {
  },
  warn: (...args) => {
  },
  error: (...args) => {
    console.error(...args);
  }
};
var SessionStorage = class {
  constructor() {
    this.STORAGE_KEY = "drawbridge:session-signers";
    this.LEGACY_STORAGE_KEY = "entrykit:session-signers";
    this.cache = this.load();
  }
  /**
   * Load session store from localStorage
   *
   * Attempts to load from new key first, then falls back to legacy key
   * for backwards compatibility with existing installations.
   */
  load() {
    if (typeof localStorage === "undefined") {
      return { signers: {} };
    }
    let stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      stored = localStorage.getItem(this.LEGACY_STORAGE_KEY);
    }
    if (!stored) {
      return { signers: {} };
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.signers || typeof parsed.signers !== "object") {
        logger.warn("[drawbridge] Session storage corrupted - invalid structure, resetting");
        return { signers: {} };
      }
      return parsed;
    } catch (err) {
      logger.error(
        "[drawbridge] Failed to parse session storage:",
        err instanceof Error ? err.message : String(err)
      );
      return { signers: {} };
    }
  }
  /**
   * Save session store to localStorage
   *
   * Saves to new key and removes legacy key to complete migration.
   */
  save() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
    if (localStorage.getItem(this.LEGACY_STORAGE_KEY)) {
      localStorage.removeItem(this.LEGACY_STORAGE_KEY);
    }
  }
  /**
   * Get session signer private key for a user address
   *
   * @param address User's wallet address
   * @returns Private key if exists, undefined otherwise
   */
  getSigner(address) {
    const key = address.toLowerCase();
    return this.cache.signers[key];
  }
  /**
   * Store session signer private key for a user address
   *
   * @param address User's wallet address
   * @param privateKey Session private key to store
   */
  setSigner(address, privateKey) {
    const key = address.toLowerCase();
    this.cache.signers[key] = privateKey;
    this.save();
  }
  /**
   * Remove session signer for a user address
   *
   * @param address User's wallet address
   */
  removeSigner(address) {
    const key = address.toLowerCase();
    delete this.cache.signers[key];
    this.save();
  }
  /**
   * Clear all session signers
   */
  clear() {
    this.cache = { signers: {} };
    this.save();
  }
};
new SessionStorage();
function getDrawbridge() {
  {
    throw new Error("Drawbridge not initialized. Call initializeDrawbridge first.");
  }
}
const drawbridgeState = readable(
  {
    status: DrawbridgeStatus.UNINITIALIZED,
    sessionClient: null,
    userAddress: null,
    sessionAddress: null,
    isReady: false,
    error: null
  },
  (set) => {
    const interval = setInterval(() => {
    }, 100);
    return () => clearInterval(interval);
  }
);
derived(drawbridgeState, ($state) => $state.status);
const userAddress = derived(drawbridgeState, ($state) => $state?.userAddress ?? null);
derived(
  drawbridgeState,
  ($state) => $state.status === DrawbridgeStatus.READY && $state.userAddress !== null
);
const publicClient = writable(null);
const loadingMessage = writable("Initializing...");
var util;
(function(util2) {
  util2.assertEqual = (val) => val;
  function assertIs(_arg) {
  }
  util2.assertIs = assertIs;
  function assertNever(_x) {
    throw new Error();
  }
  util2.assertNever = assertNever;
  util2.arrayToEnum = (items) => {
    const obj = {};
    for (const item of items) {
      obj[item] = item;
    }
    return obj;
  };
  util2.getValidEnumValues = (obj) => {
    const validKeys = util2.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
    const filtered = {};
    for (const k of validKeys) {
      filtered[k] = obj[k];
    }
    return util2.objectValues(filtered);
  };
  util2.objectValues = (obj) => {
    return util2.objectKeys(obj).map(function(e) {
      return obj[e];
    });
  };
  util2.objectKeys = typeof Object.keys === "function" ? (obj) => Object.keys(obj) : (object) => {
    const keys = [];
    for (const key in object) {
      if (Object.prototype.hasOwnProperty.call(object, key)) {
        keys.push(key);
      }
    }
    return keys;
  };
  util2.find = (arr, checker) => {
    for (const item of arr) {
      if (checker(item))
        return item;
    }
    return void 0;
  };
  util2.isInteger = typeof Number.isInteger === "function" ? (val) => Number.isInteger(val) : (val) => typeof val === "number" && isFinite(val) && Math.floor(val) === val;
  function joinValues(array, separator = " | ") {
    return array.map((val) => typeof val === "string" ? `'${val}'` : val).join(separator);
  }
  util2.joinValues = joinValues;
  util2.jsonStringifyReplacer = (_, value) => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  };
})(util || (util = {}));
var objectUtil;
(function(objectUtil2) {
  objectUtil2.mergeShapes = (first, second) => {
    return {
      ...first,
      ...second
      // second overwrites first
    };
  };
})(objectUtil || (objectUtil = {}));
const ZodParsedType = util.arrayToEnum([
  "string",
  "nan",
  "number",
  "integer",
  "float",
  "boolean",
  "date",
  "bigint",
  "symbol",
  "function",
  "undefined",
  "null",
  "array",
  "object",
  "unknown",
  "promise",
  "void",
  "never",
  "map",
  "set"
]);
const getParsedType = (data) => {
  const t = typeof data;
  switch (t) {
    case "undefined":
      return ZodParsedType.undefined;
    case "string":
      return ZodParsedType.string;
    case "number":
      return isNaN(data) ? ZodParsedType.nan : ZodParsedType.number;
    case "boolean":
      return ZodParsedType.boolean;
    case "function":
      return ZodParsedType.function;
    case "bigint":
      return ZodParsedType.bigint;
    case "symbol":
      return ZodParsedType.symbol;
    case "object":
      if (Array.isArray(data)) {
        return ZodParsedType.array;
      }
      if (data === null) {
        return ZodParsedType.null;
      }
      if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
        return ZodParsedType.promise;
      }
      if (typeof Map !== "undefined" && data instanceof Map) {
        return ZodParsedType.map;
      }
      if (typeof Set !== "undefined" && data instanceof Set) {
        return ZodParsedType.set;
      }
      if (typeof Date !== "undefined" && data instanceof Date) {
        return ZodParsedType.date;
      }
      return ZodParsedType.object;
    default:
      return ZodParsedType.unknown;
  }
};
const ZodIssueCode = util.arrayToEnum([
  "invalid_type",
  "invalid_literal",
  "custom",
  "invalid_union",
  "invalid_union_discriminator",
  "invalid_enum_value",
  "unrecognized_keys",
  "invalid_arguments",
  "invalid_return_type",
  "invalid_date",
  "invalid_string",
  "too_small",
  "too_big",
  "invalid_intersection_types",
  "not_multiple_of",
  "not_finite"
]);
const quotelessJson = (obj) => {
  const json = JSON.stringify(obj, null, 2);
  return json.replace(/"([^"]+)":/g, "$1:");
};
class ZodError extends Error {
  constructor(issues) {
    super();
    this.issues = [];
    this.addIssue = (sub) => {
      this.issues = [...this.issues, sub];
    };
    this.addIssues = (subs = []) => {
      this.issues = [...this.issues, ...subs];
    };
    const actualProto = new.target.prototype;
    if (Object.setPrototypeOf) {
      Object.setPrototypeOf(this, actualProto);
    } else {
      this.__proto__ = actualProto;
    }
    this.name = "ZodError";
    this.issues = issues;
  }
  get errors() {
    return this.issues;
  }
  format(_mapper) {
    const mapper = _mapper || function(issue) {
      return issue.message;
    };
    const fieldErrors = { _errors: [] };
    const processError = (error2) => {
      for (const issue of error2.issues) {
        if (issue.code === "invalid_union") {
          issue.unionErrors.map(processError);
        } else if (issue.code === "invalid_return_type") {
          processError(issue.returnTypeError);
        } else if (issue.code === "invalid_arguments") {
          processError(issue.argumentsError);
        } else if (issue.path.length === 0) {
          fieldErrors._errors.push(mapper(issue));
        } else {
          let curr = fieldErrors;
          let i = 0;
          while (i < issue.path.length) {
            const el = issue.path[i];
            const terminal = i === issue.path.length - 1;
            if (!terminal) {
              curr[el] = curr[el] || { _errors: [] };
            } else {
              curr[el] = curr[el] || { _errors: [] };
              curr[el]._errors.push(mapper(issue));
            }
            curr = curr[el];
            i++;
          }
        }
      }
    };
    processError(this);
    return fieldErrors;
  }
  static assert(value) {
    if (!(value instanceof ZodError)) {
      throw new Error(`Not a ZodError: ${value}`);
    }
  }
  toString() {
    return this.message;
  }
  get message() {
    return JSON.stringify(this.issues, util.jsonStringifyReplacer, 2);
  }
  get isEmpty() {
    return this.issues.length === 0;
  }
  flatten(mapper = (issue) => issue.message) {
    const fieldErrors = {};
    const formErrors = [];
    for (const sub of this.issues) {
      if (sub.path.length > 0) {
        fieldErrors[sub.path[0]] = fieldErrors[sub.path[0]] || [];
        fieldErrors[sub.path[0]].push(mapper(sub));
      } else {
        formErrors.push(mapper(sub));
      }
    }
    return { formErrors, fieldErrors };
  }
  get formErrors() {
    return this.flatten();
  }
}
ZodError.create = (issues) => {
  const error2 = new ZodError(issues);
  return error2;
};
const errorMap = (issue, _ctx) => {
  let message;
  switch (issue.code) {
    case ZodIssueCode.invalid_type:
      if (issue.received === ZodParsedType.undefined) {
        message = "Required";
      } else {
        message = `Expected ${issue.expected}, received ${issue.received}`;
      }
      break;
    case ZodIssueCode.invalid_literal:
      message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util.jsonStringifyReplacer)}`;
      break;
    case ZodIssueCode.unrecognized_keys:
      message = `Unrecognized key(s) in object: ${util.joinValues(issue.keys, ", ")}`;
      break;
    case ZodIssueCode.invalid_union:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_union_discriminator:
      message = `Invalid discriminator value. Expected ${util.joinValues(issue.options)}`;
      break;
    case ZodIssueCode.invalid_enum_value:
      message = `Invalid enum value. Expected ${util.joinValues(issue.options)}, received '${issue.received}'`;
      break;
    case ZodIssueCode.invalid_arguments:
      message = `Invalid function arguments`;
      break;
    case ZodIssueCode.invalid_return_type:
      message = `Invalid function return type`;
      break;
    case ZodIssueCode.invalid_date:
      message = `Invalid date`;
      break;
    case ZodIssueCode.invalid_string:
      if (typeof issue.validation === "object") {
        if ("includes" in issue.validation) {
          message = `Invalid input: must include "${issue.validation.includes}"`;
          if (typeof issue.validation.position === "number") {
            message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
          }
        } else if ("startsWith" in issue.validation) {
          message = `Invalid input: must start with "${issue.validation.startsWith}"`;
        } else if ("endsWith" in issue.validation) {
          message = `Invalid input: must end with "${issue.validation.endsWith}"`;
        } else {
          util.assertNever(issue.validation);
        }
      } else if (issue.validation !== "regex") {
        message = `Invalid ${issue.validation}`;
      } else {
        message = "Invalid";
      }
      break;
    case ZodIssueCode.too_small:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.too_big:
      if (issue.type === "array")
        message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
      else if (issue.type === "string")
        message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
      else if (issue.type === "number")
        message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "bigint")
        message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
      else if (issue.type === "date")
        message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
      else
        message = "Invalid input";
      break;
    case ZodIssueCode.custom:
      message = `Invalid input`;
      break;
    case ZodIssueCode.invalid_intersection_types:
      message = `Intersection results could not be merged`;
      break;
    case ZodIssueCode.not_multiple_of:
      message = `Number must be a multiple of ${issue.multipleOf}`;
      break;
    case ZodIssueCode.not_finite:
      message = "Number must be finite";
      break;
    default:
      message = _ctx.defaultError;
      util.assertNever(issue);
  }
  return { message };
};
let overrideErrorMap = errorMap;
function setErrorMap(map) {
  overrideErrorMap = map;
}
function getErrorMap() {
  return overrideErrorMap;
}
const makeIssue = (params) => {
  const { data, path, errorMaps, issueData } = params;
  const fullPath = [...path, ...issueData.path || []];
  const fullIssue = {
    ...issueData,
    path: fullPath
  };
  if (issueData.message !== void 0) {
    return {
      ...issueData,
      path: fullPath,
      message: issueData.message
    };
  }
  let errorMessage = "";
  const maps = errorMaps.filter((m) => !!m).slice().reverse();
  for (const map of maps) {
    errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
  }
  return {
    ...issueData,
    path: fullPath,
    message: errorMessage
  };
};
const EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
  const overrideMap = getErrorMap();
  const issue = makeIssue({
    issueData,
    data: ctx.data,
    path: ctx.path,
    errorMaps: [
      ctx.common.contextualErrorMap,
      ctx.schemaErrorMap,
      overrideMap,
      overrideMap === errorMap ? void 0 : errorMap
      // then global default map
    ].filter((x) => !!x)
  });
  ctx.common.issues.push(issue);
}
class ParseStatus {
  constructor() {
    this.value = "valid";
  }
  dirty() {
    if (this.value === "valid")
      this.value = "dirty";
  }
  abort() {
    if (this.value !== "aborted")
      this.value = "aborted";
  }
  static mergeArray(status, results) {
    const arrayValue = [];
    for (const s of results) {
      if (s.status === "aborted")
        return INVALID;
      if (s.status === "dirty")
        status.dirty();
      arrayValue.push(s.value);
    }
    return { status: status.value, value: arrayValue };
  }
  static async mergeObjectAsync(status, pairs) {
    const syncPairs = [];
    for (const pair of pairs) {
      const key = await pair.key;
      const value = await pair.value;
      syncPairs.push({
        key,
        value
      });
    }
    return ParseStatus.mergeObjectSync(status, syncPairs);
  }
  static mergeObjectSync(status, pairs) {
    const finalObject = {};
    for (const pair of pairs) {
      const { key, value } = pair;
      if (key.status === "aborted")
        return INVALID;
      if (value.status === "aborted")
        return INVALID;
      if (key.status === "dirty")
        status.dirty();
      if (value.status === "dirty")
        status.dirty();
      if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
        finalObject[key.value] = value.value;
      }
    }
    return { status: status.value, value: finalObject };
  }
}
const INVALID = Object.freeze({
  status: "aborted"
});
const DIRTY = (value) => ({ status: "dirty", value });
const OK = (value) => ({ status: "valid", value });
const isAborted = (x) => x.status === "aborted";
const isDirty = (x) => x.status === "dirty";
const isValid = (x) => x.status === "valid";
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
function __classPrivateFieldGet(receiver2, state, kind, f) {
  if (typeof state === "function" ? receiver2 !== state || true : !state.has(receiver2)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return state.get(receiver2);
}
function __classPrivateFieldSet(receiver2, state, value, kind, f) {
  if (typeof state === "function" ? receiver2 !== state || true : !state.has(receiver2)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return state.set(receiver2, value), value;
}
typeof SuppressedError === "function" ? SuppressedError : function(error2, suppressed, message) {
  var e = new Error(message);
  return e.name = "SuppressedError", e.error = error2, e.suppressed = suppressed, e;
};
var errorUtil;
(function(errorUtil2) {
  errorUtil2.errToObj = (message) => typeof message === "string" ? { message } : message || {};
  errorUtil2.toString = (message) => typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil || (errorUtil = {}));
var _ZodEnum_cache, _ZodNativeEnum_cache;
class ParseInputLazyPath {
  constructor(parent, value, path, key) {
    this._cachedPath = [];
    this.parent = parent;
    this.data = value;
    this._path = path;
    this._key = key;
  }
  get path() {
    if (!this._cachedPath.length) {
      if (this._key instanceof Array) {
        this._cachedPath.push(...this._path, ...this._key);
      } else {
        this._cachedPath.push(...this._path, this._key);
      }
    }
    return this._cachedPath;
  }
}
const handleResult = (ctx, result) => {
  if (isValid(result)) {
    return { success: true, data: result.value };
  } else {
    if (!ctx.common.issues.length) {
      throw new Error("Validation failed but no issues detected.");
    }
    return {
      success: false,
      get error() {
        if (this._error)
          return this._error;
        const error2 = new ZodError(ctx.common.issues);
        this._error = error2;
        return this._error;
      }
    };
  }
};
function processCreateParams(params) {
  if (!params)
    return {};
  const { errorMap: errorMap2, invalid_type_error, required_error, description } = params;
  if (errorMap2 && (invalid_type_error || required_error)) {
    throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
  }
  if (errorMap2)
    return { errorMap: errorMap2, description };
  const customMap = (iss, ctx) => {
    var _a, _b;
    const { message } = params;
    if (iss.code === "invalid_enum_value") {
      return { message: message !== null && message !== void 0 ? message : ctx.defaultError };
    }
    if (typeof ctx.data === "undefined") {
      return { message: (_a = message !== null && message !== void 0 ? message : required_error) !== null && _a !== void 0 ? _a : ctx.defaultError };
    }
    if (iss.code !== "invalid_type")
      return { message: ctx.defaultError };
    return { message: (_b = message !== null && message !== void 0 ? message : invalid_type_error) !== null && _b !== void 0 ? _b : ctx.defaultError };
  };
  return { errorMap: customMap, description };
}
class ZodType {
  constructor(def) {
    this.spa = this.safeParseAsync;
    this._def = def;
    this.parse = this.parse.bind(this);
    this.safeParse = this.safeParse.bind(this);
    this.parseAsync = this.parseAsync.bind(this);
    this.safeParseAsync = this.safeParseAsync.bind(this);
    this.spa = this.spa.bind(this);
    this.refine = this.refine.bind(this);
    this.refinement = this.refinement.bind(this);
    this.superRefine = this.superRefine.bind(this);
    this.optional = this.optional.bind(this);
    this.nullable = this.nullable.bind(this);
    this.nullish = this.nullish.bind(this);
    this.array = this.array.bind(this);
    this.promise = this.promise.bind(this);
    this.or = this.or.bind(this);
    this.and = this.and.bind(this);
    this.transform = this.transform.bind(this);
    this.brand = this.brand.bind(this);
    this.default = this.default.bind(this);
    this.catch = this.catch.bind(this);
    this.describe = this.describe.bind(this);
    this.pipe = this.pipe.bind(this);
    this.readonly = this.readonly.bind(this);
    this.isNullable = this.isNullable.bind(this);
    this.isOptional = this.isOptional.bind(this);
  }
  get description() {
    return this._def.description;
  }
  _getType(input) {
    return getParsedType(input.data);
  }
  _getOrReturnCtx(input, ctx) {
    return ctx || {
      common: input.parent.common,
      data: input.data,
      parsedType: getParsedType(input.data),
      schemaErrorMap: this._def.errorMap,
      path: input.path,
      parent: input.parent
    };
  }
  _processInputParams(input) {
    return {
      status: new ParseStatus(),
      ctx: {
        common: input.parent.common,
        data: input.data,
        parsedType: getParsedType(input.data),
        schemaErrorMap: this._def.errorMap,
        path: input.path,
        parent: input.parent
      }
    };
  }
  _parseSync(input) {
    const result = this._parse(input);
    if (isAsync(result)) {
      throw new Error("Synchronous parse encountered promise.");
    }
    return result;
  }
  _parseAsync(input) {
    const result = this._parse(input);
    return Promise.resolve(result);
  }
  parse(data, params) {
    const result = this.safeParse(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  safeParse(data, params) {
    var _a;
    const ctx = {
      common: {
        issues: [],
        async: (_a = params === null || params === void 0 ? void 0 : params.async) !== null && _a !== void 0 ? _a : false,
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const result = this._parseSync({ data, path: ctx.path, parent: ctx });
    return handleResult(ctx, result);
  }
  async parseAsync(data, params) {
    const result = await this.safeParseAsync(data, params);
    if (result.success)
      return result.data;
    throw result.error;
  }
  async safeParseAsync(data, params) {
    const ctx = {
      common: {
        issues: [],
        contextualErrorMap: params === null || params === void 0 ? void 0 : params.errorMap,
        async: true
      },
      path: (params === null || params === void 0 ? void 0 : params.path) || [],
      schemaErrorMap: this._def.errorMap,
      parent: null,
      data,
      parsedType: getParsedType(data)
    };
    const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
    const result = await (isAsync(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
    return handleResult(ctx, result);
  }
  refine(check, message) {
    const getIssueProperties = (val) => {
      if (typeof message === "string" || typeof message === "undefined") {
        return { message };
      } else if (typeof message === "function") {
        return message(val);
      } else {
        return message;
      }
    };
    return this._refinement((val, ctx) => {
      const result = check(val);
      const setError = () => ctx.addIssue({
        code: ZodIssueCode.custom,
        ...getIssueProperties(val)
      });
      if (typeof Promise !== "undefined" && result instanceof Promise) {
        return result.then((data) => {
          if (!data) {
            setError();
            return false;
          } else {
            return true;
          }
        });
      }
      if (!result) {
        setError();
        return false;
      } else {
        return true;
      }
    });
  }
  refinement(check, refinementData) {
    return this._refinement((val, ctx) => {
      if (!check(val)) {
        ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
        return false;
      } else {
        return true;
      }
    });
  }
  _refinement(refinement) {
    return new ZodEffects({
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "refinement", refinement }
    });
  }
  superRefine(refinement) {
    return this._refinement(refinement);
  }
  optional() {
    return ZodOptional.create(this, this._def);
  }
  nullable() {
    return ZodNullable.create(this, this._def);
  }
  nullish() {
    return this.nullable().optional();
  }
  array() {
    return ZodArray.create(this, this._def);
  }
  promise() {
    return ZodPromise.create(this, this._def);
  }
  or(option) {
    return ZodUnion.create([this, option], this._def);
  }
  and(incoming) {
    return ZodIntersection.create(this, incoming, this._def);
  }
  transform(transform) {
    return new ZodEffects({
      ...processCreateParams(this._def),
      schema: this,
      typeName: ZodFirstPartyTypeKind.ZodEffects,
      effect: { type: "transform", transform }
    });
  }
  default(def) {
    const defaultValueFunc = typeof def === "function" ? def : () => def;
    return new ZodDefault({
      ...processCreateParams(this._def),
      innerType: this,
      defaultValue: defaultValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodDefault
    });
  }
  brand() {
    return new ZodBranded({
      typeName: ZodFirstPartyTypeKind.ZodBranded,
      type: this,
      ...processCreateParams(this._def)
    });
  }
  catch(def) {
    const catchValueFunc = typeof def === "function" ? def : () => def;
    return new ZodCatch({
      ...processCreateParams(this._def),
      innerType: this,
      catchValue: catchValueFunc,
      typeName: ZodFirstPartyTypeKind.ZodCatch
    });
  }
  describe(description) {
    const This = this.constructor;
    return new This({
      ...this._def,
      description
    });
  }
  pipe(target) {
    return ZodPipeline.create(this, target);
  }
  readonly() {
    return ZodReadonly.create(this);
  }
  isOptional() {
    return this.safeParse(void 0).success;
  }
  isNullable() {
    return this.safeParse(null).success;
  }
}
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv6Regex = /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
  let regex = `([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d`;
  if (args.precision) {
    regex = `${regex}\\.\\d{${args.precision}}`;
  } else if (args.precision == null) {
    regex = `${regex}(\\.\\d+)?`;
  }
  return regex;
}
function timeRegex(args) {
  return new RegExp(`^${timeRegexSource(args)}$`);
}
function datetimeRegex(args) {
  let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
  const opts = [];
  opts.push(args.local ? `Z?` : `Z`);
  if (args.offset)
    opts.push(`([+-]\\d{2}:?\\d{2})`);
  regex = `${regex}(${opts.join("|")})`;
  return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
  if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
    return true;
  }
  if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
    return true;
  }
  return false;
}
class ZodString extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = String(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.string) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.string,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.length < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.length > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "string",
            inclusive: true,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "length") {
        const tooBig = input.data.length > check.value;
        const tooSmall = input.data.length < check.value;
        if (tooBig || tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          if (tooBig) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_big,
              maximum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          } else if (tooSmall) {
            addIssueToContext(ctx, {
              code: ZodIssueCode.too_small,
              minimum: check.value,
              type: "string",
              inclusive: true,
              exact: true,
              message: check.message
            });
          }
          status.dirty();
        }
      } else if (check.kind === "email") {
        if (!emailRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "email",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "emoji") {
        if (!emojiRegex) {
          emojiRegex = new RegExp(_emojiRegex, "u");
        }
        if (!emojiRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "emoji",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "uuid") {
        if (!uuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "uuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "nanoid") {
        if (!nanoidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "nanoid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid") {
        if (!cuidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "cuid2") {
        if (!cuid2Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "cuid2",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ulid") {
        if (!ulidRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ulid",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "url") {
        try {
          new URL(input.data);
        } catch (_a) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "url",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "regex") {
        check.regex.lastIndex = 0;
        const testResult = check.regex.test(input.data);
        if (!testResult) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "regex",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "trim") {
        input.data = input.data.trim();
      } else if (check.kind === "includes") {
        if (!input.data.includes(check.value, check.position)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { includes: check.value, position: check.position },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "toLowerCase") {
        input.data = input.data.toLowerCase();
      } else if (check.kind === "toUpperCase") {
        input.data = input.data.toUpperCase();
      } else if (check.kind === "startsWith") {
        if (!input.data.startsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { startsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "endsWith") {
        if (!input.data.endsWith(check.value)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: { endsWith: check.value },
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "datetime") {
        const regex = datetimeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "datetime",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "date") {
        const regex = dateRegex;
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "date",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "time") {
        const regex = timeRegex(check);
        if (!regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_string,
            validation: "time",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "duration") {
        if (!durationRegex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "duration",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "ip") {
        if (!isValidIP(input.data, check.version)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "ip",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "base64") {
        if (!base64Regex.test(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            validation: "base64",
            code: ZodIssueCode.invalid_string,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  _regex(regex, validation2, message) {
    return this.refinement((data) => regex.test(data), {
      validation: validation2,
      code: ZodIssueCode.invalid_string,
      ...errorUtil.errToObj(message)
    });
  }
  _addCheck(check) {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  email(message) {
    return this._addCheck({ kind: "email", ...errorUtil.errToObj(message) });
  }
  url(message) {
    return this._addCheck({ kind: "url", ...errorUtil.errToObj(message) });
  }
  emoji(message) {
    return this._addCheck({ kind: "emoji", ...errorUtil.errToObj(message) });
  }
  uuid(message) {
    return this._addCheck({ kind: "uuid", ...errorUtil.errToObj(message) });
  }
  nanoid(message) {
    return this._addCheck({ kind: "nanoid", ...errorUtil.errToObj(message) });
  }
  cuid(message) {
    return this._addCheck({ kind: "cuid", ...errorUtil.errToObj(message) });
  }
  cuid2(message) {
    return this._addCheck({ kind: "cuid2", ...errorUtil.errToObj(message) });
  }
  ulid(message) {
    return this._addCheck({ kind: "ulid", ...errorUtil.errToObj(message) });
  }
  base64(message) {
    return this._addCheck({ kind: "base64", ...errorUtil.errToObj(message) });
  }
  ip(options) {
    return this._addCheck({ kind: "ip", ...errorUtil.errToObj(options) });
  }
  datetime(options) {
    var _a, _b;
    if (typeof options === "string") {
      return this._addCheck({
        kind: "datetime",
        precision: null,
        offset: false,
        local: false,
        message: options
      });
    }
    return this._addCheck({
      kind: "datetime",
      precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
      offset: (_a = options === null || options === void 0 ? void 0 : options.offset) !== null && _a !== void 0 ? _a : false,
      local: (_b = options === null || options === void 0 ? void 0 : options.local) !== null && _b !== void 0 ? _b : false,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  date(message) {
    return this._addCheck({ kind: "date", message });
  }
  time(options) {
    if (typeof options === "string") {
      return this._addCheck({
        kind: "time",
        precision: null,
        message: options
      });
    }
    return this._addCheck({
      kind: "time",
      precision: typeof (options === null || options === void 0 ? void 0 : options.precision) === "undefined" ? null : options === null || options === void 0 ? void 0 : options.precision,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  duration(message) {
    return this._addCheck({ kind: "duration", ...errorUtil.errToObj(message) });
  }
  regex(regex, message) {
    return this._addCheck({
      kind: "regex",
      regex,
      ...errorUtil.errToObj(message)
    });
  }
  includes(value, options) {
    return this._addCheck({
      kind: "includes",
      value,
      position: options === null || options === void 0 ? void 0 : options.position,
      ...errorUtil.errToObj(options === null || options === void 0 ? void 0 : options.message)
    });
  }
  startsWith(value, message) {
    return this._addCheck({
      kind: "startsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  endsWith(value, message) {
    return this._addCheck({
      kind: "endsWith",
      value,
      ...errorUtil.errToObj(message)
    });
  }
  min(minLength, message) {
    return this._addCheck({
      kind: "min",
      value: minLength,
      ...errorUtil.errToObj(message)
    });
  }
  max(maxLength, message) {
    return this._addCheck({
      kind: "max",
      value: maxLength,
      ...errorUtil.errToObj(message)
    });
  }
  length(len, message) {
    return this._addCheck({
      kind: "length",
      value: len,
      ...errorUtil.errToObj(message)
    });
  }
  /**
   * @deprecated Use z.string().min(1) instead.
   * @see {@link ZodString.min}
   */
  nonempty(message) {
    return this.min(1, errorUtil.errToObj(message));
  }
  trim() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "trim" }]
    });
  }
  toLowerCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toLowerCase" }]
    });
  }
  toUpperCase() {
    return new ZodString({
      ...this._def,
      checks: [...this._def.checks, { kind: "toUpperCase" }]
    });
  }
  get isDatetime() {
    return !!this._def.checks.find((ch) => ch.kind === "datetime");
  }
  get isDate() {
    return !!this._def.checks.find((ch) => ch.kind === "date");
  }
  get isTime() {
    return !!this._def.checks.find((ch) => ch.kind === "time");
  }
  get isDuration() {
    return !!this._def.checks.find((ch) => ch.kind === "duration");
  }
  get isEmail() {
    return !!this._def.checks.find((ch) => ch.kind === "email");
  }
  get isURL() {
    return !!this._def.checks.find((ch) => ch.kind === "url");
  }
  get isEmoji() {
    return !!this._def.checks.find((ch) => ch.kind === "emoji");
  }
  get isUUID() {
    return !!this._def.checks.find((ch) => ch.kind === "uuid");
  }
  get isNANOID() {
    return !!this._def.checks.find((ch) => ch.kind === "nanoid");
  }
  get isCUID() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid");
  }
  get isCUID2() {
    return !!this._def.checks.find((ch) => ch.kind === "cuid2");
  }
  get isULID() {
    return !!this._def.checks.find((ch) => ch.kind === "ulid");
  }
  get isIP() {
    return !!this._def.checks.find((ch) => ch.kind === "ip");
  }
  get isBase64() {
    return !!this._def.checks.find((ch) => ch.kind === "base64");
  }
  get minLength() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxLength() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodString.create = (params) => {
  var _a;
  return new ZodString({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodString,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
function floatSafeRemainder(val, step) {
  const valDecCount = (val.toString().split(".")[1] || "").length;
  const stepDecCount = (step.toString().split(".")[1] || "").length;
  const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
  const valInt = parseInt(val.toFixed(decCount).replace(".", ""));
  const stepInt = parseInt(step.toFixed(decCount).replace(".", ""));
  return valInt % stepInt / Math.pow(10, decCount);
}
class ZodNumber extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
    this.step = this.multipleOf;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = Number(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.number) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.number,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "int") {
        if (!util.isInteger(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.invalid_type,
            expected: "integer",
            received: "float",
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            minimum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            maximum: check.value,
            type: "number",
            inclusive: check.inclusive,
            exact: false,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (floatSafeRemainder(input.data, check.value) !== 0) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "finite") {
        if (!Number.isFinite(input.data)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_finite,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodNumber({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodNumber({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  int(message) {
    return this._addCheck({
      kind: "int",
      message: errorUtil.toString(message)
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: 0,
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  finite(message) {
    return this._addCheck({
      kind: "finite",
      message: errorUtil.toString(message)
    });
  }
  safe(message) {
    return this._addCheck({
      kind: "min",
      inclusive: true,
      value: Number.MIN_SAFE_INTEGER,
      message: errorUtil.toString(message)
    })._addCheck({
      kind: "max",
      inclusive: true,
      value: Number.MAX_SAFE_INTEGER,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
  get isInt() {
    return !!this._def.checks.find((ch) => ch.kind === "int" || ch.kind === "multipleOf" && util.isInteger(ch.value));
  }
  get isFinite() {
    let max = null, min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
        return true;
      } else if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      } else if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return Number.isFinite(min) && Number.isFinite(max);
  }
}
ZodNumber.create = (params) => {
  return new ZodNumber({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodNumber,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
class ZodBigInt extends ZodType {
  constructor() {
    super(...arguments);
    this.min = this.gte;
    this.max = this.lte;
  }
  _parse(input) {
    if (this._def.coerce) {
      input.data = BigInt(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.bigint) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.bigint,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    let ctx = void 0;
    const status = new ParseStatus();
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
        if (tooSmall) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            type: "bigint",
            minimum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
        if (tooBig) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            type: "bigint",
            maximum: check.value,
            inclusive: check.inclusive,
            message: check.message
          });
          status.dirty();
        }
      } else if (check.kind === "multipleOf") {
        if (input.data % check.value !== BigInt(0)) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.not_multiple_of,
            multipleOf: check.value,
            message: check.message
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return { status: status.value, value: input.data };
  }
  gte(value, message) {
    return this.setLimit("min", value, true, errorUtil.toString(message));
  }
  gt(value, message) {
    return this.setLimit("min", value, false, errorUtil.toString(message));
  }
  lte(value, message) {
    return this.setLimit("max", value, true, errorUtil.toString(message));
  }
  lt(value, message) {
    return this.setLimit("max", value, false, errorUtil.toString(message));
  }
  setLimit(kind, value, inclusive, message) {
    return new ZodBigInt({
      ...this._def,
      checks: [
        ...this._def.checks,
        {
          kind,
          value,
          inclusive,
          message: errorUtil.toString(message)
        }
      ]
    });
  }
  _addCheck(check) {
    return new ZodBigInt({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  positive(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  negative(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: false,
      message: errorUtil.toString(message)
    });
  }
  nonpositive(message) {
    return this._addCheck({
      kind: "max",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  nonnegative(message) {
    return this._addCheck({
      kind: "min",
      value: BigInt(0),
      inclusive: true,
      message: errorUtil.toString(message)
    });
  }
  multipleOf(value, message) {
    return this._addCheck({
      kind: "multipleOf",
      value,
      message: errorUtil.toString(message)
    });
  }
  get minValue() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min;
  }
  get maxValue() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max;
  }
}
ZodBigInt.create = (params) => {
  var _a;
  return new ZodBigInt({
    checks: [],
    typeName: ZodFirstPartyTypeKind.ZodBigInt,
    coerce: (_a = params === null || params === void 0 ? void 0 : params.coerce) !== null && _a !== void 0 ? _a : false,
    ...processCreateParams(params)
  });
};
class ZodBoolean extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = Boolean(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.boolean) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.boolean,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodBoolean.create = (params) => {
  return new ZodBoolean({
    typeName: ZodFirstPartyTypeKind.ZodBoolean,
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    ...processCreateParams(params)
  });
};
class ZodDate extends ZodType {
  _parse(input) {
    if (this._def.coerce) {
      input.data = new Date(input.data);
    }
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.date) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.date,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    if (isNaN(input.data.getTime())) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_date
      });
      return INVALID;
    }
    const status = new ParseStatus();
    let ctx = void 0;
    for (const check of this._def.checks) {
      if (check.kind === "min") {
        if (input.data.getTime() < check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_small,
            message: check.message,
            inclusive: true,
            exact: false,
            minimum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else if (check.kind === "max") {
        if (input.data.getTime() > check.value) {
          ctx = this._getOrReturnCtx(input, ctx);
          addIssueToContext(ctx, {
            code: ZodIssueCode.too_big,
            message: check.message,
            inclusive: true,
            exact: false,
            maximum: check.value,
            type: "date"
          });
          status.dirty();
        }
      } else {
        util.assertNever(check);
      }
    }
    return {
      status: status.value,
      value: new Date(input.data.getTime())
    };
  }
  _addCheck(check) {
    return new ZodDate({
      ...this._def,
      checks: [...this._def.checks, check]
    });
  }
  min(minDate, message) {
    return this._addCheck({
      kind: "min",
      value: minDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  max(maxDate, message) {
    return this._addCheck({
      kind: "max",
      value: maxDate.getTime(),
      message: errorUtil.toString(message)
    });
  }
  get minDate() {
    let min = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "min") {
        if (min === null || ch.value > min)
          min = ch.value;
      }
    }
    return min != null ? new Date(min) : null;
  }
  get maxDate() {
    let max = null;
    for (const ch of this._def.checks) {
      if (ch.kind === "max") {
        if (max === null || ch.value < max)
          max = ch.value;
      }
    }
    return max != null ? new Date(max) : null;
  }
}
ZodDate.create = (params) => {
  return new ZodDate({
    checks: [],
    coerce: (params === null || params === void 0 ? void 0 : params.coerce) || false,
    typeName: ZodFirstPartyTypeKind.ZodDate,
    ...processCreateParams(params)
  });
};
class ZodSymbol extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.symbol) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.symbol,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodSymbol.create = (params) => {
  return new ZodSymbol({
    typeName: ZodFirstPartyTypeKind.ZodSymbol,
    ...processCreateParams(params)
  });
};
class ZodUndefined extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.undefined,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodUndefined.create = (params) => {
  return new ZodUndefined({
    typeName: ZodFirstPartyTypeKind.ZodUndefined,
    ...processCreateParams(params)
  });
};
class ZodNull extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.null) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.null,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodNull.create = (params) => {
  return new ZodNull({
    typeName: ZodFirstPartyTypeKind.ZodNull,
    ...processCreateParams(params)
  });
};
class ZodAny extends ZodType {
  constructor() {
    super(...arguments);
    this._any = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodAny.create = (params) => {
  return new ZodAny({
    typeName: ZodFirstPartyTypeKind.ZodAny,
    ...processCreateParams(params)
  });
};
class ZodUnknown extends ZodType {
  constructor() {
    super(...arguments);
    this._unknown = true;
  }
  _parse(input) {
    return OK(input.data);
  }
}
ZodUnknown.create = (params) => {
  return new ZodUnknown({
    typeName: ZodFirstPartyTypeKind.ZodUnknown,
    ...processCreateParams(params)
  });
};
class ZodNever extends ZodType {
  _parse(input) {
    const ctx = this._getOrReturnCtx(input);
    addIssueToContext(ctx, {
      code: ZodIssueCode.invalid_type,
      expected: ZodParsedType.never,
      received: ctx.parsedType
    });
    return INVALID;
  }
}
ZodNever.create = (params) => {
  return new ZodNever({
    typeName: ZodFirstPartyTypeKind.ZodNever,
    ...processCreateParams(params)
  });
};
class ZodVoid extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.undefined) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.void,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return OK(input.data);
  }
}
ZodVoid.create = (params) => {
  return new ZodVoid({
    typeName: ZodFirstPartyTypeKind.ZodVoid,
    ...processCreateParams(params)
  });
};
class ZodArray extends ZodType {
  _parse(input) {
    const { ctx, status } = this._processInputParams(input);
    const def = this._def;
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (def.exactLength !== null) {
      const tooBig = ctx.data.length > def.exactLength.value;
      const tooSmall = ctx.data.length < def.exactLength.value;
      if (tooBig || tooSmall) {
        addIssueToContext(ctx, {
          code: tooBig ? ZodIssueCode.too_big : ZodIssueCode.too_small,
          minimum: tooSmall ? def.exactLength.value : void 0,
          maximum: tooBig ? def.exactLength.value : void 0,
          type: "array",
          inclusive: true,
          exact: true,
          message: def.exactLength.message
        });
        status.dirty();
      }
    }
    if (def.minLength !== null) {
      if (ctx.data.length < def.minLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.minLength.message
        });
        status.dirty();
      }
    }
    if (def.maxLength !== null) {
      if (ctx.data.length > def.maxLength.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxLength.value,
          type: "array",
          inclusive: true,
          exact: false,
          message: def.maxLength.message
        });
        status.dirty();
      }
    }
    if (ctx.common.async) {
      return Promise.all([...ctx.data].map((item, i) => {
        return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
      })).then((result2) => {
        return ParseStatus.mergeArray(status, result2);
      });
    }
    const result = [...ctx.data].map((item, i) => {
      return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
    });
    return ParseStatus.mergeArray(status, result);
  }
  get element() {
    return this._def.type;
  }
  min(minLength, message) {
    return new ZodArray({
      ...this._def,
      minLength: { value: minLength, message: errorUtil.toString(message) }
    });
  }
  max(maxLength, message) {
    return new ZodArray({
      ...this._def,
      maxLength: { value: maxLength, message: errorUtil.toString(message) }
    });
  }
  length(len, message) {
    return new ZodArray({
      ...this._def,
      exactLength: { value: len, message: errorUtil.toString(message) }
    });
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodArray.create = (schema, params) => {
  return new ZodArray({
    type: schema,
    minLength: null,
    maxLength: null,
    exactLength: null,
    typeName: ZodFirstPartyTypeKind.ZodArray,
    ...processCreateParams(params)
  });
};
function deepPartialify(schema) {
  if (schema instanceof ZodObject) {
    const newShape = {};
    for (const key in schema.shape) {
      const fieldSchema = schema.shape[key];
      newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
    }
    return new ZodObject({
      ...schema._def,
      shape: () => newShape
    });
  } else if (schema instanceof ZodArray) {
    return new ZodArray({
      ...schema._def,
      type: deepPartialify(schema.element)
    });
  } else if (schema instanceof ZodOptional) {
    return ZodOptional.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodNullable) {
    return ZodNullable.create(deepPartialify(schema.unwrap()));
  } else if (schema instanceof ZodTuple) {
    return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
  } else {
    return schema;
  }
}
class ZodObject extends ZodType {
  constructor() {
    super(...arguments);
    this._cached = null;
    this.nonstrict = this.passthrough;
    this.augment = this.extend;
  }
  _getCached() {
    if (this._cached !== null)
      return this._cached;
    const shape = this._def.shape();
    const keys = util.objectKeys(shape);
    return this._cached = { shape, keys };
  }
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.object) {
      const ctx2 = this._getOrReturnCtx(input);
      addIssueToContext(ctx2, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx2.parsedType
      });
      return INVALID;
    }
    const { status, ctx } = this._processInputParams(input);
    const { shape, keys: shapeKeys } = this._getCached();
    const extraKeys = [];
    if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
      for (const key in ctx.data) {
        if (!shapeKeys.includes(key)) {
          extraKeys.push(key);
        }
      }
    }
    const pairs = [];
    for (const key of shapeKeys) {
      const keyValidator = shape[key];
      const value = ctx.data[key];
      pairs.push({
        key: { status: "valid", value: key },
        value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (this._def.catchall instanceof ZodNever) {
      const unknownKeys = this._def.unknownKeys;
      if (unknownKeys === "passthrough") {
        for (const key of extraKeys) {
          pairs.push({
            key: { status: "valid", value: key },
            value: { status: "valid", value: ctx.data[key] }
          });
        }
      } else if (unknownKeys === "strict") {
        if (extraKeys.length > 0) {
          addIssueToContext(ctx, {
            code: ZodIssueCode.unrecognized_keys,
            keys: extraKeys
          });
          status.dirty();
        }
      } else if (unknownKeys === "strip") ;
      else {
        throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
      }
    } else {
      const catchall = this._def.catchall;
      for (const key of extraKeys) {
        const value = ctx.data[key];
        pairs.push({
          key: { status: "valid", value: key },
          value: catchall._parse(
            new ParseInputLazyPath(ctx, value, ctx.path, key)
            //, ctx.child(key), value, getParsedType(value)
          ),
          alwaysSet: key in ctx.data
        });
      }
    }
    if (ctx.common.async) {
      return Promise.resolve().then(async () => {
        const syncPairs = [];
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          syncPairs.push({
            key,
            value,
            alwaysSet: pair.alwaysSet
          });
        }
        return syncPairs;
      }).then((syncPairs) => {
        return ParseStatus.mergeObjectSync(status, syncPairs);
      });
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get shape() {
    return this._def.shape();
  }
  strict(message) {
    errorUtil.errToObj;
    return new ZodObject({
      ...this._def,
      unknownKeys: "strict",
      ...message !== void 0 ? {
        errorMap: (issue, ctx) => {
          var _a, _b, _c, _d;
          const defaultError = (_c = (_b = (_a = this._def).errorMap) === null || _b === void 0 ? void 0 : _b.call(_a, issue, ctx).message) !== null && _c !== void 0 ? _c : ctx.defaultError;
          if (issue.code === "unrecognized_keys")
            return {
              message: (_d = errorUtil.errToObj(message).message) !== null && _d !== void 0 ? _d : defaultError
            };
          return {
            message: defaultError
          };
        }
      } : {}
    });
  }
  strip() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "strip"
    });
  }
  passthrough() {
    return new ZodObject({
      ...this._def,
      unknownKeys: "passthrough"
    });
  }
  // const AugmentFactory =
  //   <Def extends ZodObjectDef>(def: Def) =>
  //   <Augmentation extends ZodRawShape>(
  //     augmentation: Augmentation
  //   ): ZodObject<
  //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
  //     Def["unknownKeys"],
  //     Def["catchall"]
  //   > => {
  //     return new ZodObject({
  //       ...def,
  //       shape: () => ({
  //         ...def.shape(),
  //         ...augmentation,
  //       }),
  //     }) as any;
  //   };
  extend(augmentation) {
    return new ZodObject({
      ...this._def,
      shape: () => ({
        ...this._def.shape(),
        ...augmentation
      })
    });
  }
  /**
   * Prior to zod@1.0.12 there was a bug in the
   * inferred type of merged objects. Please
   * upgrade if you are experiencing issues.
   */
  merge(merging) {
    const merged = new ZodObject({
      unknownKeys: merging._def.unknownKeys,
      catchall: merging._def.catchall,
      shape: () => ({
        ...this._def.shape(),
        ...merging._def.shape()
      }),
      typeName: ZodFirstPartyTypeKind.ZodObject
    });
    return merged;
  }
  // merge<
  //   Incoming extends AnyZodObject,
  //   Augmentation extends Incoming["shape"],
  //   NewOutput extends {
  //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
  //       ? Augmentation[k]["_output"]
  //       : k extends keyof Output
  //       ? Output[k]
  //       : never;
  //   },
  //   NewInput extends {
  //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
  //       ? Augmentation[k]["_input"]
  //       : k extends keyof Input
  //       ? Input[k]
  //       : never;
  //   }
  // >(
  //   merging: Incoming
  // ): ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"],
  //   NewOutput,
  //   NewInput
  // > {
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  setKey(key, schema) {
    return this.augment({ [key]: schema });
  }
  // merge<Incoming extends AnyZodObject>(
  //   merging: Incoming
  // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
  // ZodObject<
  //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
  //   Incoming["_def"]["unknownKeys"],
  //   Incoming["_def"]["catchall"]
  // > {
  //   // const mergedShape = objectUtil.mergeShapes(
  //   //   this._def.shape(),
  //   //   merging._def.shape()
  //   // );
  //   const merged: any = new ZodObject({
  //     unknownKeys: merging._def.unknownKeys,
  //     catchall: merging._def.catchall,
  //     shape: () =>
  //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
  //     typeName: ZodFirstPartyTypeKind.ZodObject,
  //   }) as any;
  //   return merged;
  // }
  catchall(index) {
    return new ZodObject({
      ...this._def,
      catchall: index
    });
  }
  pick(mask) {
    const shape = {};
    util.objectKeys(mask).forEach((key) => {
      if (mask[key] && this.shape[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  omit(mask) {
    const shape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (!mask[key]) {
        shape[key] = this.shape[key];
      }
    });
    return new ZodObject({
      ...this._def,
      shape: () => shape
    });
  }
  /**
   * @deprecated
   */
  deepPartial() {
    return deepPartialify(this);
  }
  partial(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      const fieldSchema = this.shape[key];
      if (mask && !mask[key]) {
        newShape[key] = fieldSchema;
      } else {
        newShape[key] = fieldSchema.optional();
      }
    });
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  required(mask) {
    const newShape = {};
    util.objectKeys(this.shape).forEach((key) => {
      if (mask && !mask[key]) {
        newShape[key] = this.shape[key];
      } else {
        const fieldSchema = this.shape[key];
        let newField = fieldSchema;
        while (newField instanceof ZodOptional) {
          newField = newField._def.innerType;
        }
        newShape[key] = newField;
      }
    });
    return new ZodObject({
      ...this._def,
      shape: () => newShape
    });
  }
  keyof() {
    return createZodEnum(util.objectKeys(this.shape));
  }
}
ZodObject.create = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.strictCreate = (shape, params) => {
  return new ZodObject({
    shape: () => shape,
    unknownKeys: "strict",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
ZodObject.lazycreate = (shape, params) => {
  return new ZodObject({
    shape,
    unknownKeys: "strip",
    catchall: ZodNever.create(),
    typeName: ZodFirstPartyTypeKind.ZodObject,
    ...processCreateParams(params)
  });
};
class ZodUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const options = this._def.options;
    function handleResults(results) {
      for (const result of results) {
        if (result.result.status === "valid") {
          return result.result;
        }
      }
      for (const result of results) {
        if (result.result.status === "dirty") {
          ctx.common.issues.push(...result.ctx.common.issues);
          return result.result;
        }
      }
      const unionErrors = results.map((result) => new ZodError(result.ctx.common.issues));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return Promise.all(options.map(async (option) => {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        return {
          result: await option._parseAsync({
            data: ctx.data,
            path: ctx.path,
            parent: childCtx
          }),
          ctx: childCtx
        };
      })).then(handleResults);
    } else {
      let dirty = void 0;
      const issues = [];
      for (const option of options) {
        const childCtx = {
          ...ctx,
          common: {
            ...ctx.common,
            issues: []
          },
          parent: null
        };
        const result = option._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: childCtx
        });
        if (result.status === "valid") {
          return result;
        } else if (result.status === "dirty" && !dirty) {
          dirty = { result, ctx: childCtx };
        }
        if (childCtx.common.issues.length) {
          issues.push(childCtx.common.issues);
        }
      }
      if (dirty) {
        ctx.common.issues.push(...dirty.ctx.common.issues);
        return dirty.result;
      }
      const unionErrors = issues.map((issues2) => new ZodError(issues2));
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union,
        unionErrors
      });
      return INVALID;
    }
  }
  get options() {
    return this._def.options;
  }
}
ZodUnion.create = (types, params) => {
  return new ZodUnion({
    options: types,
    typeName: ZodFirstPartyTypeKind.ZodUnion,
    ...processCreateParams(params)
  });
};
const getDiscriminator = (type) => {
  if (type instanceof ZodLazy) {
    return getDiscriminator(type.schema);
  } else if (type instanceof ZodEffects) {
    return getDiscriminator(type.innerType());
  } else if (type instanceof ZodLiteral) {
    return [type.value];
  } else if (type instanceof ZodEnum) {
    return type.options;
  } else if (type instanceof ZodNativeEnum) {
    return util.objectValues(type.enum);
  } else if (type instanceof ZodDefault) {
    return getDiscriminator(type._def.innerType);
  } else if (type instanceof ZodUndefined) {
    return [void 0];
  } else if (type instanceof ZodNull) {
    return [null];
  } else if (type instanceof ZodOptional) {
    return [void 0, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodNullable) {
    return [null, ...getDiscriminator(type.unwrap())];
  } else if (type instanceof ZodBranded) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodReadonly) {
    return getDiscriminator(type.unwrap());
  } else if (type instanceof ZodCatch) {
    return getDiscriminator(type._def.innerType);
  } else {
    return [];
  }
};
class ZodDiscriminatedUnion extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const discriminator = this.discriminator;
    const discriminatorValue = ctx.data[discriminator];
    const option = this.optionsMap.get(discriminatorValue);
    if (!option) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_union_discriminator,
        options: Array.from(this.optionsMap.keys()),
        path: [discriminator]
      });
      return INVALID;
    }
    if (ctx.common.async) {
      return option._parseAsync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    } else {
      return option._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
    }
  }
  get discriminator() {
    return this._def.discriminator;
  }
  get options() {
    return this._def.options;
  }
  get optionsMap() {
    return this._def.optionsMap;
  }
  /**
   * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
   * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
   * have a different value for each object in the union.
   * @param discriminator the name of the discriminator property
   * @param types an array of object schemas
   * @param params
   */
  static create(discriminator, options, params) {
    const optionsMap = /* @__PURE__ */ new Map();
    for (const type of options) {
      const discriminatorValues = getDiscriminator(type.shape[discriminator]);
      if (!discriminatorValues.length) {
        throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
      }
      for (const value of discriminatorValues) {
        if (optionsMap.has(value)) {
          throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
        }
        optionsMap.set(value, type);
      }
    }
    return new ZodDiscriminatedUnion({
      typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
      discriminator,
      options,
      optionsMap,
      ...processCreateParams(params)
    });
  }
}
function mergeValues(a, b) {
  const aType = getParsedType(a);
  const bType = getParsedType(b);
  if (a === b) {
    return { valid: true, data: a };
  } else if (aType === ZodParsedType.object && bType === ZodParsedType.object) {
    const bKeys = util.objectKeys(b);
    const sharedKeys = util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
    const newObj = { ...a, ...b };
    for (const key of sharedKeys) {
      const sharedValue = mergeValues(a[key], b[key]);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newObj[key] = sharedValue.data;
    }
    return { valid: true, data: newObj };
  } else if (aType === ZodParsedType.array && bType === ZodParsedType.array) {
    if (a.length !== b.length) {
      return { valid: false };
    }
    const newArray = [];
    for (let index = 0; index < a.length; index++) {
      const itemA = a[index];
      const itemB = b[index];
      const sharedValue = mergeValues(itemA, itemB);
      if (!sharedValue.valid) {
        return { valid: false };
      }
      newArray.push(sharedValue.data);
    }
    return { valid: true, data: newArray };
  } else if (aType === ZodParsedType.date && bType === ZodParsedType.date && +a === +b) {
    return { valid: true, data: a };
  } else {
    return { valid: false };
  }
}
class ZodIntersection extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const handleParsed = (parsedLeft, parsedRight) => {
      if (isAborted(parsedLeft) || isAborted(parsedRight)) {
        return INVALID;
      }
      const merged = mergeValues(parsedLeft.value, parsedRight.value);
      if (!merged.valid) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.invalid_intersection_types
        });
        return INVALID;
      }
      if (isDirty(parsedLeft) || isDirty(parsedRight)) {
        status.dirty();
      }
      return { status: status.value, value: merged.data };
    };
    if (ctx.common.async) {
      return Promise.all([
        this._def.left._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        }),
        this._def.right._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        })
      ]).then(([left, right]) => handleParsed(left, right));
    } else {
      return handleParsed(this._def.left._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }), this._def.right._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      }));
    }
  }
}
ZodIntersection.create = (left, right, params) => {
  return new ZodIntersection({
    left,
    right,
    typeName: ZodFirstPartyTypeKind.ZodIntersection,
    ...processCreateParams(params)
  });
};
class ZodTuple extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.array) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.array,
        received: ctx.parsedType
      });
      return INVALID;
    }
    if (ctx.data.length < this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_small,
        minimum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      return INVALID;
    }
    const rest = this._def.rest;
    if (!rest && ctx.data.length > this._def.items.length) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.too_big,
        maximum: this._def.items.length,
        inclusive: true,
        exact: false,
        type: "array"
      });
      status.dirty();
    }
    const items = [...ctx.data].map((item, itemIndex) => {
      const schema = this._def.items[itemIndex] || this._def.rest;
      if (!schema)
        return null;
      return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
    }).filter((x) => !!x);
    if (ctx.common.async) {
      return Promise.all(items).then((results) => {
        return ParseStatus.mergeArray(status, results);
      });
    } else {
      return ParseStatus.mergeArray(status, items);
    }
  }
  get items() {
    return this._def.items;
  }
  rest(rest) {
    return new ZodTuple({
      ...this._def,
      rest
    });
  }
}
ZodTuple.create = (schemas, params) => {
  if (!Array.isArray(schemas)) {
    throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
  }
  return new ZodTuple({
    items: schemas,
    typeName: ZodFirstPartyTypeKind.ZodTuple,
    rest: null,
    ...processCreateParams(params)
  });
};
class ZodRecord extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.object) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.object,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const pairs = [];
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    for (const key in ctx.data) {
      pairs.push({
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
        value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
        alwaysSet: key in ctx.data
      });
    }
    if (ctx.common.async) {
      return ParseStatus.mergeObjectAsync(status, pairs);
    } else {
      return ParseStatus.mergeObjectSync(status, pairs);
    }
  }
  get element() {
    return this._def.valueType;
  }
  static create(first, second, third) {
    if (second instanceof ZodType) {
      return new ZodRecord({
        keyType: first,
        valueType: second,
        typeName: ZodFirstPartyTypeKind.ZodRecord,
        ...processCreateParams(third)
      });
    }
    return new ZodRecord({
      keyType: ZodString.create(),
      valueType: first,
      typeName: ZodFirstPartyTypeKind.ZodRecord,
      ...processCreateParams(second)
    });
  }
}
class ZodMap extends ZodType {
  get keySchema() {
    return this._def.keyType;
  }
  get valueSchema() {
    return this._def.valueType;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.map) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.map,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const keyType = this._def.keyType;
    const valueType = this._def.valueType;
    const pairs = [...ctx.data.entries()].map(([key, value], index) => {
      return {
        key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
        value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"]))
      };
    });
    if (ctx.common.async) {
      const finalMap = /* @__PURE__ */ new Map();
      return Promise.resolve().then(async () => {
        for (const pair of pairs) {
          const key = await pair.key;
          const value = await pair.value;
          if (key.status === "aborted" || value.status === "aborted") {
            return INVALID;
          }
          if (key.status === "dirty" || value.status === "dirty") {
            status.dirty();
          }
          finalMap.set(key.value, value.value);
        }
        return { status: status.value, value: finalMap };
      });
    } else {
      const finalMap = /* @__PURE__ */ new Map();
      for (const pair of pairs) {
        const key = pair.key;
        const value = pair.value;
        if (key.status === "aborted" || value.status === "aborted") {
          return INVALID;
        }
        if (key.status === "dirty" || value.status === "dirty") {
          status.dirty();
        }
        finalMap.set(key.value, value.value);
      }
      return { status: status.value, value: finalMap };
    }
  }
}
ZodMap.create = (keyType, valueType, params) => {
  return new ZodMap({
    valueType,
    keyType,
    typeName: ZodFirstPartyTypeKind.ZodMap,
    ...processCreateParams(params)
  });
};
class ZodSet extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.set) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.set,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const def = this._def;
    if (def.minSize !== null) {
      if (ctx.data.size < def.minSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_small,
          minimum: def.minSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.minSize.message
        });
        status.dirty();
      }
    }
    if (def.maxSize !== null) {
      if (ctx.data.size > def.maxSize.value) {
        addIssueToContext(ctx, {
          code: ZodIssueCode.too_big,
          maximum: def.maxSize.value,
          type: "set",
          inclusive: true,
          exact: false,
          message: def.maxSize.message
        });
        status.dirty();
      }
    }
    const valueType = this._def.valueType;
    function finalizeSet(elements2) {
      const parsedSet = /* @__PURE__ */ new Set();
      for (const element of elements2) {
        if (element.status === "aborted")
          return INVALID;
        if (element.status === "dirty")
          status.dirty();
        parsedSet.add(element.value);
      }
      return { status: status.value, value: parsedSet };
    }
    const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
    if (ctx.common.async) {
      return Promise.all(elements).then((elements2) => finalizeSet(elements2));
    } else {
      return finalizeSet(elements);
    }
  }
  min(minSize, message) {
    return new ZodSet({
      ...this._def,
      minSize: { value: minSize, message: errorUtil.toString(message) }
    });
  }
  max(maxSize, message) {
    return new ZodSet({
      ...this._def,
      maxSize: { value: maxSize, message: errorUtil.toString(message) }
    });
  }
  size(size, message) {
    return this.min(size, message).max(size, message);
  }
  nonempty(message) {
    return this.min(1, message);
  }
}
ZodSet.create = (valueType, params) => {
  return new ZodSet({
    valueType,
    minSize: null,
    maxSize: null,
    typeName: ZodFirstPartyTypeKind.ZodSet,
    ...processCreateParams(params)
  });
};
class ZodFunction extends ZodType {
  constructor() {
    super(...arguments);
    this.validate = this.implement;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.function) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.function,
        received: ctx.parsedType
      });
      return INVALID;
    }
    function makeArgsIssue(args, error2) {
      return makeIssue({
        data: args,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_arguments,
          argumentsError: error2
        }
      });
    }
    function makeReturnsIssue(returns, error2) {
      return makeIssue({
        data: returns,
        path: ctx.path,
        errorMaps: [
          ctx.common.contextualErrorMap,
          ctx.schemaErrorMap,
          getErrorMap(),
          errorMap
        ].filter((x) => !!x),
        issueData: {
          code: ZodIssueCode.invalid_return_type,
          returnTypeError: error2
        }
      });
    }
    const params = { errorMap: ctx.common.contextualErrorMap };
    const fn = ctx.data;
    if (this._def.returns instanceof ZodPromise) {
      const me = this;
      return OK(async function(...args) {
        const error2 = new ZodError([]);
        const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
          error2.addIssue(makeArgsIssue(args, e));
          throw error2;
        });
        const result = await Reflect.apply(fn, this, parsedArgs);
        const parsedReturns = await me._def.returns._def.type.parseAsync(result, params).catch((e) => {
          error2.addIssue(makeReturnsIssue(result, e));
          throw error2;
        });
        return parsedReturns;
      });
    } else {
      const me = this;
      return OK(function(...args) {
        const parsedArgs = me._def.args.safeParse(args, params);
        if (!parsedArgs.success) {
          throw new ZodError([makeArgsIssue(args, parsedArgs.error)]);
        }
        const result = Reflect.apply(fn, this, parsedArgs.data);
        const parsedReturns = me._def.returns.safeParse(result, params);
        if (!parsedReturns.success) {
          throw new ZodError([makeReturnsIssue(result, parsedReturns.error)]);
        }
        return parsedReturns.data;
      });
    }
  }
  parameters() {
    return this._def.args;
  }
  returnType() {
    return this._def.returns;
  }
  args(...items) {
    return new ZodFunction({
      ...this._def,
      args: ZodTuple.create(items).rest(ZodUnknown.create())
    });
  }
  returns(returnType) {
    return new ZodFunction({
      ...this._def,
      returns: returnType
    });
  }
  implement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  strictImplement(func) {
    const validatedFunc = this.parse(func);
    return validatedFunc;
  }
  static create(args, returns, params) {
    return new ZodFunction({
      args: args ? args : ZodTuple.create([]).rest(ZodUnknown.create()),
      returns: returns || ZodUnknown.create(),
      typeName: ZodFirstPartyTypeKind.ZodFunction,
      ...processCreateParams(params)
    });
  }
}
class ZodLazy extends ZodType {
  get schema() {
    return this._def.getter();
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const lazySchema = this._def.getter();
    return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
  }
}
ZodLazy.create = (getter, params) => {
  return new ZodLazy({
    getter,
    typeName: ZodFirstPartyTypeKind.ZodLazy,
    ...processCreateParams(params)
  });
};
class ZodLiteral extends ZodType {
  _parse(input) {
    if (input.data !== this._def.value) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_literal,
        expected: this._def.value
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
  get value() {
    return this._def.value;
  }
}
ZodLiteral.create = (value, params) => {
  return new ZodLiteral({
    value,
    typeName: ZodFirstPartyTypeKind.ZodLiteral,
    ...processCreateParams(params)
  });
};
function createZodEnum(values, params) {
  return new ZodEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodEnum,
    ...processCreateParams(params)
  });
}
class ZodEnum extends ZodType {
  constructor() {
    super(...arguments);
    _ZodEnum_cache.set(this, void 0);
  }
  _parse(input) {
    if (typeof input.data !== "string") {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache)) {
      __classPrivateFieldSet(this, _ZodEnum_cache, new Set(this._def.values));
    }
    if (!__classPrivateFieldGet(this, _ZodEnum_cache).has(input.data)) {
      const ctx = this._getOrReturnCtx(input);
      const expectedValues = this._def.values;
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get options() {
    return this._def.values;
  }
  get enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Values() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  get Enum() {
    const enumValues = {};
    for (const val of this._def.values) {
      enumValues[val] = val;
    }
    return enumValues;
  }
  extract(values, newDef = this._def) {
    return ZodEnum.create(values, {
      ...this._def,
      ...newDef
    });
  }
  exclude(values, newDef = this._def) {
    return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
      ...this._def,
      ...newDef
    });
  }
}
_ZodEnum_cache = /* @__PURE__ */ new WeakMap();
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
  constructor() {
    super(...arguments);
    _ZodNativeEnum_cache.set(this, void 0);
  }
  _parse(input) {
    const nativeEnumValues = util.getValidEnumValues(this._def.values);
    const ctx = this._getOrReturnCtx(input);
    if (ctx.parsedType !== ZodParsedType.string && ctx.parsedType !== ZodParsedType.number) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        expected: util.joinValues(expectedValues),
        received: ctx.parsedType,
        code: ZodIssueCode.invalid_type
      });
      return INVALID;
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache)) {
      __classPrivateFieldSet(this, _ZodNativeEnum_cache, new Set(util.getValidEnumValues(this._def.values)));
    }
    if (!__classPrivateFieldGet(this, _ZodNativeEnum_cache).has(input.data)) {
      const expectedValues = util.objectValues(nativeEnumValues);
      addIssueToContext(ctx, {
        received: ctx.data,
        code: ZodIssueCode.invalid_enum_value,
        options: expectedValues
      });
      return INVALID;
    }
    return OK(input.data);
  }
  get enum() {
    return this._def.values;
  }
}
_ZodNativeEnum_cache = /* @__PURE__ */ new WeakMap();
ZodNativeEnum.create = (values, params) => {
  return new ZodNativeEnum({
    values,
    typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
    ...processCreateParams(params)
  });
};
class ZodPromise extends ZodType {
  unwrap() {
    return this._def.type;
  }
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    if (ctx.parsedType !== ZodParsedType.promise && ctx.common.async === false) {
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.promise,
        received: ctx.parsedType
      });
      return INVALID;
    }
    const promisified = ctx.parsedType === ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
    return OK(promisified.then((data) => {
      return this._def.type.parseAsync(data, {
        path: ctx.path,
        errorMap: ctx.common.contextualErrorMap
      });
    }));
  }
}
ZodPromise.create = (schema, params) => {
  return new ZodPromise({
    type: schema,
    typeName: ZodFirstPartyTypeKind.ZodPromise,
    ...processCreateParams(params)
  });
};
class ZodEffects extends ZodType {
  innerType() {
    return this._def.schema;
  }
  sourceType() {
    return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects ? this._def.schema.sourceType() : this._def.schema;
  }
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    const effect = this._def.effect || null;
    const checkCtx = {
      addIssue: (arg) => {
        addIssueToContext(ctx, arg);
        if (arg.fatal) {
          status.abort();
        } else {
          status.dirty();
        }
      },
      get path() {
        return ctx.path;
      }
    };
    checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
    if (effect.type === "preprocess") {
      const processed = effect.transform(ctx.data, checkCtx);
      if (ctx.common.async) {
        return Promise.resolve(processed).then(async (processed2) => {
          if (status.value === "aborted")
            return INVALID;
          const result = await this._def.schema._parseAsync({
            data: processed2,
            path: ctx.path,
            parent: ctx
          });
          if (result.status === "aborted")
            return INVALID;
          if (result.status === "dirty")
            return DIRTY(result.value);
          if (status.value === "dirty")
            return DIRTY(result.value);
          return result;
        });
      } else {
        if (status.value === "aborted")
          return INVALID;
        const result = this._def.schema._parseSync({
          data: processed,
          path: ctx.path,
          parent: ctx
        });
        if (result.status === "aborted")
          return INVALID;
        if (result.status === "dirty")
          return DIRTY(result.value);
        if (status.value === "dirty")
          return DIRTY(result.value);
        return result;
      }
    }
    if (effect.type === "refinement") {
      const executeRefinement = (acc) => {
        const result = effect.refinement(acc, checkCtx);
        if (ctx.common.async) {
          return Promise.resolve(result);
        }
        if (result instanceof Promise) {
          throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
        }
        return acc;
      };
      if (ctx.common.async === false) {
        const inner = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inner.status === "aborted")
          return INVALID;
        if (inner.status === "dirty")
          status.dirty();
        executeRefinement(inner.value);
        return { status: status.value, value: inner.value };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
          if (inner.status === "aborted")
            return INVALID;
          if (inner.status === "dirty")
            status.dirty();
          return executeRefinement(inner.value).then(() => {
            return { status: status.value, value: inner.value };
          });
        });
      }
    }
    if (effect.type === "transform") {
      if (ctx.common.async === false) {
        const base2 = this._def.schema._parseSync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (!isValid(base2))
          return base2;
        const result = effect.transform(base2.value, checkCtx);
        if (result instanceof Promise) {
          throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
        }
        return { status: status.value, value: result };
      } else {
        return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base2) => {
          if (!isValid(base2))
            return base2;
          return Promise.resolve(effect.transform(base2.value, checkCtx)).then((result) => ({ status: status.value, value: result }));
        });
      }
    }
    util.assertNever(effect);
  }
}
ZodEffects.create = (schema, effect, params) => {
  return new ZodEffects({
    schema,
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    effect,
    ...processCreateParams(params)
  });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
  return new ZodEffects({
    schema,
    effect: { type: "preprocess", transform: preprocess },
    typeName: ZodFirstPartyTypeKind.ZodEffects,
    ...processCreateParams(params)
  });
};
class ZodOptional extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.undefined) {
      return OK(void 0);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodOptional.create = (type, params) => {
  return new ZodOptional({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodOptional,
    ...processCreateParams(params)
  });
};
class ZodNullable extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType === ZodParsedType.null) {
      return OK(null);
    }
    return this._def.innerType._parse(input);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodNullable.create = (type, params) => {
  return new ZodNullable({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodNullable,
    ...processCreateParams(params)
  });
};
class ZodDefault extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    let data = ctx.data;
    if (ctx.parsedType === ZodParsedType.undefined) {
      data = this._def.defaultValue();
    }
    return this._def.innerType._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  removeDefault() {
    return this._def.innerType;
  }
}
ZodDefault.create = (type, params) => {
  return new ZodDefault({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodDefault,
    defaultValue: typeof params.default === "function" ? params.default : () => params.default,
    ...processCreateParams(params)
  });
};
class ZodCatch extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const newCtx = {
      ...ctx,
      common: {
        ...ctx.common,
        issues: []
      }
    };
    const result = this._def.innerType._parse({
      data: newCtx.data,
      path: newCtx.path,
      parent: {
        ...newCtx
      }
    });
    if (isAsync(result)) {
      return result.then((result2) => {
        return {
          status: "valid",
          value: result2.status === "valid" ? result2.value : this._def.catchValue({
            get error() {
              return new ZodError(newCtx.common.issues);
            },
            input: newCtx.data
          })
        };
      });
    } else {
      return {
        status: "valid",
        value: result.status === "valid" ? result.value : this._def.catchValue({
          get error() {
            return new ZodError(newCtx.common.issues);
          },
          input: newCtx.data
        })
      };
    }
  }
  removeCatch() {
    return this._def.innerType;
  }
}
ZodCatch.create = (type, params) => {
  return new ZodCatch({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodCatch,
    catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
    ...processCreateParams(params)
  });
};
class ZodNaN extends ZodType {
  _parse(input) {
    const parsedType = this._getType(input);
    if (parsedType !== ZodParsedType.nan) {
      const ctx = this._getOrReturnCtx(input);
      addIssueToContext(ctx, {
        code: ZodIssueCode.invalid_type,
        expected: ZodParsedType.nan,
        received: ctx.parsedType
      });
      return INVALID;
    }
    return { status: "valid", value: input.data };
  }
}
ZodNaN.create = (params) => {
  return new ZodNaN({
    typeName: ZodFirstPartyTypeKind.ZodNaN,
    ...processCreateParams(params)
  });
};
const BRAND = Symbol("zod_brand");
class ZodBranded extends ZodType {
  _parse(input) {
    const { ctx } = this._processInputParams(input);
    const data = ctx.data;
    return this._def.type._parse({
      data,
      path: ctx.path,
      parent: ctx
    });
  }
  unwrap() {
    return this._def.type;
  }
}
class ZodPipeline extends ZodType {
  _parse(input) {
    const { status, ctx } = this._processInputParams(input);
    if (ctx.common.async) {
      const handleAsync = async () => {
        const inResult = await this._def.in._parseAsync({
          data: ctx.data,
          path: ctx.path,
          parent: ctx
        });
        if (inResult.status === "aborted")
          return INVALID;
        if (inResult.status === "dirty") {
          status.dirty();
          return DIRTY(inResult.value);
        } else {
          return this._def.out._parseAsync({
            data: inResult.value,
            path: ctx.path,
            parent: ctx
          });
        }
      };
      return handleAsync();
    } else {
      const inResult = this._def.in._parseSync({
        data: ctx.data,
        path: ctx.path,
        parent: ctx
      });
      if (inResult.status === "aborted")
        return INVALID;
      if (inResult.status === "dirty") {
        status.dirty();
        return {
          status: "dirty",
          value: inResult.value
        };
      } else {
        return this._def.out._parseSync({
          data: inResult.value,
          path: ctx.path,
          parent: ctx
        });
      }
    }
  }
  static create(a, b) {
    return new ZodPipeline({
      in: a,
      out: b,
      typeName: ZodFirstPartyTypeKind.ZodPipeline
    });
  }
}
class ZodReadonly extends ZodType {
  _parse(input) {
    const result = this._def.innerType._parse(input);
    const freeze = (data) => {
      if (isValid(data)) {
        data.value = Object.freeze(data.value);
      }
      return data;
    };
    return isAsync(result) ? result.then((data) => freeze(data)) : freeze(result);
  }
  unwrap() {
    return this._def.innerType;
  }
}
ZodReadonly.create = (type, params) => {
  return new ZodReadonly({
    innerType: type,
    typeName: ZodFirstPartyTypeKind.ZodReadonly,
    ...processCreateParams(params)
  });
};
function custom(check, params = {}, fatal) {
  if (check)
    return ZodAny.create().superRefine((data, ctx) => {
      var _a, _b;
      if (!check(data)) {
        const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
        const _fatal = (_b = (_a = p.fatal) !== null && _a !== void 0 ? _a : fatal) !== null && _b !== void 0 ? _b : true;
        const p2 = typeof p === "string" ? { message: p } : p;
        ctx.addIssue({ code: "custom", ...p2, fatal: _fatal });
      }
    });
  return ZodAny.create();
}
const late = {
  object: ZodObject.lazycreate
};
var ZodFirstPartyTypeKind;
(function(ZodFirstPartyTypeKind2) {
  ZodFirstPartyTypeKind2["ZodString"] = "ZodString";
  ZodFirstPartyTypeKind2["ZodNumber"] = "ZodNumber";
  ZodFirstPartyTypeKind2["ZodNaN"] = "ZodNaN";
  ZodFirstPartyTypeKind2["ZodBigInt"] = "ZodBigInt";
  ZodFirstPartyTypeKind2["ZodBoolean"] = "ZodBoolean";
  ZodFirstPartyTypeKind2["ZodDate"] = "ZodDate";
  ZodFirstPartyTypeKind2["ZodSymbol"] = "ZodSymbol";
  ZodFirstPartyTypeKind2["ZodUndefined"] = "ZodUndefined";
  ZodFirstPartyTypeKind2["ZodNull"] = "ZodNull";
  ZodFirstPartyTypeKind2["ZodAny"] = "ZodAny";
  ZodFirstPartyTypeKind2["ZodUnknown"] = "ZodUnknown";
  ZodFirstPartyTypeKind2["ZodNever"] = "ZodNever";
  ZodFirstPartyTypeKind2["ZodVoid"] = "ZodVoid";
  ZodFirstPartyTypeKind2["ZodArray"] = "ZodArray";
  ZodFirstPartyTypeKind2["ZodObject"] = "ZodObject";
  ZodFirstPartyTypeKind2["ZodUnion"] = "ZodUnion";
  ZodFirstPartyTypeKind2["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
  ZodFirstPartyTypeKind2["ZodIntersection"] = "ZodIntersection";
  ZodFirstPartyTypeKind2["ZodTuple"] = "ZodTuple";
  ZodFirstPartyTypeKind2["ZodRecord"] = "ZodRecord";
  ZodFirstPartyTypeKind2["ZodMap"] = "ZodMap";
  ZodFirstPartyTypeKind2["ZodSet"] = "ZodSet";
  ZodFirstPartyTypeKind2["ZodFunction"] = "ZodFunction";
  ZodFirstPartyTypeKind2["ZodLazy"] = "ZodLazy";
  ZodFirstPartyTypeKind2["ZodLiteral"] = "ZodLiteral";
  ZodFirstPartyTypeKind2["ZodEnum"] = "ZodEnum";
  ZodFirstPartyTypeKind2["ZodEffects"] = "ZodEffects";
  ZodFirstPartyTypeKind2["ZodNativeEnum"] = "ZodNativeEnum";
  ZodFirstPartyTypeKind2["ZodOptional"] = "ZodOptional";
  ZodFirstPartyTypeKind2["ZodNullable"] = "ZodNullable";
  ZodFirstPartyTypeKind2["ZodDefault"] = "ZodDefault";
  ZodFirstPartyTypeKind2["ZodCatch"] = "ZodCatch";
  ZodFirstPartyTypeKind2["ZodPromise"] = "ZodPromise";
  ZodFirstPartyTypeKind2["ZodBranded"] = "ZodBranded";
  ZodFirstPartyTypeKind2["ZodPipeline"] = "ZodPipeline";
  ZodFirstPartyTypeKind2["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (ZodFirstPartyTypeKind = {}));
const instanceOfType = (cls, params = {
  message: `Input not instance of ${cls.name}`
}) => custom((data) => data instanceof cls, params);
const stringType = ZodString.create;
const numberType = ZodNumber.create;
const nanType = ZodNaN.create;
const bigIntType = ZodBigInt.create;
const booleanType = ZodBoolean.create;
const dateType = ZodDate.create;
const symbolType = ZodSymbol.create;
const undefinedType = ZodUndefined.create;
const nullType = ZodNull.create;
const anyType = ZodAny.create;
const unknownType = ZodUnknown.create;
const neverType = ZodNever.create;
const voidType = ZodVoid.create;
const arrayType = ZodArray.create;
const objectType = ZodObject.create;
const strictObjectType = ZodObject.strictCreate;
const unionType = ZodUnion.create;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
const intersectionType = ZodIntersection.create;
const tupleType = ZodTuple.create;
const recordType = ZodRecord.create;
const mapType = ZodMap.create;
const setType = ZodSet.create;
const functionType = ZodFunction.create;
const lazyType = ZodLazy.create;
const literalType = ZodLiteral.create;
const enumType = ZodEnum.create;
const nativeEnumType = ZodNativeEnum.create;
const promiseType = ZodPromise.create;
const effectsType = ZodEffects.create;
const optionalType = ZodOptional.create;
const nullableType = ZodNullable.create;
const preprocessType = ZodEffects.createWithPreprocess;
const pipelineType = ZodPipeline.create;
const ostring = () => stringType().optional();
const onumber = () => numberType().optional();
const oboolean = () => booleanType().optional();
const coerce = {
  string: ((arg) => ZodString.create({ ...arg, coerce: true })),
  number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
  boolean: ((arg) => ZodBoolean.create({
    ...arg,
    coerce: true
  })),
  bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
  date: ((arg) => ZodDate.create({ ...arg, coerce: true }))
};
const NEVER = INVALID;
var z = /* @__PURE__ */ Object.freeze({
  __proto__: null,
  defaultErrorMap: errorMap,
  setErrorMap,
  getErrorMap,
  makeIssue,
  EMPTY_PATH,
  addIssueToContext,
  ParseStatus,
  INVALID,
  DIRTY,
  OK,
  isAborted,
  isDirty,
  isValid,
  isAsync,
  get util() {
    return util;
  },
  get objectUtil() {
    return objectUtil;
  },
  ZodParsedType,
  getParsedType,
  ZodType,
  datetimeRegex,
  ZodString,
  ZodNumber,
  ZodBigInt,
  ZodBoolean,
  ZodDate,
  ZodSymbol,
  ZodUndefined,
  ZodNull,
  ZodAny,
  ZodUnknown,
  ZodNever,
  ZodVoid,
  ZodArray,
  ZodObject,
  ZodUnion,
  ZodDiscriminatedUnion,
  ZodIntersection,
  ZodTuple,
  ZodRecord,
  ZodMap,
  ZodSet,
  ZodFunction,
  ZodLazy,
  ZodLiteral,
  ZodEnum,
  ZodNativeEnum,
  ZodPromise,
  ZodEffects,
  ZodTransformer: ZodEffects,
  ZodOptional,
  ZodNullable,
  ZodDefault,
  ZodCatch,
  ZodNaN,
  BRAND,
  ZodBranded,
  ZodPipeline,
  ZodReadonly,
  custom,
  Schema: ZodType,
  ZodSchema: ZodType,
  late,
  get ZodFirstPartyTypeKind() {
    return ZodFirstPartyTypeKind;
  },
  coerce,
  any: anyType,
  array: arrayType,
  bigint: bigIntType,
  boolean: booleanType,
  date: dateType,
  discriminatedUnion: discriminatedUnionType,
  effect: effectsType,
  "enum": enumType,
  "function": functionType,
  "instanceof": instanceOfType,
  intersection: intersectionType,
  lazy: lazyType,
  literal: literalType,
  map: mapType,
  nan: nanType,
  nativeEnum: nativeEnumType,
  never: neverType,
  "null": nullType,
  nullable: nullableType,
  number: numberType,
  object: objectType,
  oboolean,
  onumber,
  optional: optionalType,
  ostring,
  pipeline: pipelineType,
  preprocess: preprocessType,
  promise: promiseType,
  record: recordType,
  set: setType,
  strictObject: strictObjectType,
  string: stringType,
  symbol: symbolType,
  transformer: effectsType,
  tuple: tupleType,
  "undefined": undefinedType,
  union: unionType,
  unknown: unknownType,
  "void": voidType,
  NEVER,
  ZodIssueCode,
  quotelessJson,
  ZodError
});
z.object({
  chainId: z.number(),
  address: z.string().refine(isHex).optional(),
  filters: z.array(
    z.object({
      tableId: z.string().refine(isHex),
      key0: z.string().refine(isHex).optional(),
      key1: z.string().refine(isHex).optional()
    })
  ).default([])
});
function invert(obj) {
  const newObj = /* @__PURE__ */ Object.create(null);
  for (const key in obj) {
    const v = obj[key];
    newObj[v] = key;
  }
  return newObj;
}
const TRPC_ERROR_CODES_BY_KEY = {
  /**
  * Invalid JSON was received by the server.
  * An error occurred on the server while parsing the JSON text.
  */
  PARSE_ERROR: -32700,
  /**
  * The JSON sent is not a valid Request object.
  */
  BAD_REQUEST: -32600,
  /**
  * Internal JSON-RPC error.
  */
  INTERNAL_SERVER_ERROR: -32603,
  // Implementation specific errors
  UNAUTHORIZED: -32001,
  FORBIDDEN: -32003,
  NOT_FOUND: -32004,
  METHOD_NOT_SUPPORTED: -32005,
  TIMEOUT: -32008,
  CONFLICT: -32009,
  PRECONDITION_FAILED: -32012,
  PAYLOAD_TOO_LARGE: -32013,
  UNPROCESSABLE_CONTENT: -32022,
  TOO_MANY_REQUESTS: -32029,
  CLIENT_CLOSED_REQUEST: -32099
};
invert(TRPC_ERROR_CODES_BY_KEY);
invert(TRPC_ERROR_CODES_BY_KEY);
typeof window === "undefined" || "Deno" in window || globalThis.process?.env?.NODE_ENV === "test" || !!globalThis.process?.env?.JEST_WORKER_ID || !!globalThis.process?.env?.VITEST_WORKER_ID;
var DoubleIndexedKV = (
  /** @class */
  (function() {
    function DoubleIndexedKV2() {
      this.keyToValue = /* @__PURE__ */ new Map();
      this.valueToKey = /* @__PURE__ */ new Map();
    }
    DoubleIndexedKV2.prototype.set = function(key, value) {
      this.keyToValue.set(key, value);
      this.valueToKey.set(value, key);
    };
    DoubleIndexedKV2.prototype.getByKey = function(key) {
      return this.keyToValue.get(key);
    };
    DoubleIndexedKV2.prototype.getByValue = function(value) {
      return this.valueToKey.get(value);
    };
    DoubleIndexedKV2.prototype.clear = function() {
      this.keyToValue.clear();
      this.valueToKey.clear();
    };
    return DoubleIndexedKV2;
  })()
);
var Registry = (
  /** @class */
  (function() {
    function Registry2(generateIdentifier) {
      this.generateIdentifier = generateIdentifier;
      this.kv = new DoubleIndexedKV();
    }
    Registry2.prototype.register = function(value, identifier) {
      if (this.kv.getByValue(value)) {
        return;
      }
      if (!identifier) {
        identifier = this.generateIdentifier(value);
      }
      this.kv.set(identifier, value);
    };
    Registry2.prototype.clear = function() {
      this.kv.clear();
    };
    Registry2.prototype.getIdentifier = function(value) {
      return this.kv.getByValue(value);
    };
    Registry2.prototype.getValue = function(identifier) {
      return this.kv.getByKey(identifier);
    };
    return Registry2;
  })()
);
var __extends = /* @__PURE__ */ (function() {
  var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf || { __proto__: [] } instanceof Array && function(d2, b2) {
      d2.__proto__ = b2;
    } || function(d2, b2) {
      for (var p in b2) if (Object.prototype.hasOwnProperty.call(b2, p)) d2[p] = b2[p];
    };
    return extendStatics(d, b);
  };
  return function(d, b) {
    if (typeof b !== "function" && b !== null)
      throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
    extendStatics(d, b);
    function __() {
      this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
  };
})();
var ClassRegistry = (
  /** @class */
  (function(_super) {
    __extends(ClassRegistry2, _super);
    function ClassRegistry2() {
      var _this = _super.call(this, function(c) {
        return c.name;
      }) || this;
      _this.classToAllowedProps = /* @__PURE__ */ new Map();
      return _this;
    }
    ClassRegistry2.prototype.register = function(value, options) {
      if (typeof options === "object") {
        if (options.allowProps) {
          this.classToAllowedProps.set(value, options.allowProps);
        }
        _super.prototype.register.call(this, value, options.identifier);
      } else {
        _super.prototype.register.call(this, value, options);
      }
    };
    ClassRegistry2.prototype.getAllowedProps = function(value) {
      return this.classToAllowedProps.get(value);
    };
    return ClassRegistry2;
  })(Registry)
);
var __read$3 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
function valuesOfObj(record) {
  if ("values" in Object) {
    return Object.values(record);
  }
  var values = [];
  for (var key in record) {
    if (record.hasOwnProperty(key)) {
      values.push(record[key]);
    }
  }
  return values;
}
function find(record, predicate) {
  var values = valuesOfObj(record);
  if ("find" in values) {
    return values.find(predicate);
  }
  var valuesNotNever = values;
  for (var i = 0; i < valuesNotNever.length; i++) {
    var value = valuesNotNever[i];
    if (predicate(value)) {
      return value;
    }
  }
  return void 0;
}
function forEach(record, run) {
  Object.entries(record).forEach(function(_a) {
    var _b = __read$3(_a, 2), key = _b[0], value = _b[1];
    return run(value, key);
  });
}
function includes(arr, value) {
  return arr.indexOf(value) !== -1;
}
function findArr(record, predicate) {
  for (var i = 0; i < record.length; i++) {
    var value = record[i];
    if (predicate(value)) {
      return value;
    }
  }
  return void 0;
}
var CustomTransformerRegistry = (
  /** @class */
  (function() {
    function CustomTransformerRegistry2() {
      this.transfomers = {};
    }
    CustomTransformerRegistry2.prototype.register = function(transformer) {
      this.transfomers[transformer.name] = transformer;
    };
    CustomTransformerRegistry2.prototype.findApplicable = function(v) {
      return find(this.transfomers, function(transformer) {
        return transformer.isApplicable(v);
      });
    };
    CustomTransformerRegistry2.prototype.findByName = function(name) {
      return this.transfomers[name];
    };
    return CustomTransformerRegistry2;
  })()
);
var getType$1 = function(payload) {
  return Object.prototype.toString.call(payload).slice(8, -1);
};
var isUndefined = function(payload) {
  return typeof payload === "undefined";
};
var isNull = function(payload) {
  return payload === null;
};
var isPlainObject$1 = function(payload) {
  if (typeof payload !== "object" || payload === null)
    return false;
  if (payload === Object.prototype)
    return false;
  if (Object.getPrototypeOf(payload) === null)
    return true;
  return Object.getPrototypeOf(payload) === Object.prototype;
};
var isEmptyObject = function(payload) {
  return isPlainObject$1(payload) && Object.keys(payload).length === 0;
};
var isArray$1 = function(payload) {
  return Array.isArray(payload);
};
var isString = function(payload) {
  return typeof payload === "string";
};
var isNumber = function(payload) {
  return typeof payload === "number" && !isNaN(payload);
};
var isBoolean = function(payload) {
  return typeof payload === "boolean";
};
var isRegExp = function(payload) {
  return payload instanceof RegExp;
};
var isMap = function(payload) {
  return payload instanceof Map;
};
var isSet = function(payload) {
  return payload instanceof Set;
};
var isSymbol = function(payload) {
  return getType$1(payload) === "Symbol";
};
var isDate = function(payload) {
  return payload instanceof Date && !isNaN(payload.valueOf());
};
var isError = function(payload) {
  return payload instanceof Error;
};
var isNaNValue = function(payload) {
  return typeof payload === "number" && isNaN(payload);
};
var isPrimitive = function(payload) {
  return isBoolean(payload) || isNull(payload) || isUndefined(payload) || isNumber(payload) || isString(payload) || isSymbol(payload);
};
var isBigint = function(payload) {
  return typeof payload === "bigint";
};
var isInfinite = function(payload) {
  return payload === Infinity || payload === -Infinity;
};
var isTypedArray = function(payload) {
  return ArrayBuffer.isView(payload) && !(payload instanceof DataView);
};
var isURL = function(payload) {
  return payload instanceof URL;
};
var escapeKey = function(key) {
  return key.replace(/\./g, "\\.");
};
var stringifyPath = function(path) {
  return path.map(String).map(escapeKey).join(".");
};
var parsePath = function(string) {
  var result = [];
  var segment = "";
  for (var i = 0; i < string.length; i++) {
    var char = string.charAt(i);
    var isEscapedDot = char === "\\" && string.charAt(i + 1) === ".";
    if (isEscapedDot) {
      segment += ".";
      i++;
      continue;
    }
    var isEndOfSegment = char === ".";
    if (isEndOfSegment) {
      result.push(segment);
      segment = "";
      continue;
    }
    segment += char;
  }
  var lastSegment = segment;
  result.push(lastSegment);
  return result;
};
var __assign$1 = function() {
  __assign$1 = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign$1.apply(this, arguments);
};
var __read$2 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray$2 = function(to, from) {
  for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
    to[j] = from[i];
  return to;
};
function simpleTransformation(isApplicable, annotation, transform, untransform) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform
  };
}
var simpleRules = [
  simpleTransformation(isUndefined, "undefined", function() {
    return null;
  }, function() {
    return void 0;
  }),
  simpleTransformation(isBigint, "bigint", function(v) {
    return v.toString();
  }, function(v) {
    if (typeof BigInt !== "undefined") {
      return BigInt(v);
    }
    console.error("Please add a BigInt polyfill.");
    return v;
  }),
  simpleTransformation(isDate, "Date", function(v) {
    return v.toISOString();
  }, function(v) {
    return new Date(v);
  }),
  simpleTransformation(isError, "Error", function(v, superJson) {
    var baseError = {
      name: v.name,
      message: v.message
    };
    superJson.allowedErrorProps.forEach(function(prop) {
      baseError[prop] = v[prop];
    });
    return baseError;
  }, function(v, superJson) {
    var e = new Error(v.message);
    e.name = v.name;
    e.stack = v.stack;
    superJson.allowedErrorProps.forEach(function(prop) {
      e[prop] = v[prop];
    });
    return e;
  }),
  simpleTransformation(isRegExp, "regexp", function(v) {
    return "" + v;
  }, function(regex) {
    var body = regex.slice(1, regex.lastIndexOf("/"));
    var flags = regex.slice(regex.lastIndexOf("/") + 1);
    return new RegExp(body, flags);
  }),
  simpleTransformation(
    isSet,
    "set",
    // (sets only exist in es6+)
    // eslint-disable-next-line es5/no-es6-methods
    function(v) {
      return __spreadArray$2([], __read$2(v.values()));
    },
    function(v) {
      return new Set(v);
    }
  ),
  simpleTransformation(isMap, "map", function(v) {
    return __spreadArray$2([], __read$2(v.entries()));
  }, function(v) {
    return new Map(v);
  }),
  simpleTransformation(function(v) {
    return isNaNValue(v) || isInfinite(v);
  }, "number", function(v) {
    if (isNaNValue(v)) {
      return "NaN";
    }
    if (v > 0) {
      return "Infinity";
    } else {
      return "-Infinity";
    }
  }, Number),
  simpleTransformation(function(v) {
    return v === 0 && 1 / v === -Infinity;
  }, "number", function() {
    return "-0";
  }, Number),
  simpleTransformation(isURL, "URL", function(v) {
    return v.toString();
  }, function(v) {
    return new URL(v);
  })
];
function compositeTransformation(isApplicable, annotation, transform, untransform) {
  return {
    isApplicable,
    annotation,
    transform,
    untransform
  };
}
var symbolRule = compositeTransformation(function(s, superJson) {
  if (isSymbol(s)) {
    var isRegistered = !!superJson.symbolRegistry.getIdentifier(s);
    return isRegistered;
  }
  return false;
}, function(s, superJson) {
  var identifier = superJson.symbolRegistry.getIdentifier(s);
  return ["symbol", identifier];
}, function(v) {
  return v.description;
}, function(_, a, superJson) {
  var value = superJson.symbolRegistry.getValue(a[1]);
  if (!value) {
    throw new Error("Trying to deserialize unknown symbol");
  }
  return value;
});
var constructorToName = [
  Int8Array,
  Uint8Array,
  Int16Array,
  Uint16Array,
  Int32Array,
  Uint32Array,
  Float32Array,
  Float64Array,
  Uint8ClampedArray
].reduce(function(obj, ctor) {
  obj[ctor.name] = ctor;
  return obj;
}, {});
var typedArrayRule = compositeTransformation(isTypedArray, function(v) {
  return ["typed-array", v.constructor.name];
}, function(v) {
  return __spreadArray$2([], __read$2(v));
}, function(v, a) {
  var ctor = constructorToName[a[1]];
  if (!ctor) {
    throw new Error("Trying to deserialize unknown typed array");
  }
  return new ctor(v);
});
function isInstanceOfRegisteredClass(potentialClass, superJson) {
  if (potentialClass === null || potentialClass === void 0 ? void 0 : potentialClass.constructor) {
    var isRegistered = !!superJson.classRegistry.getIdentifier(potentialClass.constructor);
    return isRegistered;
  }
  return false;
}
var classRule = compositeTransformation(isInstanceOfRegisteredClass, function(clazz, superJson) {
  var identifier = superJson.classRegistry.getIdentifier(clazz.constructor);
  return ["class", identifier];
}, function(clazz, superJson) {
  var allowedProps = superJson.classRegistry.getAllowedProps(clazz.constructor);
  if (!allowedProps) {
    return __assign$1({}, clazz);
  }
  var result = {};
  allowedProps.forEach(function(prop) {
    result[prop] = clazz[prop];
  });
  return result;
}, function(v, a, superJson) {
  var clazz = superJson.classRegistry.getValue(a[1]);
  if (!clazz) {
    throw new Error("Trying to deserialize unknown class - check https://github.com/blitz-js/superjson/issues/116#issuecomment-773996564");
  }
  return Object.assign(Object.create(clazz.prototype), v);
});
var customRule = compositeTransformation(function(value, superJson) {
  return !!superJson.customTransformerRegistry.findApplicable(value);
}, function(value, superJson) {
  var transformer = superJson.customTransformerRegistry.findApplicable(value);
  return ["custom", transformer.name];
}, function(value, superJson) {
  var transformer = superJson.customTransformerRegistry.findApplicable(value);
  return transformer.serialize(value);
}, function(v, a, superJson) {
  var transformer = superJson.customTransformerRegistry.findByName(a[1]);
  if (!transformer) {
    throw new Error("Trying to deserialize unknown custom value");
  }
  return transformer.deserialize(v);
});
var compositeRules = [classRule, symbolRule, customRule, typedArrayRule];
var transformValue = function(value, superJson) {
  var applicableCompositeRule = findArr(compositeRules, function(rule) {
    return rule.isApplicable(value, superJson);
  });
  if (applicableCompositeRule) {
    return {
      value: applicableCompositeRule.transform(value, superJson),
      type: applicableCompositeRule.annotation(value, superJson)
    };
  }
  var applicableSimpleRule = findArr(simpleRules, function(rule) {
    return rule.isApplicable(value, superJson);
  });
  if (applicableSimpleRule) {
    return {
      value: applicableSimpleRule.transform(value, superJson),
      type: applicableSimpleRule.annotation
    };
  }
  return void 0;
};
var simpleRulesByAnnotation = {};
simpleRules.forEach(function(rule) {
  simpleRulesByAnnotation[rule.annotation] = rule;
});
var untransformValue = function(json, type, superJson) {
  if (isArray$1(type)) {
    switch (type[0]) {
      case "symbol":
        return symbolRule.untransform(json, type, superJson);
      case "class":
        return classRule.untransform(json, type, superJson);
      case "custom":
        return customRule.untransform(json, type, superJson);
      case "typed-array":
        return typedArrayRule.untransform(json, type, superJson);
      default:
        throw new Error("Unknown transformation: " + type);
    }
  } else {
    var transformation = simpleRulesByAnnotation[type];
    if (!transformation) {
      throw new Error("Unknown transformation: " + type);
    }
    return transformation.untransform(json, superJson);
  }
};
var getNthKey = function(value, n) {
  var keys = value.keys();
  while (n > 0) {
    keys.next();
    n--;
  }
  return keys.next().value;
};
function validatePath(path) {
  if (includes(path, "__proto__")) {
    throw new Error("__proto__ is not allowed as a property");
  }
  if (includes(path, "prototype")) {
    throw new Error("prototype is not allowed as a property");
  }
  if (includes(path, "constructor")) {
    throw new Error("constructor is not allowed as a property");
  }
}
var getDeep = function(object, path) {
  validatePath(path);
  for (var i = 0; i < path.length; i++) {
    var key = path[i];
    if (isSet(object)) {
      object = getNthKey(object, +key);
    } else if (isMap(object)) {
      var row = +key;
      var type = +path[++i] === 0 ? "key" : "value";
      var keyOfRow = getNthKey(object, row);
      switch (type) {
        case "key":
          object = keyOfRow;
          break;
        case "value":
          object = object.get(keyOfRow);
          break;
      }
    } else {
      object = object[key];
    }
  }
  return object;
};
var setDeep = function(object, path, mapper) {
  validatePath(path);
  if (path.length === 0) {
    return mapper(object);
  }
  var parent = object;
  for (var i = 0; i < path.length - 1; i++) {
    var key = path[i];
    if (isArray$1(parent)) {
      var index = +key;
      parent = parent[index];
    } else if (isPlainObject$1(parent)) {
      parent = parent[key];
    } else if (isSet(parent)) {
      var row = +key;
      parent = getNthKey(parent, row);
    } else if (isMap(parent)) {
      var isEnd = i === path.length - 2;
      if (isEnd) {
        break;
      }
      var row = +key;
      var type = +path[++i] === 0 ? "key" : "value";
      var keyOfRow = getNthKey(parent, row);
      switch (type) {
        case "key":
          parent = keyOfRow;
          break;
        case "value":
          parent = parent.get(keyOfRow);
          break;
      }
    }
  }
  var lastKey = path[path.length - 1];
  if (isArray$1(parent)) {
    parent[+lastKey] = mapper(parent[+lastKey]);
  } else if (isPlainObject$1(parent)) {
    parent[lastKey] = mapper(parent[lastKey]);
  }
  if (isSet(parent)) {
    var oldValue = getNthKey(parent, +lastKey);
    var newValue = mapper(oldValue);
    if (oldValue !== newValue) {
      parent["delete"](oldValue);
      parent.add(newValue);
    }
  }
  if (isMap(parent)) {
    var row = +path[path.length - 2];
    var keyToRow = getNthKey(parent, row);
    var type = +lastKey === 0 ? "key" : "value";
    switch (type) {
      case "key": {
        var newKey = mapper(keyToRow);
        parent.set(newKey, parent.get(keyToRow));
        if (newKey !== keyToRow) {
          parent["delete"](keyToRow);
        }
        break;
      }
      case "value": {
        parent.set(keyToRow, mapper(parent.get(keyToRow)));
        break;
      }
    }
  }
  return object;
};
var __read$1 = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray$1 = function(to, from) {
  for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
    to[j] = from[i];
  return to;
};
function traverse(tree, walker2, origin) {
  if (origin === void 0) {
    origin = [];
  }
  if (!tree) {
    return;
  }
  if (!isArray$1(tree)) {
    forEach(tree, function(subtree, key) {
      return traverse(subtree, walker2, __spreadArray$1(__spreadArray$1([], __read$1(origin)), __read$1(parsePath(key))));
    });
    return;
  }
  var _a = __read$1(tree, 2), nodeValue = _a[0], children = _a[1];
  if (children) {
    forEach(children, function(child, key) {
      traverse(child, walker2, __spreadArray$1(__spreadArray$1([], __read$1(origin)), __read$1(parsePath(key))));
    });
  }
  walker2(nodeValue, origin);
}
function applyValueAnnotations(plain, annotations, superJson) {
  traverse(annotations, function(type, path) {
    plain = setDeep(plain, path, function(v) {
      return untransformValue(v, type, superJson);
    });
  });
  return plain;
}
function applyReferentialEqualityAnnotations(plain, annotations) {
  function apply(identicalPaths, path) {
    var object = getDeep(plain, parsePath(path));
    identicalPaths.map(parsePath).forEach(function(identicalObjectPath) {
      plain = setDeep(plain, identicalObjectPath, function() {
        return object;
      });
    });
  }
  if (isArray$1(annotations)) {
    var _a = __read$1(annotations, 2), root = _a[0], other = _a[1];
    root.forEach(function(identicalPath) {
      plain = setDeep(plain, parsePath(identicalPath), function() {
        return plain;
      });
    });
    if (other) {
      forEach(other, apply);
    }
  } else {
    forEach(annotations, apply);
  }
  return plain;
}
var isDeep = function(object, superJson) {
  return isPlainObject$1(object) || isArray$1(object) || isMap(object) || isSet(object) || isInstanceOfRegisteredClass(object, superJson);
};
function addIdentity(object, path, identities) {
  var existingSet = identities.get(object);
  if (existingSet) {
    existingSet.push(path);
  } else {
    identities.set(object, [path]);
  }
}
function generateReferentialEqualityAnnotations(identitites, dedupe) {
  var result = {};
  var rootEqualityPaths = void 0;
  identitites.forEach(function(paths) {
    if (paths.length <= 1) {
      return;
    }
    if (!dedupe) {
      paths = paths.map(function(path) {
        return path.map(String);
      }).sort(function(a, b) {
        return a.length - b.length;
      });
    }
    var _a = __read$1(paths), representativePath = _a[0], identicalPaths = _a.slice(1);
    if (representativePath.length === 0) {
      rootEqualityPaths = identicalPaths.map(stringifyPath);
    } else {
      result[stringifyPath(representativePath)] = identicalPaths.map(stringifyPath);
    }
  });
  if (rootEqualityPaths) {
    if (isEmptyObject(result)) {
      return [rootEqualityPaths];
    } else {
      return [rootEqualityPaths, result];
    }
  } else {
    return isEmptyObject(result) ? void 0 : result;
  }
}
var walker = function(object, identities, superJson, dedupe, path, objectsInThisPath, seenObjects) {
  var _a;
  if (path === void 0) {
    path = [];
  }
  if (objectsInThisPath === void 0) {
    objectsInThisPath = [];
  }
  if (seenObjects === void 0) {
    seenObjects = /* @__PURE__ */ new Map();
  }
  var primitive = isPrimitive(object);
  if (!primitive) {
    addIdentity(object, path, identities);
    var seen = seenObjects.get(object);
    if (seen) {
      return dedupe ? {
        transformedValue: null
      } : seen;
    }
  }
  if (!isDeep(object, superJson)) {
    var transformed_1 = transformValue(object, superJson);
    var result_1 = transformed_1 ? {
      transformedValue: transformed_1.value,
      annotations: [transformed_1.type]
    } : {
      transformedValue: object
    };
    if (!primitive) {
      seenObjects.set(object, result_1);
    }
    return result_1;
  }
  if (includes(objectsInThisPath, object)) {
    return {
      transformedValue: null
    };
  }
  var transformationResult = transformValue(object, superJson);
  var transformed = (_a = transformationResult === null || transformationResult === void 0 ? void 0 : transformationResult.value) !== null && _a !== void 0 ? _a : object;
  var transformedValue = isArray$1(transformed) ? [] : {};
  var innerAnnotations = {};
  forEach(transformed, function(value, index) {
    var recursiveResult = walker(value, identities, superJson, dedupe, __spreadArray$1(__spreadArray$1([], __read$1(path)), [index]), __spreadArray$1(__spreadArray$1([], __read$1(objectsInThisPath)), [object]), seenObjects);
    transformedValue[index] = recursiveResult.transformedValue;
    if (isArray$1(recursiveResult.annotations)) {
      innerAnnotations[index] = recursiveResult.annotations;
    } else if (isPlainObject$1(recursiveResult.annotations)) {
      forEach(recursiveResult.annotations, function(tree, key) {
        innerAnnotations[escapeKey(index) + "." + key] = tree;
      });
    }
  });
  var result = isEmptyObject(innerAnnotations) ? {
    transformedValue,
    annotations: !!transformationResult ? [transformationResult.type] : void 0
  } : {
    transformedValue,
    annotations: !!transformationResult ? [transformationResult.type, innerAnnotations] : innerAnnotations
  };
  if (!primitive) {
    seenObjects.set(object, result);
  }
  return result;
};
function getType(payload) {
  return Object.prototype.toString.call(payload).slice(8, -1);
}
function isArray(payload) {
  return getType(payload) === "Array";
}
function isPlainObject(payload) {
  if (getType(payload) !== "Object")
    return false;
  const prototype = Object.getPrototypeOf(payload);
  return !!prototype && prototype.constructor === Object && prototype === Object.prototype;
}
function assignProp(carry, key, newVal, originalObject, includeNonenumerable) {
  const propType = {}.propertyIsEnumerable.call(originalObject, key) ? "enumerable" : "nonenumerable";
  if (propType === "enumerable")
    carry[key] = newVal;
  if (includeNonenumerable && propType === "nonenumerable") {
    Object.defineProperty(carry, key, {
      value: newVal,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
}
function copy(target, options = {}) {
  if (isArray(target)) {
    return target.map((item) => copy(item, options));
  }
  if (!isPlainObject(target)) {
    return target;
  }
  const props = Object.getOwnPropertyNames(target);
  const symbols = Object.getOwnPropertySymbols(target);
  return [...props, ...symbols].reduce((carry, key) => {
    if (isArray(options.props) && !options.props.includes(key)) {
      return carry;
    }
    const val = target[key];
    const newVal = copy(val, options);
    assignProp(carry, key, newVal, target, options.nonenumerable);
    return carry;
  }, {});
}
var __assign = function() {
  __assign = Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
      s = arguments[i];
      for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
        t[p] = s[p];
    }
    return t;
  };
  return __assign.apply(this, arguments);
};
var __read = function(o, n) {
  var m = typeof Symbol === "function" && o[Symbol.iterator];
  if (!m) return o;
  var i = m.call(o), r, ar = [], e;
  try {
    while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
  } catch (error2) {
    e = { error: error2 };
  } finally {
    try {
      if (r && !r.done && (m = i["return"])) m.call(i);
    } finally {
      if (e) throw e.error;
    }
  }
  return ar;
};
var __spreadArray = function(to, from) {
  for (var i = 0, il = from.length, j = to.length; i < il; i++, j++)
    to[j] = from[i];
  return to;
};
(function() {
  function SuperJSON(_a) {
    var _b = _a === void 0 ? {} : _a, _c = _b.dedupe, dedupe = _c === void 0 ? false : _c;
    this.classRegistry = new ClassRegistry();
    this.symbolRegistry = new Registry(function(s) {
      var _a2;
      return (_a2 = s.description) !== null && _a2 !== void 0 ? _a2 : "";
    });
    this.customTransformerRegistry = new CustomTransformerRegistry();
    this.allowedErrorProps = [];
    this.dedupe = dedupe;
  }
  SuperJSON.prototype.serialize = function(object) {
    var identities = /* @__PURE__ */ new Map();
    var output = walker(object, identities, this, this.dedupe);
    var res = {
      json: output.transformedValue
    };
    if (output.annotations) {
      res.meta = __assign(__assign({}, res.meta), { values: output.annotations });
    }
    var equalityAnnotations = generateReferentialEqualityAnnotations(identities, this.dedupe);
    if (equalityAnnotations) {
      res.meta = __assign(__assign({}, res.meta), { referentialEqualities: equalityAnnotations });
    }
    return res;
  };
  SuperJSON.prototype.deserialize = function(payload) {
    var json = payload.json, meta = payload.meta;
    var result = copy(json);
    if (meta === null || meta === void 0 ? void 0 : meta.values) {
      result = applyValueAnnotations(result, meta.values, this);
    }
    if (meta === null || meta === void 0 ? void 0 : meta.referentialEqualities) {
      result = applyReferentialEqualityAnnotations(result, meta.referentialEqualities);
    }
    return result;
  };
  SuperJSON.prototype.stringify = function(object) {
    return JSON.stringify(this.serialize(object));
  };
  SuperJSON.prototype.parse = function(string) {
    return this.deserialize(JSON.parse(string));
  };
  SuperJSON.prototype.registerClass = function(v, options) {
    this.classRegistry.register(v, options);
  };
  SuperJSON.prototype.registerSymbol = function(v, identifier) {
    this.symbolRegistry.register(v, identifier);
  };
  SuperJSON.prototype.registerCustom = function(transformer, name) {
    this.customTransformerRegistry.register(__assign({ name }, transformer));
  };
  SuperJSON.prototype.allowErrorProps = function() {
    var _a;
    var props = [];
    for (var _i = 0; _i < arguments.length; _i++) {
      props[_i] = arguments[_i];
    }
    (_a = this.allowedErrorProps).push.apply(_a, __spreadArray([], __read(props)));
  };
  SuperJSON.defaultInstance = new SuperJSON();
  SuperJSON.serialize = SuperJSON.defaultInstance.serialize.bind(SuperJSON.defaultInstance);
  SuperJSON.deserialize = SuperJSON.defaultInstance.deserialize.bind(SuperJSON.defaultInstance);
  SuperJSON.stringify = SuperJSON.defaultInstance.stringify.bind(SuperJSON.defaultInstance);
  SuperJSON.parse = SuperJSON.defaultInstance.parse.bind(SuperJSON.defaultInstance);
  SuperJSON.registerClass = SuperJSON.defaultInstance.registerClass.bind(SuperJSON.defaultInstance);
  SuperJSON.registerSymbol = SuperJSON.defaultInstance.registerSymbol.bind(SuperJSON.defaultInstance);
  SuperJSON.registerCustom = SuperJSON.defaultInstance.registerCustom.bind(SuperJSON.defaultInstance);
  SuperJSON.allowErrorProps = SuperJSON.defaultInstance.allowErrorProps.bind(SuperJSON.defaultInstance);
  return SuperJSON;
})();
var clarinet = {};
var hasRequiredClarinet;
function requireClarinet() {
  if (hasRequiredClarinet) return clarinet;
  hasRequiredClarinet = 1;
  (function(exports) {
    (function(clarinet2) {
      var env = typeof process === "object" && process.env ? process.env : self;
      clarinet2.parser = function(opt) {
        return new CParser(opt);
      };
      clarinet2.CParser = CParser;
      clarinet2.CStream = CStream;
      clarinet2.createStream = createStream;
      clarinet2.MAX_BUFFER_LENGTH = 64 * 1024;
      clarinet2.DEBUG = env.CDEBUG === "debug";
      clarinet2.INFO = env.CDEBUG === "debug" || env.CDEBUG === "info";
      clarinet2.EVENTS = [
        "value",
        "string",
        "key",
        "openobject",
        "closeobject",
        "openarray",
        "closearray",
        "error",
        "end",
        "ready"
      ];
      var buffers = {
        textNode: void 0,
        numberNode: ""
      }, streamWraps = clarinet2.EVENTS.filter(function(ev) {
        return ev !== "error" && ev !== "end";
      }), S = 0, Stream;
      clarinet2.STATE = {
        BEGIN: S++,
        VALUE: S++,
        OPEN_OBJECT: S++,
        CLOSE_OBJECT: S++,
        OPEN_ARRAY: S++,
        CLOSE_ARRAY: S++,
        TEXT_ESCAPE: S++,
        STRING: S++,
        BACKSLASH: S++,
        END: S++,
        OPEN_KEY: S++,
        CLOSE_KEY: S++,
        TRUE: S++,
        TRUE2: S++,
        TRUE3: S++,
        FALSE: S++,
        FALSE2: S++,
        FALSE3: S++,
        FALSE4: S++,
        NULL: S++,
        NULL2: S++,
        NULL3: S++,
        NUMBER_DECIMAL_POINT: S++,
        NUMBER_DIGIT: S++
        // [0-9]
      };
      for (var s_ in clarinet2.STATE) clarinet2.STATE[clarinet2.STATE[s_]] = s_;
      S = clarinet2.STATE;
      const Char = {
        tab: 9,
        // \t
        lineFeed: 10,
        // \n
        carriageReturn: 13,
        // \r
        space: 32,
        // " "
        doubleQuote: 34,
        // "
        plus: 43,
        // +
        comma: 44,
        // ,
        minus: 45,
        // -
        period: 46,
        // .
        _0: 48,
        // 0
        _9: 57,
        // 9
        colon: 58,
        // :
        E: 69,
        // E
        openBracket: 91,
        // [
        backslash: 92,
        // \
        closeBracket: 93,
        // ]
        a: 97,
        // a
        b: 98,
        // b
        e: 101,
        // e 
        f: 102,
        // f
        l: 108,
        // l
        n: 110,
        // n
        r: 114,
        // r
        s: 115,
        // s
        t: 116,
        // t
        u: 117,
        // u
        openBrace: 123,
        // {
        closeBrace: 125
        // }
      };
      if (!Object.create) {
        Object.create = function(o) {
          function f() {
            this["__proto__"] = o;
          }
          f.prototype = o;
          return new f();
        };
      }
      if (!Object.getPrototypeOf) {
        Object.getPrototypeOf = function(o) {
          return o["__proto__"];
        };
      }
      if (!Object.keys) {
        Object.keys = function(o) {
          var a = [];
          for (var i in o) if (o.hasOwnProperty(i)) a.push(i);
          return a;
        };
      }
      function checkBufferLength(parser) {
        var maxAllowed = Math.max(clarinet2.MAX_BUFFER_LENGTH, 10), maxActual = 0;
        for (var buffer in buffers) {
          var len = parser[buffer] === void 0 ? 0 : parser[buffer].length;
          if (len > maxAllowed) {
            switch (buffer) {
              case "text":
                closeText(parser);
                break;
              default:
                error2(parser, "Max buffer length exceeded: " + buffer);
            }
          }
          maxActual = Math.max(maxActual, len);
        }
        parser.bufferCheckPosition = clarinet2.MAX_BUFFER_LENGTH - maxActual + parser.position;
      }
      function clearBuffers(parser) {
        for (var buffer in buffers) {
          parser[buffer] = buffers[buffer];
        }
      }
      var stringTokenPattern = /[\\"\n]/g;
      function CParser(opt) {
        if (!(this instanceof CParser)) return new CParser(opt);
        var parser = this;
        clearBuffers(parser);
        parser.bufferCheckPosition = clarinet2.MAX_BUFFER_LENGTH;
        parser.q = parser.c = parser.p = "";
        parser.opt = opt || {};
        parser.closed = parser.closedRoot = parser.sawRoot = false;
        parser.tag = parser.error = null;
        parser.state = S.BEGIN;
        parser.stack = new Array();
        parser.position = parser.column = 0;
        parser.line = 1;
        parser.slashed = false;
        parser.unicodeI = 0;
        parser.unicodeS = null;
        parser.depth = 0;
        emit(parser, "onready");
      }
      CParser.prototype = {
        end: function() {
          end(this);
        },
        write,
        resume: function() {
          this.error = null;
          return this;
        },
        close: function() {
          return this.write(null);
        }
      };
      Stream = function() {
      };
      function createStream(opt) {
        return new CStream(opt);
      }
      function CStream(opt) {
        if (!(this instanceof CStream)) return new CStream(opt);
        this._parser = new CParser(opt);
        this.writable = true;
        this.readable = true;
        this.bytes_remaining = 0;
        this.bytes_in_sequence = 0;
        this.temp_buffs = { "2": new Buffer(2), "3": new Buffer(3), "4": new Buffer(4) };
        this.string = "";
        var me = this;
        Stream.apply(me);
        this._parser.onend = function() {
          me.emit("end");
        };
        this._parser.onerror = function(er) {
          me.emit("error", er);
          me._parser.error = null;
        };
        streamWraps.forEach(function(ev) {
          Object.defineProperty(
            me,
            "on" + ev,
            {
              get: function() {
                return me._parser["on" + ev];
              },
              set: function(h) {
                if (!h) {
                  me.removeAllListeners(ev);
                  me._parser["on" + ev] = h;
                  return h;
                }
                me.on(ev, h);
              },
              enumerable: true,
              configurable: false
            }
          );
        });
      }
      CStream.prototype = Object.create(
        Stream.prototype,
        { constructor: { value: CStream } }
      );
      CStream.prototype.write = function(data) {
        data = new Buffer(data);
        for (var i = 0; i < data.length; i++) {
          var n = data[i];
          if (this.bytes_remaining > 0) {
            for (var j = 0; j < this.bytes_remaining; j++) {
              this.temp_buffs[this.bytes_in_sequence][this.bytes_in_sequence - this.bytes_remaining + j] = data[j];
            }
            this.string = this.temp_buffs[this.bytes_in_sequence].toString();
            this.bytes_in_sequence = this.bytes_remaining = 0;
            i = i + j - 1;
            this._parser.write(this.string);
            this.emit("data", this.string);
            continue;
          }
          if (this.bytes_remaining === 0 && n >= 128) {
            if (n >= 194 && n <= 223) this.bytes_in_sequence = 2;
            if (n >= 224 && n <= 239) this.bytes_in_sequence = 3;
            if (n >= 240 && n <= 244) this.bytes_in_sequence = 4;
            if (this.bytes_in_sequence + i > data.length) {
              for (var k = 0; k <= data.length - 1 - i; k++) {
                this.temp_buffs[this.bytes_in_sequence][k] = data[i + k];
              }
              this.bytes_remaining = i + this.bytes_in_sequence - data.length;
              return true;
            } else {
              this.string = data.slice(i, i + this.bytes_in_sequence).toString();
              i = i + this.bytes_in_sequence - 1;
              this._parser.write(this.string);
              this.emit("data", this.string);
              continue;
            }
          }
          for (var p = i; p < data.length; p++) {
            if (data[p] >= 128) break;
          }
          this.string = data.slice(i, p).toString();
          this._parser.write(this.string);
          this.emit("data", this.string);
          i = p - 1;
          continue;
        }
      };
      CStream.prototype.end = function(chunk) {
        if (chunk && chunk.length) this._parser.write(chunk.toString());
        this._parser.end();
        return true;
      };
      CStream.prototype.on = function(ev, handler) {
        var me = this;
        if (!me._parser["on" + ev] && streamWraps.indexOf(ev) !== -1) {
          me._parser["on" + ev] = function() {
            var args = arguments.length === 1 ? [arguments[0]] : Array.apply(null, arguments);
            args.splice(0, 0, ev);
            me.emit.apply(me, args);
          };
        }
        return Stream.prototype.on.call(me, ev, handler);
      };
      CStream.prototype.destroy = function() {
        clearBuffers(this._parser);
        this.emit("close");
      };
      function emit(parser, event, data) {
        if (clarinet2.INFO) console.log("-- emit", event, data);
        if (parser[event]) parser[event](data);
      }
      function emitNode(parser, event, data) {
        closeValue(parser);
        emit(parser, event, data);
      }
      function closeValue(parser, event) {
        parser.textNode = textopts(parser.opt, parser.textNode);
        if (parser.textNode !== void 0) {
          emit(parser, event ? event : "onvalue", parser.textNode);
        }
        parser.textNode = void 0;
      }
      function closeNumber(parser) {
        if (parser.numberNode)
          emit(parser, "onvalue", parseFloat(parser.numberNode));
        parser.numberNode = "";
      }
      function textopts(opt, text) {
        if (text === void 0) {
          return text;
        }
        if (opt.trim) text = text.trim();
        if (opt.normalize) text = text.replace(/\s+/g, " ");
        return text;
      }
      function error2(parser, er) {
        closeValue(parser);
        er += "\nLine: " + parser.line + "\nColumn: " + parser.column + "\nChar: " + parser.c;
        er = new Error(er);
        parser.error = er;
        emit(parser, "onerror", er);
        return parser;
      }
      function end(parser) {
        if (parser.state !== S.VALUE || parser.depth !== 0)
          error2(parser, "Unexpected end");
        closeValue(parser);
        parser.c = "";
        parser.closed = true;
        emit(parser, "onend");
        CParser.call(parser, parser.opt);
        return parser;
      }
      function isWhitespace(c) {
        return c === Char.carriageReturn || c === Char.lineFeed || c === Char.space || c === Char.tab;
      }
      function write(chunk) {
        var parser = this;
        if (this.error) throw this.error;
        if (parser.closed) return error2(
          parser,
          "Cannot write after close. Assign an onready handler."
        );
        if (chunk === null) return end(parser);
        var i = 0, c = chunk.charCodeAt(0), p = parser.p;
        var lockIncrements = false;
        if (clarinet2.DEBUG) console.log("write -> [" + chunk + "]");
        while (c) {
          p = c;
          parser.c = c = chunk.charCodeAt(i++);
          if (p !== c) parser.p = p;
          else p = parser.p;
          if (!c) break;
          if (clarinet2.DEBUG) console.log(i, c, clarinet2.STATE[parser.state]);
          if (!lockIncrements) {
            parser.position++;
            if (c === Char.lineFeed) {
              parser.line++;
              parser.column = 0;
            } else parser.column++;
          } else {
            lockIncrements = false;
          }
          switch (parser.state) {
            case S.BEGIN:
              if (c === Char.openBrace) parser.state = S.OPEN_OBJECT;
              else if (c === Char.openBracket) parser.state = S.OPEN_ARRAY;
              else if (!isWhitespace(c))
                error2(parser, "Non-whitespace before {[.");
              continue;
            case S.OPEN_KEY:
            case S.OPEN_OBJECT:
              if (isWhitespace(c)) continue;
              if (parser.state === S.OPEN_KEY) parser.stack.push(S.CLOSE_KEY);
              else {
                if (c === Char.closeBrace) {
                  emit(parser, "onopenobject");
                  this.depth++;
                  emit(parser, "oncloseobject");
                  this.depth--;
                  parser.state = parser.stack.pop() || S.VALUE;
                  continue;
                } else parser.stack.push(S.CLOSE_OBJECT);
              }
              if (c === Char.doubleQuote) parser.state = S.STRING;
              else error2(parser, 'Malformed object key should start with "');
              continue;
            case S.CLOSE_KEY:
            case S.CLOSE_OBJECT:
              if (isWhitespace(c)) continue;
              parser.state === S.CLOSE_KEY ? "key" : "object";
              if (c === Char.colon) {
                if (parser.state === S.CLOSE_OBJECT) {
                  parser.stack.push(S.CLOSE_OBJECT);
                  closeValue(parser, "onopenobject");
                  this.depth++;
                } else closeValue(parser, "onkey");
                parser.state = S.VALUE;
              } else if (c === Char.closeBrace) {
                emitNode(parser, "oncloseobject");
                this.depth--;
                parser.state = parser.stack.pop() || S.VALUE;
              } else if (c === Char.comma) {
                if (parser.state === S.CLOSE_OBJECT)
                  parser.stack.push(S.CLOSE_OBJECT);
                closeValue(parser);
                parser.state = S.OPEN_KEY;
              } else error2(parser, "Bad object");
              continue;
            case S.OPEN_ARRAY:
            // after an array there always a value
            case S.VALUE:
              if (isWhitespace(c)) continue;
              if (parser.state === S.OPEN_ARRAY) {
                emit(parser, "onopenarray");
                this.depth++;
                parser.state = S.VALUE;
                if (c === Char.closeBracket) {
                  emit(parser, "onclosearray");
                  this.depth--;
                  parser.state = parser.stack.pop() || S.VALUE;
                  continue;
                } else {
                  parser.stack.push(S.CLOSE_ARRAY);
                }
              }
              if (c === Char.doubleQuote) parser.state = S.STRING;
              else if (c === Char.openBrace) parser.state = S.OPEN_OBJECT;
              else if (c === Char.openBracket) parser.state = S.OPEN_ARRAY;
              else if (c === Char.t) parser.state = S.TRUE;
              else if (c === Char.f) parser.state = S.FALSE;
              else if (c === Char.n) parser.state = S.NULL;
              else if (c === Char.minus) {
                parser.numberNode += "-";
              } else if (Char._0 <= c && c <= Char._9) {
                parser.numberNode += String.fromCharCode(c);
                parser.state = S.NUMBER_DIGIT;
              } else error2(parser, "Bad value");
              continue;
            case S.CLOSE_ARRAY:
              if (c === Char.comma) {
                parser.stack.push(S.CLOSE_ARRAY);
                closeValue(parser, "onvalue");
                parser.state = S.VALUE;
              } else if (c === Char.closeBracket) {
                emitNode(parser, "onclosearray");
                this.depth--;
                parser.state = parser.stack.pop() || S.VALUE;
              } else if (isWhitespace(c))
                continue;
              else error2(parser, "Bad array");
              continue;
            case S.STRING:
              if (parser.textNode === void 0) {
                parser.textNode = "";
              }
              var starti = i - 1, slashed = parser.slashed, unicodeI = parser.unicodeI;
              STRING_BIGLOOP: while (true) {
                if (clarinet2.DEBUG)
                  console.log(
                    i,
                    c,
                    clarinet2.STATE[parser.state],
                    slashed
                  );
                while (unicodeI > 0) {
                  parser.unicodeS += String.fromCharCode(c);
                  c = chunk.charCodeAt(i++);
                  parser.position++;
                  if (unicodeI === 4) {
                    parser.textNode += String.fromCharCode(parseInt(parser.unicodeS, 16));
                    unicodeI = 0;
                    starti = i - 1;
                  } else {
                    unicodeI++;
                  }
                  if (!c) break STRING_BIGLOOP;
                }
                if (c === Char.doubleQuote && !slashed) {
                  parser.state = parser.stack.pop() || S.VALUE;
                  parser.textNode += chunk.substring(starti, i - 1);
                  parser.position += i - 1 - starti;
                  break;
                }
                if (c === Char.backslash && !slashed) {
                  slashed = true;
                  parser.textNode += chunk.substring(starti, i - 1);
                  parser.position += i - 1 - starti;
                  c = chunk.charCodeAt(i++);
                  parser.position++;
                  if (!c) break;
                }
                if (slashed) {
                  slashed = false;
                  if (c === Char.n) {
                    parser.textNode += "\n";
                  } else if (c === Char.r) {
                    parser.textNode += "\r";
                  } else if (c === Char.t) {
                    parser.textNode += "	";
                  } else if (c === Char.f) {
                    parser.textNode += "\f";
                  } else if (c === Char.b) {
                    parser.textNode += "\b";
                  } else if (c === Char.u) {
                    unicodeI = 1;
                    parser.unicodeS = "";
                  } else {
                    parser.textNode += String.fromCharCode(c);
                  }
                  c = chunk.charCodeAt(i++);
                  parser.position++;
                  starti = i - 1;
                  if (!c) break;
                  else continue;
                }
                stringTokenPattern.lastIndex = i;
                var reResult = stringTokenPattern.exec(chunk);
                if (reResult === null) {
                  i = chunk.length + 1;
                  parser.textNode += chunk.substring(starti, i - 1);
                  parser.position += i - 1 - starti;
                  break;
                }
                i = reResult.index + 1;
                c = chunk.charCodeAt(reResult.index);
                if (!c) {
                  parser.textNode += chunk.substring(starti, i - 1);
                  parser.position += i - 1 - starti;
                  break;
                }
              }
              parser.slashed = slashed;
              parser.unicodeI = unicodeI;
              continue;
            case S.TRUE:
              if (c === Char.r) parser.state = S.TRUE2;
              else error2(parser, "Invalid true started with t" + c);
              continue;
            case S.TRUE2:
              if (c === Char.u) parser.state = S.TRUE3;
              else error2(parser, "Invalid true started with tr" + c);
              continue;
            case S.TRUE3:
              if (c === Char.e) {
                emit(parser, "onvalue", true);
                parser.state = parser.stack.pop() || S.VALUE;
              } else error2(parser, "Invalid true started with tru" + c);
              continue;
            case S.FALSE:
              if (c === Char.a) parser.state = S.FALSE2;
              else error2(parser, "Invalid false started with f" + c);
              continue;
            case S.FALSE2:
              if (c === Char.l) parser.state = S.FALSE3;
              else error2(parser, "Invalid false started with fa" + c);
              continue;
            case S.FALSE3:
              if (c === Char.s) parser.state = S.FALSE4;
              else error2(parser, "Invalid false started with fal" + c);
              continue;
            case S.FALSE4:
              if (c === Char.e) {
                emit(parser, "onvalue", false);
                parser.state = parser.stack.pop() || S.VALUE;
              } else error2(parser, "Invalid false started with fals" + c);
              continue;
            case S.NULL:
              if (c === Char.u) parser.state = S.NULL2;
              else error2(parser, "Invalid null started with n" + c);
              continue;
            case S.NULL2:
              if (c === Char.l) parser.state = S.NULL3;
              else error2(parser, "Invalid null started with nu" + c);
              continue;
            case S.NULL3:
              if (c === Char.l) {
                emit(parser, "onvalue", null);
                parser.state = parser.stack.pop() || S.VALUE;
              } else error2(parser, "Invalid null started with nul" + c);
              continue;
            case S.NUMBER_DECIMAL_POINT:
              if (c === Char.period) {
                parser.numberNode += ".";
                parser.state = S.NUMBER_DIGIT;
              } else error2(parser, "Leading zero not followed by .");
              continue;
            case S.NUMBER_DIGIT:
              if (Char._0 <= c && c <= Char._9) parser.numberNode += String.fromCharCode(c);
              else if (c === Char.period) {
                if (parser.numberNode.indexOf(".") !== -1)
                  error2(parser, "Invalid number has two dots");
                parser.numberNode += ".";
              } else if (c === Char.e || c === Char.E) {
                if (parser.numberNode.indexOf("e") !== -1 || parser.numberNode.indexOf("E") !== -1)
                  error2(parser, "Invalid number has two exponential");
                parser.numberNode += "e";
              } else if (c === Char.plus || c === Char.minus) {
                if (!(p === Char.e || p === Char.E))
                  error2(parser, "Invalid symbol in number");
                parser.numberNode += String.fromCharCode(c);
              } else {
                closeNumber(parser);
                i--;
                lockIncrements = true;
                parser.state = parser.stack.pop() || S.VALUE;
              }
              continue;
            default:
              error2(parser, "Unknown state: " + parser.state);
          }
        }
        if (parser.position >= parser.bufferCheckPosition)
          checkBufferLength(parser);
        return parser;
      }
    })(exports);
  })(clarinet);
  return clarinet;
}
requireClarinet();
var schemaAbiTypes = [
  "uint8",
  "uint16",
  "uint24",
  "uint32",
  "uint40",
  "uint48",
  "uint56",
  "uint64",
  "uint72",
  "uint80",
  "uint88",
  "uint96",
  "uint104",
  "uint112",
  "uint120",
  "uint128",
  "uint136",
  "uint144",
  "uint152",
  "uint160",
  "uint168",
  "uint176",
  "uint184",
  "uint192",
  "uint200",
  "uint208",
  "uint216",
  "uint224",
  "uint232",
  "uint240",
  "uint248",
  "uint256",
  "int8",
  "int16",
  "int24",
  "int32",
  "int40",
  "int48",
  "int56",
  "int64",
  "int72",
  "int80",
  "int88",
  "int96",
  "int104",
  "int112",
  "int120",
  "int128",
  "int136",
  "int144",
  "int152",
  "int160",
  "int168",
  "int176",
  "int184",
  "int192",
  "int200",
  "int208",
  "int216",
  "int224",
  "int232",
  "int240",
  "int248",
  "int256",
  "bytes1",
  "bytes2",
  "bytes3",
  "bytes4",
  "bytes5",
  "bytes6",
  "bytes7",
  "bytes8",
  "bytes9",
  "bytes10",
  "bytes11",
  "bytes12",
  "bytes13",
  "bytes14",
  "bytes15",
  "bytes16",
  "bytes17",
  "bytes18",
  "bytes19",
  "bytes20",
  "bytes21",
  "bytes22",
  "bytes23",
  "bytes24",
  "bytes25",
  "bytes26",
  "bytes27",
  "bytes28",
  "bytes29",
  "bytes30",
  "bytes31",
  "bytes32",
  "bool",
  "address",
  "uint8[]",
  "uint16[]",
  "uint24[]",
  "uint32[]",
  "uint40[]",
  "uint48[]",
  "uint56[]",
  "uint64[]",
  "uint72[]",
  "uint80[]",
  "uint88[]",
  "uint96[]",
  "uint104[]",
  "uint112[]",
  "uint120[]",
  "uint128[]",
  "uint136[]",
  "uint144[]",
  "uint152[]",
  "uint160[]",
  "uint168[]",
  "uint176[]",
  "uint184[]",
  "uint192[]",
  "uint200[]",
  "uint208[]",
  "uint216[]",
  "uint224[]",
  "uint232[]",
  "uint240[]",
  "uint248[]",
  "uint256[]",
  "int8[]",
  "int16[]",
  "int24[]",
  "int32[]",
  "int40[]",
  "int48[]",
  "int56[]",
  "int64[]",
  "int72[]",
  "int80[]",
  "int88[]",
  "int96[]",
  "int104[]",
  "int112[]",
  "int120[]",
  "int128[]",
  "int136[]",
  "int144[]",
  "int152[]",
  "int160[]",
  "int168[]",
  "int176[]",
  "int184[]",
  "int192[]",
  "int200[]",
  "int208[]",
  "int216[]",
  "int224[]",
  "int232[]",
  "int240[]",
  "int248[]",
  "int256[]",
  "bytes1[]",
  "bytes2[]",
  "bytes3[]",
  "bytes4[]",
  "bytes5[]",
  "bytes6[]",
  "bytes7[]",
  "bytes8[]",
  "bytes9[]",
  "bytes10[]",
  "bytes11[]",
  "bytes12[]",
  "bytes13[]",
  "bytes14[]",
  "bytes15[]",
  "bytes16[]",
  "bytes17[]",
  "bytes18[]",
  "bytes19[]",
  "bytes20[]",
  "bytes21[]",
  "bytes22[]",
  "bytes23[]",
  "bytes24[]",
  "bytes25[]",
  "bytes26[]",
  "bytes27[]",
  "bytes28[]",
  "bytes29[]",
  "bytes30[]",
  "bytes31[]",
  "bytes32[]",
  "bool[]",
  "address[]",
  "bytes",
  "string"
];
var staticAbiTypes = schemaAbiTypes.slice(0, 98);
function isSchemaAbiType(abiType) {
  return schemaAbiTypes.includes(abiType);
}
function isStaticAbiType(abiType) {
  return staticAbiTypes.includes(abiType);
}
var fixedArrayPattern = /\[\d+\]$/;
function isFixedArrayAbiType(abiType) {
  return typeof abiType === "string" && fixedArrayPattern.test(abiType) && isStaticAbiType(abiType.replace(fixedArrayPattern, ""));
}
function fixedArrayToArray(abiType) {
  return abiType.replace(fixedArrayPattern, "[]");
}
function getKeySchema(table) {
  return Object.fromEntries(table.key.map((fieldName) => [fieldName, table.schema[fieldName]]));
}
function getValueSchema(table) {
  return Object.fromEntries(
    Object.entries(table.schema).filter(([fieldName]) => !table.key.includes(fieldName))
  );
}
function getSchemaTypes(schema) {
  return mapObject(schema, (value) => value.type);
}
function get(input, key) {
  return typeof input === "object" && input != null && hasOwnKey(input, key) ? input[key] : void 0;
}
function hasOwnKey(object, key) {
  return typeof object === "object" && object !== null && object.hasOwnProperty(key);
}
function isObject(input) {
  return input != null && typeof input === "object";
}
function mergeIfUndefined(base2, defaults) {
  const keys = [.../* @__PURE__ */ new Set([...Object.keys(base2), ...Object.keys(defaults)])];
  return Object.fromEntries(
    keys.map((key) => [
      key,
      typeof base2[key] === "undefined" ? defaults[key] : base2[key]
    ])
  );
}
var CODEGEN_DEFAULTS$1 = {
  storeImportPath: "@latticexyz/store/src",
  userTypesFilename: "common.sol",
  outputDirectory: "codegen",
  indexFilename: "index.sol"
};
var TABLE_CODEGEN_DEFAULTS = {
  outputDirectory: "tables",
  tableIdArgument: false,
  storeArgument: false
};
var TABLE_DEPLOY_DEFAULTS = {
  disabled: false
};
var TABLE_DEFAULTS = {
  namespaceLabel: "",
  type: "table"
};
var CONFIG_DEFAULTS$1 = {
  sourceDirectory: "src",
  namespace: ""
};
var AbiTypeScope = {
  types: Object.fromEntries(schemaAbiTypes.map((abiType) => [abiType, abiType]))
};
function extendScope(scope, additionalTypes) {
  return {
    types: {
      ...scope.types,
      ...additionalTypes
    }
  };
}
function validateSchema(schema, scope = AbiTypeScope) {
  if (!isObject(schema)) {
    throw new Error(`Expected schema, received ${JSON.stringify(schema)}`);
  }
  for (const internalType of Object.values(schema)) {
    if (isFixedArrayAbiType(internalType)) continue;
    if (hasOwnKey(scope.types, internalType)) continue;
    throw new Error(`"${String(internalType)}" is not a valid type in this scope.`);
  }
}
function resolveSchema(schema, scope = AbiTypeScope) {
  return Object.fromEntries(
    Object.entries(schema).map(([key, internalType]) => [
      key,
      {
        type: isFixedArrayAbiType(internalType) ? fixedArrayToArray(internalType) : scope.types[internalType],
        internalType
      }
    ])
  );
}
function isSchemaInput(input, scope = AbiTypeScope) {
  return typeof input === "object" && input != null && Object.values(input).every((fieldType) => isFixedArrayAbiType(fieldType) || hasOwnKey(scope.types, fieldType));
}
function getValidKeys(schema, scope = AbiTypeScope) {
  return Object.entries(schema).filter(([, internalType]) => hasOwnKey(scope.types, internalType) && isStaticAbiType(scope.types[internalType])).map(([key]) => key);
}
function isValidPrimaryKey(key, schema, scope = AbiTypeScope) {
  return Array.isArray(key) && key.every(
    (key2) => hasOwnKey(schema, key2) && hasOwnKey(scope.types, schema[key2]) && isStaticAbiType(scope.types[schema[key2]])
  );
}
function validateTable(input, scope = AbiTypeScope, options = { inStoreContext: false }) {
  if (typeof input !== "object" || input == null) {
    throw new Error(`Expected full table config, got \`${JSON.stringify(input)}\``);
  }
  if (!hasOwnKey(input, "schema")) {
    throw new Error("Missing schema input");
  }
  validateSchema(input.schema, scope);
  if (!hasOwnKey(input, "key") || !isValidPrimaryKey(input["key"], input["schema"], scope)) {
    throw new Error(
      `Invalid key. Expected \`(${getValidKeys(input["schema"], scope).map((item) => `"${String(item)}"`).join(" | ")})[]\`, received \`${hasOwnKey(input, "key") && Array.isArray(input.key) ? `[${input.key.map((item) => `"${item}"`).join(", ")}]` : String(get(input, "key"))}\``
    );
  }
  if (hasOwnKey(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`Table \`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey(input, "namespaceLabel") && typeof input.namespaceLabel === "string" && (!hasOwnKey(input, "namespace") || typeof input.namespace !== "string") && input.namespaceLabel.length > 14) {
    throw new Error(
      `Table \`namespace\` defaults to \`namespaceLabel\`, but must fit into a \`bytes14\` and "${input.namespaceLabel}" is too long. Provide explicit \`namespace\` override.`
    );
  }
  if (hasOwnKey(input, "name") && typeof input.name === "string" && input.name.length > 16) {
    throw new Error(`Table \`name\` must fit into a \`bytes16\`, but "${input.name}" is too long.`);
  }
  if (options.inStoreContext && (hasOwnKey(input, "label") || hasOwnKey(input, "namespaceLabel") || hasOwnKey(input, "namespace"))) {
    throw new Error(
      "Overrides of `label`, `namespaceLabel`, and `namespace` are not allowed for tables in this context."
    );
  }
}
function resolveTableCodegen(input) {
  const options = input.codegen;
  return {
    outputDirectory: get(options, "outputDirectory") ?? TABLE_CODEGEN_DEFAULTS.outputDirectory,
    tableIdArgument: get(options, "tableIdArgument") ?? TABLE_CODEGEN_DEFAULTS.tableIdArgument,
    storeArgument: get(options, "storeArgument") ?? TABLE_CODEGEN_DEFAULTS.storeArgument,
    // dataStruct is true if there are at least 2 value fields
    dataStruct: get(options, "dataStruct") ?? Object.keys(input.schema).length - input.key.length > 1
  };
}
function resolveTable(input, scope = AbiTypeScope) {
  const namespaceLabel = input.namespaceLabel ?? TABLE_DEFAULTS.namespaceLabel;
  const namespace = input.namespace ?? namespaceLabel;
  const label = input.label;
  const name = input.name ?? label.slice(0, 16);
  const type = input.type ?? TABLE_DEFAULTS.type;
  const tableId = resourceToHex({ type, namespace, name });
  return {
    label,
    type,
    namespace,
    namespaceLabel,
    name,
    tableId,
    schema: resolveSchema(input.schema, scope),
    key: input.key,
    codegen: resolveTableCodegen(input),
    deploy: mergeIfUndefined(input.deploy ?? {}, TABLE_DEPLOY_DEFAULTS)
  };
}
function isTableShorthandInput(shorthand) {
  return typeof shorthand === "string" || isObject(shorthand) && Object.values(shorthand).every((value) => typeof value === "string");
}
function validateTableShorthand(shorthand, scope = AbiTypeScope) {
  if (typeof shorthand === "string") {
    if (isFixedArrayAbiType(shorthand) || hasOwnKey(scope.types, shorthand)) {
      return;
    }
    throw new Error(`Invalid ABI type. \`${shorthand}\` not found in scope.`);
  }
  if (typeof shorthand === "object" && shorthand !== null) {
    if (isSchemaInput(shorthand, scope)) {
      if (hasOwnKey(shorthand, "id") && isStaticAbiType(scope.types[shorthand.id])) {
        return;
      }
      throw new Error(`Invalid schema. Expected an \`id\` field with a static ABI type or an explicit \`key\` option.`);
    }
    throw new Error(`Invalid schema. Are you using invalid types or missing types in your scope?`);
  }
  throw new Error(`Invalid table shorthand.`);
}
function expandTableShorthand(shorthand, scope) {
  if (typeof shorthand === "string") {
    return {
      schema: {
        id: "bytes32",
        value: shorthand
      },
      key: ["id"]
    };
  }
  if (isSchemaInput(shorthand, scope)) {
    return {
      schema: shorthand,
      key: ["id"]
    };
  }
  return shorthand;
}
function validateTables(input, scope) {
  if (isObject(input)) {
    for (const table of Object.values(input)) {
      if (isTableShorthandInput(table)) {
        validateTableShorthand(table, scope);
      } else {
        validateTable(table, scope, { inStoreContext: true });
      }
    }
    return;
  }
  throw new Error(`Expected tables config, received ${JSON.stringify(input)}`);
}
function resolveTables(tables, scope) {
  return Object.fromEntries(
    Object.entries(tables).map(([label, table]) => {
      return [label, resolveTable(mergeIfUndefined(expandTableShorthand(table, scope), { label }), scope)];
    })
  );
}
function extractInternalType(userTypes) {
  return mapObject(userTypes, (userType) => userType.type);
}
function isUserTypes(userTypes) {
  return isObject(userTypes) && Object.values(userTypes).every((userType) => isSchemaAbiType(userType.type));
}
function scopeWithUserTypes(userTypes, scope = AbiTypeScope) {
  return isUserTypes(userTypes) ? extendScope(scope, extractInternalType(userTypes)) : scope;
}
function validateUserTypes(userTypes) {
  if (!isObject(userTypes)) {
    throw new Error(`Expected userTypes, received ${JSON.stringify(userTypes)}`);
  }
  for (const { type } of Object.values(userTypes)) {
    if (!hasOwnKey(AbiTypeScope.types, type)) {
      throw new Error(`"${String(type)}" is not a valid ABI type.`);
    }
  }
}
function isEnums(enums) {
  return typeof enums === "object" && enums != null && Object.values(enums).every((item) => Array.isArray(item) && item.every((element) => typeof element === "string"));
}
function scopeWithEnums(enums, scope = AbiTypeScope) {
  if (isEnums(enums)) {
    const enumScope = Object.fromEntries(Object.keys(enums).map((key) => [key, "uint8"]));
    return extendScope(scope, enumScope);
  }
  return scope;
}
function resolveEnums(enums) {
  return enums;
}
function mapEnums(enums) {
  return flatMorph(enums, (enumName, enumElements) => [
    enumName,
    flatMorph(enumElements, (enumIndex, enumElement) => [enumElement, enumIndex])
  ]);
}
function resolveCodegen$1(codegen) {
  return isObject(codegen) ? mergeIfUndefined(codegen, CODEGEN_DEFAULTS$1) : CODEGEN_DEFAULTS$1;
}
function validateNamespace$1(input, scope) {
  if (hasOwnKey(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`\`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey(input, "tables")) {
    validateTables(input.tables, scope);
  }
}
function resolveNamespace$1(input, scope = AbiTypeScope) {
  const namespaceLabel = input.label;
  const namespace = input.namespace ?? namespaceLabel.slice(0, 14);
  return {
    label: namespaceLabel,
    namespace,
    tables: resolveTables(
      flatMorph(input.tables ?? {}, (label, table) => {
        return [label, mergeIfUndefined(expandTableShorthand(table, scope), { namespace, namespaceLabel })];
      }),
      scope
    )
  };
}
function validateNamespaces$1(namespaces, scope) {
  if (!isObject(namespaces)) {
    throw new Error(`Expected namespaces, received ${JSON.stringify(namespaces)}`);
  }
  for (const namespace of Object.values(namespaces)) {
    validateNamespace$1(namespace, scope);
  }
}
function resolveNamespaces$1(input, scope) {
  if (!isObject(input)) {
    throw new Error(`Expected namespaces config, received ${JSON.stringify(input)}`);
  }
  const namespaces = flatMorph(input, (label, namespace) => [
    label,
    resolveNamespace$1(mergeIfUndefined(namespace, { label }), scope)
  ]);
  const duplicates = Array.from(groupBy(Object.values(namespaces), (namespace) => namespace.namespace).entries()).filter(([, entries]) => entries.length > 1).map(([namespace]) => namespace);
  if (duplicates.length > 0) {
    throw new Error(`Found namespaces defined more than once in config: ${duplicates.join(", ")}`);
  }
  return namespaces;
}
function flattenNamespacedTables(config) {
  return Object.fromEntries(
    Object.entries(config.namespaces).flatMap(
      ([namespaceLabel, namespace]) => Object.entries(namespace.tables).map(([tableLabel, table]) => [
        namespaceLabel === "" ? tableLabel : `${namespaceLabel}__${tableLabel}`,
        table
      ])
    )
  );
}
function extendedScope(input) {
  return scopeWithEnums(get(input, "enums"), scopeWithUserTypes(get(input, "userTypes")));
}
function validateStore(input) {
  const scope = extendedScope(input);
  if (hasOwnKey(input, "namespaces")) {
    if (hasOwnKey(input, "namespace") || hasOwnKey(input, "tables")) {
      throw new Error("Cannot use `namespaces` with `namespace` or `tables` keys.");
    }
    validateNamespaces$1(input.namespaces, scope);
  }
  if (hasOwnKey(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`\`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey(input, "tables")) {
    validateTables(input.tables, scope);
  }
  if (hasOwnKey(input, "userTypes")) {
    validateUserTypes(input.userTypes);
  }
}
function resolveStore(input) {
  const scope = extendedScope(input);
  const baseNamespace = input.namespace ?? CONFIG_DEFAULTS$1["namespace"];
  const namespaces = input.namespaces ? {
    multipleNamespaces: true,
    namespace: null,
    namespaces: resolveNamespaces$1(input.namespaces, scope)
  } : {
    multipleNamespaces: false,
    namespace: baseNamespace,
    namespaces: resolveNamespaces$1({ [baseNamespace]: input }, scope)
  };
  const tables = flattenNamespacedTables(namespaces);
  return {
    ...namespaces,
    tables,
    sourceDirectory: input.sourceDirectory ?? CONFIG_DEFAULTS$1["sourceDirectory"],
    userTypes: input.userTypes ?? {},
    enums: resolveEnums(input.enums ?? {}),
    enumValues: mapEnums(input.enums ?? {}),
    codegen: resolveCodegen$1(input.codegen)
  };
}
function defineStore(input) {
  validateStore(input);
  return resolveStore(input);
}
var mud_config_default$1 = defineStore({
  namespace: "store",
  codegen: {
    storeImportPath: "./src"
  },
  userTypes: {
    ResourceId: { filePath: "./src/ResourceId.sol", type: "bytes32" },
    FieldLayout: { filePath: "./src/FieldLayout.sol", type: "bytes32" },
    Schema: { filePath: "./src/Schema.sol", type: "bytes32" }
  },
  tables: {
    StoreHooks: {
      schema: {
        tableId: "ResourceId",
        hooks: "bytes21[]"
      },
      key: ["tableId"]
    },
    Tables: {
      schema: {
        tableId: "ResourceId",
        fieldLayout: "FieldLayout",
        keySchema: "Schema",
        valueSchema: "Schema",
        abiEncodedKeyNames: "bytes",
        abiEncodedFieldNames: "bytes"
      },
      key: ["tableId"]
    },
    ResourceIds: {
      schema: {
        resourceId: "ResourceId",
        exists: "bool"
      },
      key: ["resourceId"]
    },
    // This is generic, codegen-only table used by `filterFromList` in `Hook.sol`
    Hooks: {
      schema: {
        resourceId: "ResourceId",
        hooks: "bytes21[]"
      },
      key: ["resourceId"],
      codegen: {
        tableIdArgument: true
      },
      deploy: {
        disabled: true
      }
    }
  }
});
var storeSetRecordEvent = "event Store_SetRecord(bytes32 indexed tableId, bytes32[] keyTuple, bytes staticData, bytes32 encodedLengths, bytes dynamicData)";
var storeSpliceStaticDataEvent = "event Store_SpliceStaticData(bytes32 indexed tableId, bytes32[] keyTuple, uint48 start, bytes data)";
var storeSpliceDynamicDataEvent = "event Store_SpliceDynamicData(bytes32 indexed tableId, bytes32[] keyTuple, uint8 dynamicFieldIndex, uint48 start, uint40 deleteCount, bytes32 encodedLengths, bytes data)";
var storeDeleteRecordEvent = "event Store_DeleteRecord(bytes32 indexed tableId, bytes32[] keyTuple)";
var storeEvents = [
  storeSetRecordEvent,
  storeSpliceStaticDataEvent,
  storeSpliceDynamicDataEvent,
  storeDeleteRecordEvent
];
parseAbi(storeEvents);
var debug$2 = createDebug("mud:store");
debug$2.log = console.debug.bind(console);
var error$3 = createDebug("mud:store");
error$3.log = console.error.bind(console);
hexToBigInt(keccak256(toBytes("mud.store")));
var SYSTEM_DEPLOY_DEFAULTS = {
  disabled: false,
  registerWorldFunctions: true
};
var SYSTEM_DEFAULTS = {
  namespaceLabel: "",
  openAccess: true,
  accessList: []
};
var MODULE_DEFAULTS = {
  root: false,
  useDelegation: false,
  args: [],
  artifactPath: void 0
};
var CODEGEN_DEFAULTS = {
  worldInterfaceName: "IWorld",
  worldgenDirectory: "world",
  systemLibrariesDirectory: "systems",
  generateSystemLibraries: false,
  worldImportPath: "@latticexyz/world/src"
};
var DEPLOY_DEFAULTS = {
  postDeployScript: "PostDeploy",
  deploysDirectory: "./deploys",
  worldsFile: "./worlds.json",
  upgradeableWorldImplementation: false
};
var CONFIG_DEFAULTS = {
  systems: {},
  tables: {},
  excludeSystems: [],
  modules: [],
  codegen: CODEGEN_DEFAULTS,
  deploy: DEPLOY_DEFAULTS
};
function validateSystem(input, options = {}) {
  if (typeof input !== "object" || input == null) {
    throw new Error(`Expected full system config, got \`${JSON.stringify(input)}\``);
  }
  if (options.inNamespace && (hasOwnKey(input, "label") || hasOwnKey(input, "namespaceLabel") || hasOwnKey(input, "namespace"))) {
    throw new Error(
      "Overrides of `label`, `namespaceLabel`, and `namespace` are not allowed for systems in this context."
    );
  }
  if (hasOwnKey(input, "namespaceLabel") && typeof input.namespaceLabel === "string" && (!hasOwnKey(input, "namespace") || typeof input.namespace !== "string") && input.namespaceLabel.length > 14) {
    throw new Error(
      `System \`namespace\` defaults to \`namespaceLabel\`, but must fit into a \`bytes14\` and "${input.namespaceLabel}" is too long. Provide explicit \`namespace\` override.`
    );
  }
  if (hasOwnKey(input, "namespace") && typeof input.namespace === "string" && input.namespace.length > 14) {
    throw new Error(`System \`namespace\` must fit into a \`bytes14\`, but "${input.namespace}" is too long.`);
  }
  if (hasOwnKey(input, "name") && typeof input.name === "string" && input.name.length > 16) {
    throw new Error(`System \`name\` must fit into a \`bytes16\`, but "${input.name}" is too long.`);
  }
}
function resolveSystem(input) {
  const namespaceLabel = input.namespaceLabel ?? SYSTEM_DEFAULTS.namespaceLabel;
  const namespace = input.namespace ?? namespaceLabel;
  const label = input.label;
  const name = input.name ?? label.slice(0, 16);
  const systemId = resourceToHex({ type: "system", namespace, name });
  return mergeIfUndefined(
    {
      ...input,
      label,
      namespaceLabel,
      namespace,
      name,
      systemId,
      deploy: mergeIfUndefined(input.deploy ?? {}, SYSTEM_DEPLOY_DEFAULTS)
    },
    SYSTEM_DEFAULTS
  );
}
function validateSystems(input) {
  if (isObject(input)) {
    for (const system of Object.values(input)) {
      validateSystem(system, { inNamespace: true });
    }
    return;
  }
  throw new Error(`Expected system config, received ${JSON.stringify(input)}`);
}
function resolveSystems(systems, namespaceLabel, namespace) {
  return Object.fromEntries(
    Object.entries(systems).map(([label, system]) => {
      return [label, resolveSystem({ ...system, label, namespaceLabel, namespace })];
    })
  );
}
function validateNamespace(input, scope) {
  if (hasOwnKey(input, "systems")) {
    validateSystems(input.systems);
  }
  validateNamespace$1(input, scope);
}
function resolveNamespace(input, scope = AbiTypeScope) {
  const namespace = resolveNamespace$1(input, scope);
  const systems = resolveSystems(input.systems ?? {}, namespace.label, namespace.namespace);
  return {
    ...namespace,
    systems
  };
}
function validateNamespaces(namespaces, scope) {
  if (!isObject(namespaces)) {
    throw new Error(`Expected namespaces, received ${JSON.stringify(namespaces)}`);
  }
  for (const namespace of Object.values(namespaces)) {
    validateNamespace(namespace, scope);
  }
}
function resolveNamespaces(input, scope) {
  if (!isObject(input)) {
    throw new Error(`Expected namespaces config, received ${JSON.stringify(input)}`);
  }
  const namespaces = flatMorph(input, (label, namespace) => [
    label,
    resolveNamespace(mergeIfUndefined(namespace, { label }), scope)
  ]);
  const duplicates = Array.from(groupBy(Object.values(namespaces), (namespace) => namespace.namespace).entries()).filter(([, entries]) => entries.length > 1).map(([namespace]) => namespace);
  if (duplicates.length > 0) {
    throw new Error(`Found namespaces defined more than once in config: ${duplicates.join(", ")}`);
  }
  return namespaces;
}
function resolveCodegen(codegen) {
  return isObject(codegen) ? mergeIfUndefined(codegen, CODEGEN_DEFAULTS) : CODEGEN_DEFAULTS;
}
function resolveDeploy(deploy) {
  return isObject(deploy) ? mergeIfUndefined(deploy, DEPLOY_DEFAULTS) : DEPLOY_DEFAULTS;
}
function validateWorld(input) {
  const scope = extendedScope(input);
  if (hasOwnKey(input, "namespaces")) {
    if (hasOwnKey(input, "namespace") || hasOwnKey(input, "tables") || hasOwnKey(input, "systems")) {
      throw new Error("Cannot use `namespaces` with `namespace`, `tables`, or `systems` keys.");
    }
    validateNamespaces(input.namespaces, scope);
  }
  if (hasOwnKey(input, "systems")) {
    validateSystems(input.systems);
  }
  validateStore(input);
}
function resolveWorld(input) {
  const scope = extendedScope(input);
  const store = resolveStore(input);
  const namespaces = input.namespaces ? resolveNamespaces(input.namespaces, scope) : resolveNamespaces({ [store.namespace]: input }, scope);
  const tables = flattenNamespacedTables({ namespaces });
  const modules = (input.modules ?? CONFIG_DEFAULTS.modules).map((mod) => mergeIfUndefined(mod, MODULE_DEFAULTS));
  return mergeIfUndefined(
    {
      ...store,
      namespaces,
      tables,
      // TODO: flatten systems from namespaces
      systems: !store.multipleNamespaces && input.systems ? resolveSystems(input.systems, store.namespace, store.namespace) : CONFIG_DEFAULTS.systems,
      excludeSystems: get(input, "excludeSystems"),
      codegen: mergeIfUndefined(store.codegen, resolveCodegen(input.codegen)),
      deploy: resolveDeploy(input.deploy),
      modules
    },
    CONFIG_DEFAULTS
  );
}
function defineWorld(input) {
  validateWorld(input);
  return resolveWorld(input);
}
var tablesConfig = defineWorld({
  namespace: "world",
  userTypes: {
    ResourceId: { filePath: "@latticexyz/store/src/ResourceId.sol", type: "bytes32" }
  },
  tables: {
    NamespaceOwner: {
      schema: {
        namespaceId: "ResourceId",
        owner: "address"
      },
      key: ["namespaceId"]
    },
    ResourceAccess: {
      schema: {
        resourceId: "ResourceId",
        caller: "address",
        access: "bool"
      },
      key: ["resourceId", "caller"]
    },
    InstalledModules: {
      schema: {
        moduleAddress: "address",
        argumentsHash: "bytes32",
        // Hash of the params passed to the `install` function
        isInstalled: "bool"
      },
      key: ["moduleAddress", "argumentsHash"]
    },
    UserDelegationControl: {
      schema: {
        delegator: "address",
        delegatee: "address",
        delegationControlId: "ResourceId"
      },
      key: ["delegator", "delegatee"]
    },
    NamespaceDelegationControl: {
      schema: {
        namespaceId: "ResourceId",
        delegationControlId: "ResourceId"
      },
      key: ["namespaceId"]
    },
    Balances: {
      schema: {
        namespaceId: "ResourceId",
        balance: "uint256"
      },
      key: ["namespaceId"]
    },
    Systems: {
      schema: {
        systemId: "ResourceId",
        system: "address",
        publicAccess: "bool"
      },
      key: ["systemId"],
      codegen: {
        dataStruct: false
      }
    },
    SystemRegistry: {
      schema: {
        system: "address",
        systemId: "ResourceId"
      },
      key: ["system"]
    },
    SystemHooks: {
      schema: {
        systemId: "ResourceId",
        value: "bytes21[]"
      },
      key: ["systemId"]
    },
    FunctionSelectors: {
      schema: {
        worldFunctionSelector: "bytes4",
        systemId: "ResourceId",
        systemFunctionSelector: "bytes4"
      },
      key: ["worldFunctionSelector"],
      codegen: {
        dataStruct: false
      }
    },
    FunctionSignatures: {
      type: "offchainTable",
      schema: {
        functionSelector: "bytes4",
        functionSignature: "string"
      },
      key: ["functionSelector"]
    },
    InitModuleAddress: {
      schema: {
        value: "address"
      },
      key: []
    }
  }
});
defineWorld({
  namespace: "",
  codegen: {
    worldImportPath: "./src",
    worldgenDirectory: "interfaces",
    worldInterfaceName: "IBaseWorld",
    generateSystemLibraries: true,
    // generate into experimental dir until these are stable/audited
    systemLibrariesDirectory: "experimental/systems"
  },
  // Keep aligned with src/modules/init/constants.sol
  systems: {
    AccessManagementSystem: {
      name: "AccessManagement"
    },
    BalanceTransferSystem: {
      name: "BalanceTransfer"
    },
    BatchCallSystem: {
      name: "BatchCall"
    },
    RegistrationSystem: {
      name: "Registration"
    },
    // abstract systems that are deployed as part of RegistrationSystem
    ModuleInstallationSystem: {
      name: "Registration"
    },
    StoreRegistrationSystem: {
      name: "Registration"
    },
    WorldRegistrationSystem: {
      name: "Registration"
    }
  }
});
var mud_config_default = tablesConfig;
function configToTables(config) {
  const tables = Object.values(config.namespaces).flatMap((namespace) => Object.values(namespace.tables));
  return Object.fromEntries(tables.map((table) => [table.label, table]));
}
var mudTables = {
  ...configToTables(mud_config_default$1),
  ...configToTables(mud_config_default)
};
var internalTableIds = Object.values(mudTables).map((table) => table.tableId);
({
  ...mudTables.Tables,
  keySchema: getSchemaTypes(getKeySchema(mudTables.Tables)),
  valueSchema: getSchemaTypes(getValueSchema(mudTables.Tables))
});
var debug$1 = createDebug("mud:store-sync");
var error$2 = createDebug("mud:store-sync");
debug$1.log = console.debug.bind(console);
error$2.log = console.error.bind(console);
debug$1.extend("getSnapshot");
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  __defProp(target, "default", { value: mod, enumerable: true }),
  mod
));
var debug = createDebug("mud:block-events-stream");
var error$1 = createDebug("mud:block-events-stream");
debug.log = console.debug.bind(console);
error$1.log = console.error.bind(console);
var bufferUtil = { exports: {} };
var constants;
var hasRequiredConstants;
function requireConstants() {
  if (hasRequiredConstants) return constants;
  hasRequiredConstants = 1;
  const BINARY_TYPES = ["nodebuffer", "arraybuffer", "fragments"];
  const hasBlob = typeof Blob !== "undefined";
  if (hasBlob) BINARY_TYPES.push("blob");
  constants = {
    BINARY_TYPES,
    CLOSE_TIMEOUT: 3e4,
    EMPTY_BUFFER: Buffer.alloc(0),
    GUID: "258EAFA5-E914-47DA-95CA-C5AB0DC85B11",
    hasBlob,
    kForOnEventAttribute: Symbol("kIsForOnEventAttribute"),
    kListener: Symbol("kListener"),
    kStatusCode: Symbol("status-code"),
    kWebSocket: Symbol("websocket"),
    NOOP: () => {
    }
  };
  return constants;
}
var bufferutil = { exports: {} };
function commonjsRequire(path) {
  throw new Error('Could not dynamically require "' + path + '". Please configure the dynamicRequireTargets or/and ignoreDynamicRequires option of @rollup/plugin-commonjs appropriately for this require call to work.');
}
var nodeGypBuild$1 = { exports: {} };
var nodeGypBuild;
var hasRequiredNodeGypBuild$1;
function requireNodeGypBuild$1() {
  if (hasRequiredNodeGypBuild$1) return nodeGypBuild;
  hasRequiredNodeGypBuild$1 = 1;
  var fs = require$$0$1;
  var path = require$$1$2;
  var os = require$$0;
  var runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : commonjsRequire;
  var vars = process.config && process.config.variables || {};
  var prebuildsOnly = !!process.env.PREBUILDS_ONLY;
  var abi = process.versions.modules;
  var runtime = isElectron() ? "electron" : isNwjs() ? "node-webkit" : "node";
  var arch = process.env.npm_config_arch || os.arch();
  var platform = process.env.npm_config_platform || os.platform();
  var libc = process.env.LIBC || (isAlpine(platform) ? "musl" : "glibc");
  var armv = process.env.ARM_VERSION || (arch === "arm64" ? "8" : vars.arm_version) || "";
  var uv = (process.versions.uv || "").split(".")[0];
  nodeGypBuild = load;
  function load(dir) {
    return runtimeRequire(load.resolve(dir));
  }
  load.resolve = load.path = function(dir) {
    dir = path.resolve(dir || ".");
    try {
      var name = runtimeRequire(path.join(dir, "package.json")).name.toUpperCase().replace(/-/g, "_");
      if (process.env[name + "_PREBUILD"]) dir = process.env[name + "_PREBUILD"];
    } catch (err) {
    }
    if (!prebuildsOnly) {
      var release = getFirst(path.join(dir, "build/Release"), matchBuild);
      if (release) return release;
      var debug3 = getFirst(path.join(dir, "build/Debug"), matchBuild);
      if (debug3) return debug3;
    }
    var prebuild = resolve(dir);
    if (prebuild) return prebuild;
    var nearby = resolve(path.dirname(process.execPath));
    if (nearby) return nearby;
    var target = [
      "platform=" + platform,
      "arch=" + arch,
      "runtime=" + runtime,
      "abi=" + abi,
      "uv=" + uv,
      armv ? "armv=" + armv : "",
      "libc=" + libc,
      "node=" + process.versions.node,
      process.versions.electron ? "electron=" + process.versions.electron : "",
      typeof __webpack_require__ === "function" ? "webpack=true" : ""
      // eslint-disable-line
    ].filter(Boolean).join(" ");
    throw new Error("No native build was found for " + target + "\n    loaded from: " + dir + "\n");
    function resolve(dir2) {
      var tuples = readdirSync(path.join(dir2, "prebuilds")).map(parseTuple);
      var tuple = tuples.filter(matchTuple(platform, arch)).sort(compareTuples)[0];
      if (!tuple) return;
      var prebuilds = path.join(dir2, "prebuilds", tuple.name);
      var parsed = readdirSync(prebuilds).map(parseTags);
      var candidates = parsed.filter(matchTags(runtime, abi));
      var winner = candidates.sort(compareTags(runtime))[0];
      if (winner) return path.join(prebuilds, winner.file);
    }
  };
  function readdirSync(dir) {
    try {
      return fs.readdirSync(dir);
    } catch (err) {
      return [];
    }
  }
  function getFirst(dir, filter) {
    var files = readdirSync(dir).filter(filter);
    return files[0] && path.join(dir, files[0]);
  }
  function matchBuild(name) {
    return /\.node$/.test(name);
  }
  function parseTuple(name) {
    var arr = name.split("-");
    if (arr.length !== 2) return;
    var platform2 = arr[0];
    var architectures = arr[1].split("+");
    if (!platform2) return;
    if (!architectures.length) return;
    if (!architectures.every(Boolean)) return;
    return { name, platform: platform2, architectures };
  }
  function matchTuple(platform2, arch2) {
    return function(tuple) {
      if (tuple == null) return false;
      if (tuple.platform !== platform2) return false;
      return tuple.architectures.includes(arch2);
    };
  }
  function compareTuples(a, b) {
    return a.architectures.length - b.architectures.length;
  }
  function parseTags(file) {
    var arr = file.split(".");
    var extension2 = arr.pop();
    var tags = { file, specificity: 0 };
    if (extension2 !== "node") return;
    for (var i = 0; i < arr.length; i++) {
      var tag = arr[i];
      if (tag === "node" || tag === "electron" || tag === "node-webkit") {
        tags.runtime = tag;
      } else if (tag === "napi") {
        tags.napi = true;
      } else if (tag.slice(0, 3) === "abi") {
        tags.abi = tag.slice(3);
      } else if (tag.slice(0, 2) === "uv") {
        tags.uv = tag.slice(2);
      } else if (tag.slice(0, 4) === "armv") {
        tags.armv = tag.slice(4);
      } else if (tag === "glibc" || tag === "musl") {
        tags.libc = tag;
      } else {
        continue;
      }
      tags.specificity++;
    }
    return tags;
  }
  function matchTags(runtime2, abi2) {
    return function(tags) {
      if (tags == null) return false;
      if (tags.runtime && tags.runtime !== runtime2 && !runtimeAgnostic(tags)) return false;
      if (tags.abi && tags.abi !== abi2 && !tags.napi) return false;
      if (tags.uv && tags.uv !== uv) return false;
      if (tags.armv && tags.armv !== armv) return false;
      if (tags.libc && tags.libc !== libc) return false;
      return true;
    };
  }
  function runtimeAgnostic(tags) {
    return tags.runtime === "node" && tags.napi;
  }
  function compareTags(runtime2) {
    return function(a, b) {
      if (a.runtime !== b.runtime) {
        return a.runtime === runtime2 ? -1 : 1;
      } else if (a.abi !== b.abi) {
        return a.abi ? -1 : 1;
      } else if (a.specificity !== b.specificity) {
        return a.specificity > b.specificity ? -1 : 1;
      } else {
        return 0;
      }
    };
  }
  function isNwjs() {
    return !!(process.versions && process.versions.nw);
  }
  function isElectron() {
    if (process.versions && process.versions.electron) return true;
    if (process.env.ELECTRON_RUN_AS_NODE) return true;
    return typeof window !== "undefined" && window.process && window.process.type === "renderer";
  }
  function isAlpine(platform2) {
    return platform2 === "linux" && fs.existsSync("/etc/alpine-release");
  }
  load.parseTags = parseTags;
  load.matchTags = matchTags;
  load.compareTags = compareTags;
  load.parseTuple = parseTuple;
  load.matchTuple = matchTuple;
  load.compareTuples = compareTuples;
  return nodeGypBuild;
}
var hasRequiredNodeGypBuild;
function requireNodeGypBuild() {
  if (hasRequiredNodeGypBuild) return nodeGypBuild$1.exports;
  hasRequiredNodeGypBuild = 1;
  const runtimeRequire = typeof __webpack_require__ === "function" ? __non_webpack_require__ : commonjsRequire;
  if (typeof runtimeRequire.addon === "function") {
    nodeGypBuild$1.exports = runtimeRequire.addon.bind(runtimeRequire);
  } else {
    nodeGypBuild$1.exports = requireNodeGypBuild$1();
  }
  return nodeGypBuild$1.exports;
}
var fallback$1;
var hasRequiredFallback$1;
function requireFallback$1() {
  if (hasRequiredFallback$1) return fallback$1;
  hasRequiredFallback$1 = 1;
  const mask = (source, mask2, output, offset, length) => {
    for (var i = 0; i < length; i++) {
      output[offset + i] = source[i] ^ mask2[i & 3];
    }
  };
  const unmask = (buffer, mask2) => {
    const length = buffer.length;
    for (var i = 0; i < length; i++) {
      buffer[i] ^= mask2[i & 3];
    }
  };
  fallback$1 = { mask, unmask };
  return fallback$1;
}
var hasRequiredBufferutil;
function requireBufferutil() {
  if (hasRequiredBufferutil) return bufferutil.exports;
  hasRequiredBufferutil = 1;
  try {
    bufferutil.exports = requireNodeGypBuild()(__dirname);
  } catch (e) {
    bufferutil.exports = requireFallback$1();
  }
  return bufferutil.exports;
}
var hasRequiredBufferUtil;
function requireBufferUtil() {
  if (hasRequiredBufferUtil) return bufferUtil.exports;
  hasRequiredBufferUtil = 1;
  const { EMPTY_BUFFER } = requireConstants();
  const FastBuffer = Buffer[Symbol.species];
  function concat(list, totalLength) {
    if (list.length === 0) return EMPTY_BUFFER;
    if (list.length === 1) return list[0];
    const target = Buffer.allocUnsafe(totalLength);
    let offset = 0;
    for (let i = 0; i < list.length; i++) {
      const buf = list[i];
      target.set(buf, offset);
      offset += buf.length;
    }
    if (offset < totalLength) {
      return new FastBuffer(target.buffer, target.byteOffset, offset);
    }
    return target;
  }
  function _mask(source, mask, output, offset, length) {
    for (let i = 0; i < length; i++) {
      output[offset + i] = source[i] ^ mask[i & 3];
    }
  }
  function _unmask(buffer, mask) {
    for (let i = 0; i < buffer.length; i++) {
      buffer[i] ^= mask[i & 3];
    }
  }
  function toArrayBuffer(buf) {
    if (buf.length === buf.buffer.byteLength) {
      return buf.buffer;
    }
    return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.length);
  }
  function toBuffer(data) {
    toBuffer.readOnly = true;
    if (Buffer.isBuffer(data)) return data;
    let buf;
    if (data instanceof ArrayBuffer) {
      buf = new FastBuffer(data);
    } else if (ArrayBuffer.isView(data)) {
      buf = new FastBuffer(data.buffer, data.byteOffset, data.byteLength);
    } else {
      buf = Buffer.from(data);
      toBuffer.readOnly = false;
    }
    return buf;
  }
  bufferUtil.exports = {
    concat,
    mask: _mask,
    toArrayBuffer,
    toBuffer,
    unmask: _unmask
  };
  if (!process.env.WS_NO_BUFFER_UTIL) {
    try {
      const bufferUtil$1 = requireBufferutil();
      bufferUtil.exports.mask = function(source, mask, output, offset, length) {
        if (length < 48) _mask(source, mask, output, offset, length);
        else bufferUtil$1.mask(source, mask, output, offset, length);
      };
      bufferUtil.exports.unmask = function(buffer, mask) {
        if (buffer.length < 32) _unmask(buffer, mask);
        else bufferUtil$1.unmask(buffer, mask);
      };
    } catch (e) {
    }
  }
  return bufferUtil.exports;
}
var limiter;
var hasRequiredLimiter;
function requireLimiter() {
  if (hasRequiredLimiter) return limiter;
  hasRequiredLimiter = 1;
  const kDone = Symbol("kDone");
  const kRun = Symbol("kRun");
  class Limiter {
    /**
     * Creates a new `Limiter`.
     *
     * @param {Number} [concurrency=Infinity] The maximum number of jobs allowed
     *     to run concurrently
     */
    constructor(concurrency) {
      this[kDone] = () => {
        this.pending--;
        this[kRun]();
      };
      this.concurrency = concurrency || Infinity;
      this.jobs = [];
      this.pending = 0;
    }
    /**
     * Adds a job to the queue.
     *
     * @param {Function} job The job to run
     * @public
     */
    add(job) {
      this.jobs.push(job);
      this[kRun]();
    }
    /**
     * Removes a job from the queue and runs it if possible.
     *
     * @private
     */
    [kRun]() {
      if (this.pending === this.concurrency) return;
      if (this.jobs.length) {
        const job = this.jobs.shift();
        this.pending++;
        job(this[kDone]);
      }
    }
  }
  limiter = Limiter;
  return limiter;
}
var permessageDeflate;
var hasRequiredPermessageDeflate;
function requirePermessageDeflate() {
  if (hasRequiredPermessageDeflate) return permessageDeflate;
  hasRequiredPermessageDeflate = 1;
  const zlib = require$$0$2;
  const bufferUtil2 = requireBufferUtil();
  const Limiter = requireLimiter();
  const { kStatusCode } = requireConstants();
  const FastBuffer = Buffer[Symbol.species];
  const TRAILER = Buffer.from([0, 0, 255, 255]);
  const kPerMessageDeflate = Symbol("permessage-deflate");
  const kTotalLength = Symbol("total-length");
  const kCallback = Symbol("callback");
  const kBuffers = Symbol("buffers");
  const kError = Symbol("error");
  let zlibLimiter;
  class PerMessageDeflate {
    /**
     * Creates a PerMessageDeflate instance.
     *
     * @param {Object} [options] Configuration options
     * @param {(Boolean|Number)} [options.clientMaxWindowBits] Advertise support
     *     for, or request, a custom client window size
     * @param {Boolean} [options.clientNoContextTakeover=false] Advertise/
     *     acknowledge disabling of client context takeover
     * @param {Number} [options.concurrencyLimit=10] The number of concurrent
     *     calls to zlib
     * @param {(Boolean|Number)} [options.serverMaxWindowBits] Request/confirm the
     *     use of a custom server window size
     * @param {Boolean} [options.serverNoContextTakeover=false] Request/accept
     *     disabling of server context takeover
     * @param {Number} [options.threshold=1024] Size (in bytes) below which
     *     messages should not be compressed if context takeover is disabled
     * @param {Object} [options.zlibDeflateOptions] Options to pass to zlib on
     *     deflate
     * @param {Object} [options.zlibInflateOptions] Options to pass to zlib on
     *     inflate
     * @param {Boolean} [isServer=false] Create the instance in either server or
     *     client mode
     * @param {Number} [maxPayload=0] The maximum allowed message length
     */
    constructor(options, isServer, maxPayload) {
      this._maxPayload = maxPayload | 0;
      this._options = options || {};
      this._threshold = this._options.threshold !== void 0 ? this._options.threshold : 1024;
      this._isServer = !!isServer;
      this._deflate = null;
      this._inflate = null;
      this.params = null;
      if (!zlibLimiter) {
        const concurrency = this._options.concurrencyLimit !== void 0 ? this._options.concurrencyLimit : 10;
        zlibLimiter = new Limiter(concurrency);
      }
    }
    /**
     * @type {String}
     */
    static get extensionName() {
      return "permessage-deflate";
    }
    /**
     * Create an extension negotiation offer.
     *
     * @return {Object} Extension parameters
     * @public
     */
    offer() {
      const params = {};
      if (this._options.serverNoContextTakeover) {
        params.server_no_context_takeover = true;
      }
      if (this._options.clientNoContextTakeover) {
        params.client_no_context_takeover = true;
      }
      if (this._options.serverMaxWindowBits) {
        params.server_max_window_bits = this._options.serverMaxWindowBits;
      }
      if (this._options.clientMaxWindowBits) {
        params.client_max_window_bits = this._options.clientMaxWindowBits;
      } else if (this._options.clientMaxWindowBits == null) {
        params.client_max_window_bits = true;
      }
      return params;
    }
    /**
     * Accept an extension negotiation offer/response.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Object} Accepted configuration
     * @public
     */
    accept(configurations) {
      configurations = this.normalizeParams(configurations);
      this.params = this._isServer ? this.acceptAsServer(configurations) : this.acceptAsClient(configurations);
      return this.params;
    }
    /**
     * Releases all resources used by the extension.
     *
     * @public
     */
    cleanup() {
      if (this._inflate) {
        this._inflate.close();
        this._inflate = null;
      }
      if (this._deflate) {
        const callback = this._deflate[kCallback];
        this._deflate.close();
        this._deflate = null;
        if (callback) {
          callback(
            new Error(
              "The deflate stream was closed while data was being processed"
            )
          );
        }
      }
    }
    /**
     *  Accept an extension negotiation offer.
     *
     * @param {Array} offers The extension negotiation offers
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsServer(offers) {
      const opts = this._options;
      const accepted = offers.find((params) => {
        if (opts.serverNoContextTakeover === false && params.server_no_context_takeover || params.server_max_window_bits && (opts.serverMaxWindowBits === false || typeof opts.serverMaxWindowBits === "number" && opts.serverMaxWindowBits > params.server_max_window_bits) || typeof opts.clientMaxWindowBits === "number" && !params.client_max_window_bits) {
          return false;
        }
        return true;
      });
      if (!accepted) {
        throw new Error("None of the extension offers can be accepted");
      }
      if (opts.serverNoContextTakeover) {
        accepted.server_no_context_takeover = true;
      }
      if (opts.clientNoContextTakeover) {
        accepted.client_no_context_takeover = true;
      }
      if (typeof opts.serverMaxWindowBits === "number") {
        accepted.server_max_window_bits = opts.serverMaxWindowBits;
      }
      if (typeof opts.clientMaxWindowBits === "number") {
        accepted.client_max_window_bits = opts.clientMaxWindowBits;
      } else if (accepted.client_max_window_bits === true || opts.clientMaxWindowBits === false) {
        delete accepted.client_max_window_bits;
      }
      return accepted;
    }
    /**
     * Accept the extension negotiation response.
     *
     * @param {Array} response The extension negotiation response
     * @return {Object} Accepted configuration
     * @private
     */
    acceptAsClient(response) {
      const params = response[0];
      if (this._options.clientNoContextTakeover === false && params.client_no_context_takeover) {
        throw new Error('Unexpected parameter "client_no_context_takeover"');
      }
      if (!params.client_max_window_bits) {
        if (typeof this._options.clientMaxWindowBits === "number") {
          params.client_max_window_bits = this._options.clientMaxWindowBits;
        }
      } else if (this._options.clientMaxWindowBits === false || typeof this._options.clientMaxWindowBits === "number" && params.client_max_window_bits > this._options.clientMaxWindowBits) {
        throw new Error(
          'Unexpected or invalid parameter "client_max_window_bits"'
        );
      }
      return params;
    }
    /**
     * Normalize parameters.
     *
     * @param {Array} configurations The extension negotiation offers/reponse
     * @return {Array} The offers/response with normalized parameters
     * @private
     */
    normalizeParams(configurations) {
      configurations.forEach((params) => {
        Object.keys(params).forEach((key) => {
          let value = params[key];
          if (value.length > 1) {
            throw new Error(`Parameter "${key}" must have only a single value`);
          }
          value = value[0];
          if (key === "client_max_window_bits") {
            if (value !== true) {
              const num = +value;
              if (!Number.isInteger(num) || num < 8 || num > 15) {
                throw new TypeError(
                  `Invalid value for parameter "${key}": ${value}`
                );
              }
              value = num;
            } else if (!this._isServer) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
          } else if (key === "server_max_window_bits") {
            const num = +value;
            if (!Number.isInteger(num) || num < 8 || num > 15) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
            value = num;
          } else if (key === "client_no_context_takeover" || key === "server_no_context_takeover") {
            if (value !== true) {
              throw new TypeError(
                `Invalid value for parameter "${key}": ${value}`
              );
            }
          } else {
            throw new Error(`Unknown parameter "${key}"`);
          }
          params[key] = value;
        });
      });
      return configurations;
    }
    /**
     * Decompress data. Concurrency limited.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    decompress(data, fin, callback) {
      zlibLimiter.add((done) => {
        this._decompress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }
    /**
     * Compress data. Concurrency limited.
     *
     * @param {(Buffer|String)} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @public
     */
    compress(data, fin, callback) {
      zlibLimiter.add((done) => {
        this._compress(data, fin, (err, result) => {
          done();
          callback(err, result);
        });
      });
    }
    /**
     * Decompress data.
     *
     * @param {Buffer} data Compressed data
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _decompress(data, fin, callback) {
      const endpoint = this._isServer ? "client" : "server";
      if (!this._inflate) {
        const key = `${endpoint}_max_window_bits`;
        const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
        this._inflate = zlib.createInflateRaw({
          ...this._options.zlibInflateOptions,
          windowBits
        });
        this._inflate[kPerMessageDeflate] = this;
        this._inflate[kTotalLength] = 0;
        this._inflate[kBuffers] = [];
        this._inflate.on("error", inflateOnError);
        this._inflate.on("data", inflateOnData);
      }
      this._inflate[kCallback] = callback;
      this._inflate.write(data);
      if (fin) this._inflate.write(TRAILER);
      this._inflate.flush(() => {
        const err = this._inflate[kError];
        if (err) {
          this._inflate.close();
          this._inflate = null;
          callback(err);
          return;
        }
        const data2 = bufferUtil2.concat(
          this._inflate[kBuffers],
          this._inflate[kTotalLength]
        );
        if (this._inflate._readableState.endEmitted) {
          this._inflate.close();
          this._inflate = null;
        } else {
          this._inflate[kTotalLength] = 0;
          this._inflate[kBuffers] = [];
          if (fin && this.params[`${endpoint}_no_context_takeover`]) {
            this._inflate.reset();
          }
        }
        callback(null, data2);
      });
    }
    /**
     * Compress data.
     *
     * @param {(Buffer|String)} data Data to compress
     * @param {Boolean} fin Specifies whether or not this is the last fragment
     * @param {Function} callback Callback
     * @private
     */
    _compress(data, fin, callback) {
      const endpoint = this._isServer ? "server" : "client";
      if (!this._deflate) {
        const key = `${endpoint}_max_window_bits`;
        const windowBits = typeof this.params[key] !== "number" ? zlib.Z_DEFAULT_WINDOWBITS : this.params[key];
        this._deflate = zlib.createDeflateRaw({
          ...this._options.zlibDeflateOptions,
          windowBits
        });
        this._deflate[kTotalLength] = 0;
        this._deflate[kBuffers] = [];
        this._deflate.on("data", deflateOnData);
      }
      this._deflate[kCallback] = callback;
      this._deflate.write(data);
      this._deflate.flush(zlib.Z_SYNC_FLUSH, () => {
        if (!this._deflate) {
          return;
        }
        let data2 = bufferUtil2.concat(
          this._deflate[kBuffers],
          this._deflate[kTotalLength]
        );
        if (fin) {
          data2 = new FastBuffer(data2.buffer, data2.byteOffset, data2.length - 4);
        }
        this._deflate[kCallback] = null;
        this._deflate[kTotalLength] = 0;
        this._deflate[kBuffers] = [];
        if (fin && this.params[`${endpoint}_no_context_takeover`]) {
          this._deflate.reset();
        }
        callback(null, data2);
      });
    }
  }
  permessageDeflate = PerMessageDeflate;
  function deflateOnData(chunk) {
    this[kBuffers].push(chunk);
    this[kTotalLength] += chunk.length;
  }
  function inflateOnData(chunk) {
    this[kTotalLength] += chunk.length;
    if (this[kPerMessageDeflate]._maxPayload < 1 || this[kTotalLength] <= this[kPerMessageDeflate]._maxPayload) {
      this[kBuffers].push(chunk);
      return;
    }
    this[kError] = new RangeError("Max payload size exceeded");
    this[kError].code = "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH";
    this[kError][kStatusCode] = 1009;
    this.removeListener("data", inflateOnData);
    this.reset();
  }
  function inflateOnError(err) {
    this[kPerMessageDeflate]._inflate = null;
    if (this[kError]) {
      this[kCallback](this[kError]);
      return;
    }
    err[kStatusCode] = 1007;
    this[kCallback](err);
  }
  return permessageDeflate;
}
var validation = { exports: {} };
var utf8Validate = { exports: {} };
var fallback;
var hasRequiredFallback;
function requireFallback() {
  if (hasRequiredFallback) return fallback;
  hasRequiredFallback = 1;
  function isValidUTF8(buf) {
    const len = buf.length;
    let i = 0;
    while (i < len) {
      if ((buf[i] & 128) === 0) {
        i++;
      } else if ((buf[i] & 224) === 192) {
        if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
          return false;
        }
        i += 2;
      } else if ((buf[i] & 240) === 224) {
        if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // overlong
        buf[i] === 237 && (buf[i + 1] & 224) === 160) {
          return false;
        }
        i += 3;
      } else if ((buf[i] & 248) === 240) {
        if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // overlong
        buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
          return false;
        }
        i += 4;
      } else {
        return false;
      }
    }
    return true;
  }
  fallback = isValidUTF8;
  return fallback;
}
var hasRequiredUtf8Validate;
function requireUtf8Validate() {
  if (hasRequiredUtf8Validate) return utf8Validate.exports;
  hasRequiredUtf8Validate = 1;
  try {
    utf8Validate.exports = requireNodeGypBuild()(__dirname);
  } catch (e) {
    utf8Validate.exports = requireFallback();
  }
  return utf8Validate.exports;
}
var hasRequiredValidation;
function requireValidation() {
  if (hasRequiredValidation) return validation.exports;
  hasRequiredValidation = 1;
  const { isUtf8 } = require$$0$3;
  const { hasBlob } = requireConstants();
  const tokenChars = [
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 0 - 15
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    // 16 - 31
    0,
    1,
    0,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    1,
    1,
    0,
    1,
    1,
    0,
    // 32 - 47
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    // 48 - 63
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 64 - 79
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    1,
    1,
    // 80 - 95
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    // 96 - 111
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    1,
    0,
    1,
    0
    // 112 - 127
  ];
  function isValidStatusCode(code) {
    return code >= 1e3 && code <= 1014 && code !== 1004 && code !== 1005 && code !== 1006 || code >= 3e3 && code <= 4999;
  }
  function _isValidUTF8(buf) {
    const len = buf.length;
    let i = 0;
    while (i < len) {
      if ((buf[i] & 128) === 0) {
        i++;
      } else if ((buf[i] & 224) === 192) {
        if (i + 1 === len || (buf[i + 1] & 192) !== 128 || (buf[i] & 254) === 192) {
          return false;
        }
        i += 2;
      } else if ((buf[i] & 240) === 224) {
        if (i + 2 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || buf[i] === 224 && (buf[i + 1] & 224) === 128 || // Overlong
        buf[i] === 237 && (buf[i + 1] & 224) === 160) {
          return false;
        }
        i += 3;
      } else if ((buf[i] & 248) === 240) {
        if (i + 3 >= len || (buf[i + 1] & 192) !== 128 || (buf[i + 2] & 192) !== 128 || (buf[i + 3] & 192) !== 128 || buf[i] === 240 && (buf[i + 1] & 240) === 128 || // Overlong
        buf[i] === 244 && buf[i + 1] > 143 || buf[i] > 244) {
          return false;
        }
        i += 4;
      } else {
        return false;
      }
    }
    return true;
  }
  function isBlob(value) {
    return hasBlob && typeof value === "object" && typeof value.arrayBuffer === "function" && typeof value.type === "string" && typeof value.stream === "function" && (value[Symbol.toStringTag] === "Blob" || value[Symbol.toStringTag] === "File");
  }
  validation.exports = {
    isBlob,
    isValidStatusCode,
    isValidUTF8: _isValidUTF8,
    tokenChars
  };
  if (isUtf8) {
    validation.exports.isValidUTF8 = function(buf) {
      return buf.length < 24 ? _isValidUTF8(buf) : isUtf8(buf);
    };
  } else if (!process.env.WS_NO_UTF_8_VALIDATE) {
    try {
      const isValidUTF8 = requireUtf8Validate();
      validation.exports.isValidUTF8 = function(buf) {
        return buf.length < 32 ? _isValidUTF8(buf) : isValidUTF8(buf);
      };
    } catch (e) {
    }
  }
  return validation.exports;
}
var receiver;
var hasRequiredReceiver;
function requireReceiver() {
  if (hasRequiredReceiver) return receiver;
  hasRequiredReceiver = 1;
  const { Writable } = require$$0$4;
  const PerMessageDeflate = requirePermessageDeflate();
  const {
    BINARY_TYPES,
    EMPTY_BUFFER,
    kStatusCode,
    kWebSocket
  } = requireConstants();
  const { concat, toArrayBuffer, unmask } = requireBufferUtil();
  const { isValidStatusCode, isValidUTF8 } = requireValidation();
  const FastBuffer = Buffer[Symbol.species];
  const GET_INFO = 0;
  const GET_PAYLOAD_LENGTH_16 = 1;
  const GET_PAYLOAD_LENGTH_64 = 2;
  const GET_MASK = 3;
  const GET_DATA = 4;
  const INFLATING = 5;
  const DEFER_EVENT = 6;
  class Receiver extends Writable {
    /**
     * Creates a Receiver instance.
     *
     * @param {Object} [options] Options object
     * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {String} [options.binaryType=nodebuffer] The type for binary data
     * @param {Object} [options.extensions] An object containing the negotiated
     *     extensions
     * @param {Boolean} [options.isServer=false] Specifies whether to operate in
     *     client or server mode
     * @param {Number} [options.maxPayload=0] The maximum allowed message length
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     */
    constructor(options = {}) {
      super();
      this._allowSynchronousEvents = options.allowSynchronousEvents !== void 0 ? options.allowSynchronousEvents : true;
      this._binaryType = options.binaryType || BINARY_TYPES[0];
      this._extensions = options.extensions || {};
      this._isServer = !!options.isServer;
      this._maxPayload = options.maxPayload | 0;
      this._skipUTF8Validation = !!options.skipUTF8Validation;
      this[kWebSocket] = void 0;
      this._bufferedBytes = 0;
      this._buffers = [];
      this._compressed = false;
      this._payloadLength = 0;
      this._mask = void 0;
      this._fragmented = 0;
      this._masked = false;
      this._fin = false;
      this._opcode = 0;
      this._totalPayloadLength = 0;
      this._messageLength = 0;
      this._fragments = [];
      this._errored = false;
      this._loop = false;
      this._state = GET_INFO;
    }
    /**
     * Implements `Writable.prototype._write()`.
     *
     * @param {Buffer} chunk The chunk of data to write
     * @param {String} encoding The character encoding of `chunk`
     * @param {Function} cb Callback
     * @private
     */
    _write(chunk, encoding, cb) {
      if (this._opcode === 8 && this._state == GET_INFO) return cb();
      this._bufferedBytes += chunk.length;
      this._buffers.push(chunk);
      this.startLoop(cb);
    }
    /**
     * Consumes `n` bytes from the buffered data.
     *
     * @param {Number} n The number of bytes to consume
     * @return {Buffer} The consumed bytes
     * @private
     */
    consume(n) {
      this._bufferedBytes -= n;
      if (n === this._buffers[0].length) return this._buffers.shift();
      if (n < this._buffers[0].length) {
        const buf = this._buffers[0];
        this._buffers[0] = new FastBuffer(
          buf.buffer,
          buf.byteOffset + n,
          buf.length - n
        );
        return new FastBuffer(buf.buffer, buf.byteOffset, n);
      }
      const dst = Buffer.allocUnsafe(n);
      do {
        const buf = this._buffers[0];
        const offset = dst.length - n;
        if (n >= buf.length) {
          dst.set(this._buffers.shift(), offset);
        } else {
          dst.set(new Uint8Array(buf.buffer, buf.byteOffset, n), offset);
          this._buffers[0] = new FastBuffer(
            buf.buffer,
            buf.byteOffset + n,
            buf.length - n
          );
        }
        n -= buf.length;
      } while (n > 0);
      return dst;
    }
    /**
     * Starts the parsing loop.
     *
     * @param {Function} cb Callback
     * @private
     */
    startLoop(cb) {
      this._loop = true;
      do {
        switch (this._state) {
          case GET_INFO:
            this.getInfo(cb);
            break;
          case GET_PAYLOAD_LENGTH_16:
            this.getPayloadLength16(cb);
            break;
          case GET_PAYLOAD_LENGTH_64:
            this.getPayloadLength64(cb);
            break;
          case GET_MASK:
            this.getMask();
            break;
          case GET_DATA:
            this.getData(cb);
            break;
          case INFLATING:
          case DEFER_EVENT:
            this._loop = false;
            return;
        }
      } while (this._loop);
      if (!this._errored) cb();
    }
    /**
     * Reads the first two bytes of a frame.
     *
     * @param {Function} cb Callback
     * @private
     */
    getInfo(cb) {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }
      const buf = this.consume(2);
      if ((buf[0] & 48) !== 0) {
        const error2 = this.createError(
          RangeError,
          "RSV2 and RSV3 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_2_3"
        );
        cb(error2);
        return;
      }
      const compressed = (buf[0] & 64) === 64;
      if (compressed && !this._extensions[PerMessageDeflate.extensionName]) {
        const error2 = this.createError(
          RangeError,
          "RSV1 must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_RSV_1"
        );
        cb(error2);
        return;
      }
      this._fin = (buf[0] & 128) === 128;
      this._opcode = buf[0] & 15;
      this._payloadLength = buf[1] & 127;
      if (this._opcode === 0) {
        if (compressed) {
          const error2 = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error2);
          return;
        }
        if (!this._fragmented) {
          const error2 = this.createError(
            RangeError,
            "invalid opcode 0",
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error2);
          return;
        }
        this._opcode = this._fragmented;
      } else if (this._opcode === 1 || this._opcode === 2) {
        if (this._fragmented) {
          const error2 = this.createError(
            RangeError,
            `invalid opcode ${this._opcode}`,
            true,
            1002,
            "WS_ERR_INVALID_OPCODE"
          );
          cb(error2);
          return;
        }
        this._compressed = compressed;
      } else if (this._opcode > 7 && this._opcode < 11) {
        if (!this._fin) {
          const error2 = this.createError(
            RangeError,
            "FIN must be set",
            true,
            1002,
            "WS_ERR_EXPECTED_FIN"
          );
          cb(error2);
          return;
        }
        if (compressed) {
          const error2 = this.createError(
            RangeError,
            "RSV1 must be clear",
            true,
            1002,
            "WS_ERR_UNEXPECTED_RSV_1"
          );
          cb(error2);
          return;
        }
        if (this._payloadLength > 125 || this._opcode === 8 && this._payloadLength === 1) {
          const error2 = this.createError(
            RangeError,
            `invalid payload length ${this._payloadLength}`,
            true,
            1002,
            "WS_ERR_INVALID_CONTROL_PAYLOAD_LENGTH"
          );
          cb(error2);
          return;
        }
      } else {
        const error2 = this.createError(
          RangeError,
          `invalid opcode ${this._opcode}`,
          true,
          1002,
          "WS_ERR_INVALID_OPCODE"
        );
        cb(error2);
        return;
      }
      if (!this._fin && !this._fragmented) this._fragmented = this._opcode;
      this._masked = (buf[1] & 128) === 128;
      if (this._isServer) {
        if (!this._masked) {
          const error2 = this.createError(
            RangeError,
            "MASK must be set",
            true,
            1002,
            "WS_ERR_EXPECTED_MASK"
          );
          cb(error2);
          return;
        }
      } else if (this._masked) {
        const error2 = this.createError(
          RangeError,
          "MASK must be clear",
          true,
          1002,
          "WS_ERR_UNEXPECTED_MASK"
        );
        cb(error2);
        return;
      }
      if (this._payloadLength === 126) this._state = GET_PAYLOAD_LENGTH_16;
      else if (this._payloadLength === 127) this._state = GET_PAYLOAD_LENGTH_64;
      else this.haveLength(cb);
    }
    /**
     * Gets extended payload length (7+16).
     *
     * @param {Function} cb Callback
     * @private
     */
    getPayloadLength16(cb) {
      if (this._bufferedBytes < 2) {
        this._loop = false;
        return;
      }
      this._payloadLength = this.consume(2).readUInt16BE(0);
      this.haveLength(cb);
    }
    /**
     * Gets extended payload length (7+64).
     *
     * @param {Function} cb Callback
     * @private
     */
    getPayloadLength64(cb) {
      if (this._bufferedBytes < 8) {
        this._loop = false;
        return;
      }
      const buf = this.consume(8);
      const num = buf.readUInt32BE(0);
      if (num > Math.pow(2, 53 - 32) - 1) {
        const error2 = this.createError(
          RangeError,
          "Unsupported WebSocket frame: payload length > 2^53 - 1",
          false,
          1009,
          "WS_ERR_UNSUPPORTED_DATA_PAYLOAD_LENGTH"
        );
        cb(error2);
        return;
      }
      this._payloadLength = num * Math.pow(2, 32) + buf.readUInt32BE(4);
      this.haveLength(cb);
    }
    /**
     * Payload length has been read.
     *
     * @param {Function} cb Callback
     * @private
     */
    haveLength(cb) {
      if (this._payloadLength && this._opcode < 8) {
        this._totalPayloadLength += this._payloadLength;
        if (this._totalPayloadLength > this._maxPayload && this._maxPayload > 0) {
          const error2 = this.createError(
            RangeError,
            "Max payload size exceeded",
            false,
            1009,
            "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
          );
          cb(error2);
          return;
        }
      }
      if (this._masked) this._state = GET_MASK;
      else this._state = GET_DATA;
    }
    /**
     * Reads mask bytes.
     *
     * @private
     */
    getMask() {
      if (this._bufferedBytes < 4) {
        this._loop = false;
        return;
      }
      this._mask = this.consume(4);
      this._state = GET_DATA;
    }
    /**
     * Reads data bytes.
     *
     * @param {Function} cb Callback
     * @private
     */
    getData(cb) {
      let data = EMPTY_BUFFER;
      if (this._payloadLength) {
        if (this._bufferedBytes < this._payloadLength) {
          this._loop = false;
          return;
        }
        data = this.consume(this._payloadLength);
        if (this._masked && (this._mask[0] | this._mask[1] | this._mask[2] | this._mask[3]) !== 0) {
          unmask(data, this._mask);
        }
      }
      if (this._opcode > 7) {
        this.controlMessage(data, cb);
        return;
      }
      if (this._compressed) {
        this._state = INFLATING;
        this.decompress(data, cb);
        return;
      }
      if (data.length) {
        this._messageLength = this._totalPayloadLength;
        this._fragments.push(data);
      }
      this.dataMessage(cb);
    }
    /**
     * Decompresses data.
     *
     * @param {Buffer} data Compressed data
     * @param {Function} cb Callback
     * @private
     */
    decompress(data, cb) {
      const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
      perMessageDeflate.decompress(data, this._fin, (err, buf) => {
        if (err) return cb(err);
        if (buf.length) {
          this._messageLength += buf.length;
          if (this._messageLength > this._maxPayload && this._maxPayload > 0) {
            const error2 = this.createError(
              RangeError,
              "Max payload size exceeded",
              false,
              1009,
              "WS_ERR_UNSUPPORTED_MESSAGE_LENGTH"
            );
            cb(error2);
            return;
          }
          this._fragments.push(buf);
        }
        this.dataMessage(cb);
        if (this._state === GET_INFO) this.startLoop(cb);
      });
    }
    /**
     * Handles a data message.
     *
     * @param {Function} cb Callback
     * @private
     */
    dataMessage(cb) {
      if (!this._fin) {
        this._state = GET_INFO;
        return;
      }
      const messageLength = this._messageLength;
      const fragments = this._fragments;
      this._totalPayloadLength = 0;
      this._messageLength = 0;
      this._fragmented = 0;
      this._fragments = [];
      if (this._opcode === 2) {
        let data;
        if (this._binaryType === "nodebuffer") {
          data = concat(fragments, messageLength);
        } else if (this._binaryType === "arraybuffer") {
          data = toArrayBuffer(concat(fragments, messageLength));
        } else if (this._binaryType === "blob") {
          data = new Blob(fragments);
        } else {
          data = fragments;
        }
        if (this._allowSynchronousEvents) {
          this.emit("message", data, true);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit("message", data, true);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      } else {
        const buf = concat(fragments, messageLength);
        if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
          const error2 = this.createError(
            Error,
            "invalid UTF-8 sequence",
            true,
            1007,
            "WS_ERR_INVALID_UTF8"
          );
          cb(error2);
          return;
        }
        if (this._state === INFLATING || this._allowSynchronousEvents) {
          this.emit("message", buf, false);
          this._state = GET_INFO;
        } else {
          this._state = DEFER_EVENT;
          setImmediate(() => {
            this.emit("message", buf, false);
            this._state = GET_INFO;
            this.startLoop(cb);
          });
        }
      }
    }
    /**
     * Handles a control message.
     *
     * @param {Buffer} data Data to handle
     * @return {(Error|RangeError|undefined)} A possible error
     * @private
     */
    controlMessage(data, cb) {
      if (this._opcode === 8) {
        if (data.length === 0) {
          this._loop = false;
          this.emit("conclude", 1005, EMPTY_BUFFER);
          this.end();
        } else {
          const code = data.readUInt16BE(0);
          if (!isValidStatusCode(code)) {
            const error2 = this.createError(
              RangeError,
              `invalid status code ${code}`,
              true,
              1002,
              "WS_ERR_INVALID_CLOSE_CODE"
            );
            cb(error2);
            return;
          }
          const buf = new FastBuffer(
            data.buffer,
            data.byteOffset + 2,
            data.length - 2
          );
          if (!this._skipUTF8Validation && !isValidUTF8(buf)) {
            const error2 = this.createError(
              Error,
              "invalid UTF-8 sequence",
              true,
              1007,
              "WS_ERR_INVALID_UTF8"
            );
            cb(error2);
            return;
          }
          this._loop = false;
          this.emit("conclude", code, buf);
          this.end();
        }
        this._state = GET_INFO;
        return;
      }
      if (this._allowSynchronousEvents) {
        this.emit(this._opcode === 9 ? "ping" : "pong", data);
        this._state = GET_INFO;
      } else {
        this._state = DEFER_EVENT;
        setImmediate(() => {
          this.emit(this._opcode === 9 ? "ping" : "pong", data);
          this._state = GET_INFO;
          this.startLoop(cb);
        });
      }
    }
    /**
     * Builds an error object.
     *
     * @param {function(new:Error|RangeError)} ErrorCtor The error constructor
     * @param {String} message The error message
     * @param {Boolean} prefix Specifies whether or not to add a default prefix to
     *     `message`
     * @param {Number} statusCode The status code
     * @param {String} errorCode The exposed error code
     * @return {(Error|RangeError)} The error
     * @private
     */
    createError(ErrorCtor, message, prefix, statusCode, errorCode) {
      this._loop = false;
      this._errored = true;
      const err = new ErrorCtor(
        prefix ? `Invalid WebSocket frame: ${message}` : message
      );
      Error.captureStackTrace(err, this.createError);
      err.code = errorCode;
      err[kStatusCode] = statusCode;
      return err;
    }
  }
  receiver = Receiver;
  return receiver;
}
var sender;
var hasRequiredSender;
function requireSender() {
  if (hasRequiredSender) return sender;
  hasRequiredSender = 1;
  const { Duplex } = require$$0$4;
  const { randomFillSync } = require$$1$3;
  const PerMessageDeflate = requirePermessageDeflate();
  const { EMPTY_BUFFER, kWebSocket, NOOP } = requireConstants();
  const { isBlob, isValidStatusCode } = requireValidation();
  const { mask: applyMask, toBuffer } = requireBufferUtil();
  const kByteLength = Symbol("kByteLength");
  const maskBuffer = Buffer.alloc(4);
  const RANDOM_POOL_SIZE = 8 * 1024;
  let randomPool;
  let randomPoolPointer = RANDOM_POOL_SIZE;
  const DEFAULT = 0;
  const DEFLATING = 1;
  const GET_BLOB_DATA = 2;
  class Sender {
    /**
     * Creates a Sender instance.
     *
     * @param {Duplex} socket The connection socket
     * @param {Object} [extensions] An object containing the negotiated extensions
     * @param {Function} [generateMask] The function used to generate the masking
     *     key
     */
    constructor(socket, extensions, generateMask) {
      this._extensions = extensions || {};
      if (generateMask) {
        this._generateMask = generateMask;
        this._maskBuffer = Buffer.alloc(4);
      }
      this._socket = socket;
      this._firstFragment = true;
      this._compress = false;
      this._bufferedBytes = 0;
      this._queue = [];
      this._state = DEFAULT;
      this.onerror = NOOP;
      this[kWebSocket] = void 0;
    }
    /**
     * Frames a piece of data according to the HyBi WebSocket protocol.
     *
     * @param {(Buffer|String)} data The data to frame
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @return {(Buffer|String)[]} The framed data
     * @public
     */
    static frame(data, options) {
      let mask;
      let merge = false;
      let offset = 2;
      let skipMasking = false;
      if (options.mask) {
        mask = options.maskBuffer || maskBuffer;
        if (options.generateMask) {
          options.generateMask(mask);
        } else {
          if (randomPoolPointer === RANDOM_POOL_SIZE) {
            if (randomPool === void 0) {
              randomPool = Buffer.alloc(RANDOM_POOL_SIZE);
            }
            randomFillSync(randomPool, 0, RANDOM_POOL_SIZE);
            randomPoolPointer = 0;
          }
          mask[0] = randomPool[randomPoolPointer++];
          mask[1] = randomPool[randomPoolPointer++];
          mask[2] = randomPool[randomPoolPointer++];
          mask[3] = randomPool[randomPoolPointer++];
        }
        skipMasking = (mask[0] | mask[1] | mask[2] | mask[3]) === 0;
        offset = 6;
      }
      let dataLength;
      if (typeof data === "string") {
        if ((!options.mask || skipMasking) && options[kByteLength] !== void 0) {
          dataLength = options[kByteLength];
        } else {
          data = Buffer.from(data);
          dataLength = data.length;
        }
      } else {
        dataLength = data.length;
        merge = options.mask && options.readOnly && !skipMasking;
      }
      let payloadLength = dataLength;
      if (dataLength >= 65536) {
        offset += 8;
        payloadLength = 127;
      } else if (dataLength > 125) {
        offset += 2;
        payloadLength = 126;
      }
      const target = Buffer.allocUnsafe(merge ? dataLength + offset : offset);
      target[0] = options.fin ? options.opcode | 128 : options.opcode;
      if (options.rsv1) target[0] |= 64;
      target[1] = payloadLength;
      if (payloadLength === 126) {
        target.writeUInt16BE(dataLength, 2);
      } else if (payloadLength === 127) {
        target[2] = target[3] = 0;
        target.writeUIntBE(dataLength, 4, 6);
      }
      if (!options.mask) return [target, data];
      target[1] |= 128;
      target[offset - 4] = mask[0];
      target[offset - 3] = mask[1];
      target[offset - 2] = mask[2];
      target[offset - 1] = mask[3];
      if (skipMasking) return [target, data];
      if (merge) {
        applyMask(data, mask, target, offset, dataLength);
        return [target];
      }
      applyMask(data, mask, data, 0, dataLength);
      return [target, data];
    }
    /**
     * Sends a close message to the other peer.
     *
     * @param {Number} [code] The status code component of the body
     * @param {(String|Buffer)} [data] The message component of the body
     * @param {Boolean} [mask=false] Specifies whether or not to mask the message
     * @param {Function} [cb] Callback
     * @public
     */
    close(code, data, mask, cb) {
      let buf;
      if (code === void 0) {
        buf = EMPTY_BUFFER;
      } else if (typeof code !== "number" || !isValidStatusCode(code)) {
        throw new TypeError("First argument must be a valid error code number");
      } else if (data === void 0 || !data.length) {
        buf = Buffer.allocUnsafe(2);
        buf.writeUInt16BE(code, 0);
      } else {
        const length = Buffer.byteLength(data);
        if (length > 123) {
          throw new RangeError("The message must not be greater than 123 bytes");
        }
        buf = Buffer.allocUnsafe(2 + length);
        buf.writeUInt16BE(code, 0);
        if (typeof data === "string") {
          buf.write(data, 2);
        } else {
          buf.set(data, 2);
        }
      }
      const options = {
        [kByteLength]: buf.length,
        fin: true,
        generateMask: this._generateMask,
        mask,
        maskBuffer: this._maskBuffer,
        opcode: 8,
        readOnly: false,
        rsv1: false
      };
      if (this._state !== DEFAULT) {
        this.enqueue([this.dispatch, buf, false, options, cb]);
      } else {
        this.sendFrame(Sender.frame(buf, options), cb);
      }
    }
    /**
     * Sends a ping message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback
     * @public
     */
    ping(data, mask, cb) {
      let byteLength;
      let readOnly;
      if (typeof data === "string") {
        byteLength = Buffer.byteLength(data);
        readOnly = false;
      } else if (isBlob(data)) {
        byteLength = data.size;
        readOnly = false;
      } else {
        data = toBuffer(data);
        byteLength = data.length;
        readOnly = toBuffer.readOnly;
      }
      if (byteLength > 125) {
        throw new RangeError("The data size must not be greater than 125 bytes");
      }
      const options = {
        [kByteLength]: byteLength,
        fin: true,
        generateMask: this._generateMask,
        mask,
        maskBuffer: this._maskBuffer,
        opcode: 9,
        readOnly,
        rsv1: false
      };
      if (isBlob(data)) {
        if (this._state !== DEFAULT) {
          this.enqueue([this.getBlobData, data, false, options, cb]);
        } else {
          this.getBlobData(data, false, options, cb);
        }
      } else if (this._state !== DEFAULT) {
        this.enqueue([this.dispatch, data, false, options, cb]);
      } else {
        this.sendFrame(Sender.frame(data, options), cb);
      }
    }
    /**
     * Sends a pong message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Boolean} [mask=false] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback
     * @public
     */
    pong(data, mask, cb) {
      let byteLength;
      let readOnly;
      if (typeof data === "string") {
        byteLength = Buffer.byteLength(data);
        readOnly = false;
      } else if (isBlob(data)) {
        byteLength = data.size;
        readOnly = false;
      } else {
        data = toBuffer(data);
        byteLength = data.length;
        readOnly = toBuffer.readOnly;
      }
      if (byteLength > 125) {
        throw new RangeError("The data size must not be greater than 125 bytes");
      }
      const options = {
        [kByteLength]: byteLength,
        fin: true,
        generateMask: this._generateMask,
        mask,
        maskBuffer: this._maskBuffer,
        opcode: 10,
        readOnly,
        rsv1: false
      };
      if (isBlob(data)) {
        if (this._state !== DEFAULT) {
          this.enqueue([this.getBlobData, data, false, options, cb]);
        } else {
          this.getBlobData(data, false, options, cb);
        }
      } else if (this._state !== DEFAULT) {
        this.enqueue([this.dispatch, data, false, options, cb]);
      } else {
        this.sendFrame(Sender.frame(data, options), cb);
      }
    }
    /**
     * Sends a data message to the other peer.
     *
     * @param {*} data The message to send
     * @param {Object} options Options object
     * @param {Boolean} [options.binary=false] Specifies whether `data` is binary
     *     or text
     * @param {Boolean} [options.compress=false] Specifies whether or not to
     *     compress `data`
     * @param {Boolean} [options.fin=false] Specifies whether the fragment is the
     *     last one
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Function} [cb] Callback
     * @public
     */
    send(data, options, cb) {
      const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
      let opcode = options.binary ? 2 : 1;
      let rsv1 = options.compress;
      let byteLength;
      let readOnly;
      if (typeof data === "string") {
        byteLength = Buffer.byteLength(data);
        readOnly = false;
      } else if (isBlob(data)) {
        byteLength = data.size;
        readOnly = false;
      } else {
        data = toBuffer(data);
        byteLength = data.length;
        readOnly = toBuffer.readOnly;
      }
      if (this._firstFragment) {
        this._firstFragment = false;
        if (rsv1 && perMessageDeflate && perMessageDeflate.params[perMessageDeflate._isServer ? "server_no_context_takeover" : "client_no_context_takeover"]) {
          rsv1 = byteLength >= perMessageDeflate._threshold;
        }
        this._compress = rsv1;
      } else {
        rsv1 = false;
        opcode = 0;
      }
      if (options.fin) this._firstFragment = true;
      const opts = {
        [kByteLength]: byteLength,
        fin: options.fin,
        generateMask: this._generateMask,
        mask: options.mask,
        maskBuffer: this._maskBuffer,
        opcode,
        readOnly,
        rsv1
      };
      if (isBlob(data)) {
        if (this._state !== DEFAULT) {
          this.enqueue([this.getBlobData, data, this._compress, opts, cb]);
        } else {
          this.getBlobData(data, this._compress, opts, cb);
        }
      } else if (this._state !== DEFAULT) {
        this.enqueue([this.dispatch, data, this._compress, opts, cb]);
      } else {
        this.dispatch(data, this._compress, opts, cb);
      }
    }
    /**
     * Gets the contents of a blob as binary data.
     *
     * @param {Blob} blob The blob
     * @param {Boolean} [compress=false] Specifies whether or not to compress
     *     the data
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @param {Function} [cb] Callback
     * @private
     */
    getBlobData(blob, compress, options, cb) {
      this._bufferedBytes += options[kByteLength];
      this._state = GET_BLOB_DATA;
      blob.arrayBuffer().then((arrayBuffer) => {
        if (this._socket.destroyed) {
          const err = new Error(
            "The socket was closed while the blob was being read"
          );
          process.nextTick(callCallbacks, this, err, cb);
          return;
        }
        this._bufferedBytes -= options[kByteLength];
        const data = toBuffer(arrayBuffer);
        if (!compress) {
          this._state = DEFAULT;
          this.sendFrame(Sender.frame(data, options), cb);
          this.dequeue();
        } else {
          this.dispatch(data, compress, options, cb);
        }
      }).catch((err) => {
        process.nextTick(onError, this, err, cb);
      });
    }
    /**
     * Dispatches a message.
     *
     * @param {(Buffer|String)} data The message to send
     * @param {Boolean} [compress=false] Specifies whether or not to compress
     *     `data`
     * @param {Object} options Options object
     * @param {Boolean} [options.fin=false] Specifies whether or not to set the
     *     FIN bit
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Boolean} [options.mask=false] Specifies whether or not to mask
     *     `data`
     * @param {Buffer} [options.maskBuffer] The buffer used to store the masking
     *     key
     * @param {Number} options.opcode The opcode
     * @param {Boolean} [options.readOnly=false] Specifies whether `data` can be
     *     modified
     * @param {Boolean} [options.rsv1=false] Specifies whether or not to set the
     *     RSV1 bit
     * @param {Function} [cb] Callback
     * @private
     */
    dispatch(data, compress, options, cb) {
      if (!compress) {
        this.sendFrame(Sender.frame(data, options), cb);
        return;
      }
      const perMessageDeflate = this._extensions[PerMessageDeflate.extensionName];
      this._bufferedBytes += options[kByteLength];
      this._state = DEFLATING;
      perMessageDeflate.compress(data, options.fin, (_, buf) => {
        if (this._socket.destroyed) {
          const err = new Error(
            "The socket was closed while data was being compressed"
          );
          callCallbacks(this, err, cb);
          return;
        }
        this._bufferedBytes -= options[kByteLength];
        this._state = DEFAULT;
        options.readOnly = false;
        this.sendFrame(Sender.frame(buf, options), cb);
        this.dequeue();
      });
    }
    /**
     * Executes queued send operations.
     *
     * @private
     */
    dequeue() {
      while (this._state === DEFAULT && this._queue.length) {
        const params = this._queue.shift();
        this._bufferedBytes -= params[3][kByteLength];
        Reflect.apply(params[0], this, params.slice(1));
      }
    }
    /**
     * Enqueues a send operation.
     *
     * @param {Array} params Send operation parameters.
     * @private
     */
    enqueue(params) {
      this._bufferedBytes += params[3][kByteLength];
      this._queue.push(params);
    }
    /**
     * Sends a frame.
     *
     * @param {(Buffer | String)[]} list The frame to send
     * @param {Function} [cb] Callback
     * @private
     */
    sendFrame(list, cb) {
      if (list.length === 2) {
        this._socket.cork();
        this._socket.write(list[0]);
        this._socket.write(list[1], cb);
        this._socket.uncork();
      } else {
        this._socket.write(list[0], cb);
      }
    }
  }
  sender = Sender;
  function callCallbacks(sender2, err, cb) {
    if (typeof cb === "function") cb(err);
    for (let i = 0; i < sender2._queue.length; i++) {
      const params = sender2._queue[i];
      const callback = params[params.length - 1];
      if (typeof callback === "function") callback(err);
    }
  }
  function onError(sender2, err, cb) {
    callCallbacks(sender2, err, cb);
    sender2.onerror(err);
  }
  return sender;
}
var eventTarget;
var hasRequiredEventTarget;
function requireEventTarget() {
  if (hasRequiredEventTarget) return eventTarget;
  hasRequiredEventTarget = 1;
  const { kForOnEventAttribute, kListener } = requireConstants();
  const kCode = Symbol("kCode");
  const kData = Symbol("kData");
  const kError = Symbol("kError");
  const kMessage = Symbol("kMessage");
  const kReason = Symbol("kReason");
  const kTarget = Symbol("kTarget");
  const kType = Symbol("kType");
  const kWasClean = Symbol("kWasClean");
  class Event {
    /**
     * Create a new `Event`.
     *
     * @param {String} type The name of the event
     * @throws {TypeError} If the `type` argument is not specified
     */
    constructor(type) {
      this[kTarget] = null;
      this[kType] = type;
    }
    /**
     * @type {*}
     */
    get target() {
      return this[kTarget];
    }
    /**
     * @type {String}
     */
    get type() {
      return this[kType];
    }
  }
  Object.defineProperty(Event.prototype, "target", { enumerable: true });
  Object.defineProperty(Event.prototype, "type", { enumerable: true });
  class CloseEvent extends Event {
    /**
     * Create a new `CloseEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {Number} [options.code=0] The status code explaining why the
     *     connection was closed
     * @param {String} [options.reason=''] A human-readable string explaining why
     *     the connection was closed
     * @param {Boolean} [options.wasClean=false] Indicates whether or not the
     *     connection was cleanly closed
     */
    constructor(type, options = {}) {
      super(type);
      this[kCode] = options.code === void 0 ? 0 : options.code;
      this[kReason] = options.reason === void 0 ? "" : options.reason;
      this[kWasClean] = options.wasClean === void 0 ? false : options.wasClean;
    }
    /**
     * @type {Number}
     */
    get code() {
      return this[kCode];
    }
    /**
     * @type {String}
     */
    get reason() {
      return this[kReason];
    }
    /**
     * @type {Boolean}
     */
    get wasClean() {
      return this[kWasClean];
    }
  }
  Object.defineProperty(CloseEvent.prototype, "code", { enumerable: true });
  Object.defineProperty(CloseEvent.prototype, "reason", { enumerable: true });
  Object.defineProperty(CloseEvent.prototype, "wasClean", { enumerable: true });
  class ErrorEvent extends Event {
    /**
     * Create a new `ErrorEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {*} [options.error=null] The error that generated this event
     * @param {String} [options.message=''] The error message
     */
    constructor(type, options = {}) {
      super(type);
      this[kError] = options.error === void 0 ? null : options.error;
      this[kMessage] = options.message === void 0 ? "" : options.message;
    }
    /**
     * @type {*}
     */
    get error() {
      return this[kError];
    }
    /**
     * @type {String}
     */
    get message() {
      return this[kMessage];
    }
  }
  Object.defineProperty(ErrorEvent.prototype, "error", { enumerable: true });
  Object.defineProperty(ErrorEvent.prototype, "message", { enumerable: true });
  class MessageEvent extends Event {
    /**
     * Create a new `MessageEvent`.
     *
     * @param {String} type The name of the event
     * @param {Object} [options] A dictionary object that allows for setting
     *     attributes via object members of the same name
     * @param {*} [options.data=null] The message content
     */
    constructor(type, options = {}) {
      super(type);
      this[kData] = options.data === void 0 ? null : options.data;
    }
    /**
     * @type {*}
     */
    get data() {
      return this[kData];
    }
  }
  Object.defineProperty(MessageEvent.prototype, "data", { enumerable: true });
  const EventTarget = {
    /**
     * Register an event listener.
     *
     * @param {String} type A string representing the event type to listen for
     * @param {(Function|Object)} handler The listener to add
     * @param {Object} [options] An options object specifies characteristics about
     *     the event listener
     * @param {Boolean} [options.once=false] A `Boolean` indicating that the
     *     listener should be invoked at most once after being added. If `true`,
     *     the listener would be automatically removed when invoked.
     * @public
     */
    addEventListener(type, handler, options = {}) {
      for (const listener of this.listeners(type)) {
        if (!options[kForOnEventAttribute] && listener[kListener] === handler && !listener[kForOnEventAttribute]) {
          return;
        }
      }
      let wrapper;
      if (type === "message") {
        wrapper = function onMessage(data, isBinary) {
          const event = new MessageEvent("message", {
            data: isBinary ? data : data.toString()
          });
          event[kTarget] = this;
          callListener(handler, this, event);
        };
      } else if (type === "close") {
        wrapper = function onClose(code, message) {
          const event = new CloseEvent("close", {
            code,
            reason: message.toString(),
            wasClean: this._closeFrameReceived && this._closeFrameSent
          });
          event[kTarget] = this;
          callListener(handler, this, event);
        };
      } else if (type === "error") {
        wrapper = function onError(error2) {
          const event = new ErrorEvent("error", {
            error: error2,
            message: error2.message
          });
          event[kTarget] = this;
          callListener(handler, this, event);
        };
      } else if (type === "open") {
        wrapper = function onOpen() {
          const event = new Event("open");
          event[kTarget] = this;
          callListener(handler, this, event);
        };
      } else {
        return;
      }
      wrapper[kForOnEventAttribute] = !!options[kForOnEventAttribute];
      wrapper[kListener] = handler;
      if (options.once) {
        this.once(type, wrapper);
      } else {
        this.on(type, wrapper);
      }
    },
    /**
     * Remove an event listener.
     *
     * @param {String} type A string representing the event type to remove
     * @param {(Function|Object)} handler The listener to remove
     * @public
     */
    removeEventListener(type, handler) {
      for (const listener of this.listeners(type)) {
        if (listener[kListener] === handler && !listener[kForOnEventAttribute]) {
          this.removeListener(type, listener);
          break;
        }
      }
    }
  };
  eventTarget = {
    CloseEvent,
    ErrorEvent,
    Event,
    EventTarget,
    MessageEvent
  };
  function callListener(listener, thisArg, event) {
    if (typeof listener === "object" && listener.handleEvent) {
      listener.handleEvent.call(listener, event);
    } else {
      listener.call(thisArg, event);
    }
  }
  return eventTarget;
}
var extension;
var hasRequiredExtension;
function requireExtension() {
  if (hasRequiredExtension) return extension;
  hasRequiredExtension = 1;
  const { tokenChars } = requireValidation();
  function push(dest, name, elem) {
    if (dest[name] === void 0) dest[name] = [elem];
    else dest[name].push(elem);
  }
  function parse(header) {
    const offers = /* @__PURE__ */ Object.create(null);
    let params = /* @__PURE__ */ Object.create(null);
    let mustUnescape = false;
    let isEscaping = false;
    let inQuotes = false;
    let extensionName;
    let paramName;
    let start = -1;
    let code = -1;
    let end = -1;
    let i = 0;
    for (; i < header.length; i++) {
      code = header.charCodeAt(i);
      if (extensionName === void 0) {
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (i !== 0 && (code === 32 || code === 9)) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 59 || code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          const name = header.slice(start, end);
          if (code === 44) {
            push(offers, name, params);
            params = /* @__PURE__ */ Object.create(null);
          } else {
            extensionName = name;
          }
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else if (paramName === void 0) {
        if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (code === 32 || code === 9) {
          if (end === -1 && start !== -1) end = i;
        } else if (code === 59 || code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          push(params, header.slice(start, end), true);
          if (code === 44) {
            push(offers, extensionName, params);
            params = /* @__PURE__ */ Object.create(null);
            extensionName = void 0;
          }
          start = end = -1;
        } else if (code === 61 && start !== -1 && end === -1) {
          paramName = header.slice(start, i);
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      } else {
        if (isEscaping) {
          if (tokenChars[code] !== 1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (start === -1) start = i;
          else if (!mustUnescape) mustUnescape = true;
          isEscaping = false;
        } else if (inQuotes) {
          if (tokenChars[code] === 1) {
            if (start === -1) start = i;
          } else if (code === 34 && start !== -1) {
            inQuotes = false;
            end = i;
          } else if (code === 92) {
            isEscaping = true;
          } else {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
        } else if (code === 34 && header.charCodeAt(i - 1) === 61) {
          inQuotes = true;
        } else if (end === -1 && tokenChars[code] === 1) {
          if (start === -1) start = i;
        } else if (start !== -1 && (code === 32 || code === 9)) {
          if (end === -1) end = i;
        } else if (code === 59 || code === 44) {
          if (start === -1) {
            throw new SyntaxError(`Unexpected character at index ${i}`);
          }
          if (end === -1) end = i;
          let value = header.slice(start, end);
          if (mustUnescape) {
            value = value.replace(/\\/g, "");
            mustUnescape = false;
          }
          push(params, paramName, value);
          if (code === 44) {
            push(offers, extensionName, params);
            params = /* @__PURE__ */ Object.create(null);
            extensionName = void 0;
          }
          paramName = void 0;
          start = end = -1;
        } else {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
      }
    }
    if (start === -1 || inQuotes || code === 32 || code === 9) {
      throw new SyntaxError("Unexpected end of input");
    }
    if (end === -1) end = i;
    const token = header.slice(start, end);
    if (extensionName === void 0) {
      push(offers, token, params);
    } else {
      if (paramName === void 0) {
        push(params, token, true);
      } else if (mustUnescape) {
        push(params, paramName, token.replace(/\\/g, ""));
      } else {
        push(params, paramName, token);
      }
      push(offers, extensionName, params);
    }
    return offers;
  }
  function format(extensions) {
    return Object.keys(extensions).map((extension2) => {
      let configurations = extensions[extension2];
      if (!Array.isArray(configurations)) configurations = [configurations];
      return configurations.map((params) => {
        return [extension2].concat(
          Object.keys(params).map((k) => {
            let values = params[k];
            if (!Array.isArray(values)) values = [values];
            return values.map((v) => v === true ? k : `${k}=${v}`).join("; ");
          })
        ).join("; ");
      }).join(", ");
    }).join(", ");
  }
  extension = { format, parse };
  return extension;
}
var websocket;
var hasRequiredWebsocket;
function requireWebsocket() {
  if (hasRequiredWebsocket) return websocket;
  hasRequiredWebsocket = 1;
  const EventEmitter = require$$0$5;
  const https = require$$1$4;
  const http = require$$2;
  const net = require$$3;
  const tls = require$$4;
  const { randomBytes, createHash } = require$$1$3;
  const { Duplex, Readable } = require$$0$4;
  const { URL: URL2 } = require$$7;
  const PerMessageDeflate = requirePermessageDeflate();
  const Receiver = requireReceiver();
  const Sender = requireSender();
  const { isBlob } = requireValidation();
  const {
    BINARY_TYPES,
    CLOSE_TIMEOUT,
    EMPTY_BUFFER,
    GUID,
    kForOnEventAttribute,
    kListener,
    kStatusCode,
    kWebSocket,
    NOOP
  } = requireConstants();
  const {
    EventTarget: { addEventListener, removeEventListener }
  } = requireEventTarget();
  const { format, parse } = requireExtension();
  const { toBuffer } = requireBufferUtil();
  const kAborted = Symbol("kAborted");
  const protocolVersions = [8, 13];
  const readyStates = ["CONNECTING", "OPEN", "CLOSING", "CLOSED"];
  const subprotocolRegex = /^[!#$%&'*+\-.0-9A-Z^_`|a-z~]+$/;
  class WebSocket extends EventEmitter {
    /**
     * Create a new `WebSocket`.
     *
     * @param {(String|URL)} address The URL to which to connect
     * @param {(String|String[])} [protocols] The subprotocols
     * @param {Object} [options] Connection options
     */
    constructor(address, protocols, options) {
      super();
      this._binaryType = BINARY_TYPES[0];
      this._closeCode = 1006;
      this._closeFrameReceived = false;
      this._closeFrameSent = false;
      this._closeMessage = EMPTY_BUFFER;
      this._closeTimer = null;
      this._errorEmitted = false;
      this._extensions = {};
      this._paused = false;
      this._protocol = "";
      this._readyState = WebSocket.CONNECTING;
      this._receiver = null;
      this._sender = null;
      this._socket = null;
      if (address !== null) {
        this._bufferedAmount = 0;
        this._isServer = false;
        this._redirects = 0;
        if (protocols === void 0) {
          protocols = [];
        } else if (!Array.isArray(protocols)) {
          if (typeof protocols === "object" && protocols !== null) {
            options = protocols;
            protocols = [];
          } else {
            protocols = [protocols];
          }
        }
        initAsClient(this, address, protocols, options);
      } else {
        this._autoPong = options.autoPong;
        this._closeTimeout = options.closeTimeout;
        this._isServer = true;
      }
    }
    /**
     * For historical reasons, the custom "nodebuffer" type is used by the default
     * instead of "blob".
     *
     * @type {String}
     */
    get binaryType() {
      return this._binaryType;
    }
    set binaryType(type) {
      if (!BINARY_TYPES.includes(type)) return;
      this._binaryType = type;
      if (this._receiver) this._receiver._binaryType = type;
    }
    /**
     * @type {Number}
     */
    get bufferedAmount() {
      if (!this._socket) return this._bufferedAmount;
      return this._socket._writableState.length + this._sender._bufferedBytes;
    }
    /**
     * @type {String}
     */
    get extensions() {
      return Object.keys(this._extensions).join();
    }
    /**
     * @type {Boolean}
     */
    get isPaused() {
      return this._paused;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onclose() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onerror() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onopen() {
      return null;
    }
    /**
     * @type {Function}
     */
    /* istanbul ignore next */
    get onmessage() {
      return null;
    }
    /**
     * @type {String}
     */
    get protocol() {
      return this._protocol;
    }
    /**
     * @type {Number}
     */
    get readyState() {
      return this._readyState;
    }
    /**
     * @type {String}
     */
    get url() {
      return this._url;
    }
    /**
     * Set up the socket and the internal resources.
     *
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Object} options Options object
     * @param {Boolean} [options.allowSynchronousEvents=false] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {Function} [options.generateMask] The function used to generate the
     *     masking key
     * @param {Number} [options.maxPayload=0] The maximum allowed message size
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     * @private
     */
    setSocket(socket, head, options) {
      const receiver2 = new Receiver({
        allowSynchronousEvents: options.allowSynchronousEvents,
        binaryType: this.binaryType,
        extensions: this._extensions,
        isServer: this._isServer,
        maxPayload: options.maxPayload,
        skipUTF8Validation: options.skipUTF8Validation
      });
      const sender2 = new Sender(socket, this._extensions, options.generateMask);
      this._receiver = receiver2;
      this._sender = sender2;
      this._socket = socket;
      receiver2[kWebSocket] = this;
      sender2[kWebSocket] = this;
      socket[kWebSocket] = this;
      receiver2.on("conclude", receiverOnConclude);
      receiver2.on("drain", receiverOnDrain);
      receiver2.on("error", receiverOnError);
      receiver2.on("message", receiverOnMessage);
      receiver2.on("ping", receiverOnPing);
      receiver2.on("pong", receiverOnPong);
      sender2.onerror = senderOnError;
      if (socket.setTimeout) socket.setTimeout(0);
      if (socket.setNoDelay) socket.setNoDelay();
      if (head.length > 0) socket.unshift(head);
      socket.on("close", socketOnClose);
      socket.on("data", socketOnData);
      socket.on("end", socketOnEnd);
      socket.on("error", socketOnError);
      this._readyState = WebSocket.OPEN;
      this.emit("open");
    }
    /**
     * Emit the `'close'` event.
     *
     * @private
     */
    emitClose() {
      if (!this._socket) {
        this._readyState = WebSocket.CLOSED;
        this.emit("close", this._closeCode, this._closeMessage);
        return;
      }
      if (this._extensions[PerMessageDeflate.extensionName]) {
        this._extensions[PerMessageDeflate.extensionName].cleanup();
      }
      this._receiver.removeAllListeners();
      this._readyState = WebSocket.CLOSED;
      this.emit("close", this._closeCode, this._closeMessage);
    }
    /**
     * Start a closing handshake.
     *
     *          +----------+   +-----------+   +----------+
     *     - - -|ws.close()|-->|close frame|-->|ws.close()|- - -
     *    |     +----------+   +-----------+   +----------+     |
     *          +----------+   +-----------+         |
     * CLOSING  |ws.close()|<--|close frame|<--+-----+       CLOSING
     *          +----------+   +-----------+   |
     *    |           |                        |   +---+        |
     *                +------------------------+-->|fin| - - - -
     *    |         +---+                      |   +---+
     *     - - - - -|fin|<---------------------+
     *              +---+
     *
     * @param {Number} [code] Status code explaining why the connection is closing
     * @param {(String|Buffer)} [data] The reason why the connection is
     *     closing
     * @public
     */
    close(code, data) {
      if (this.readyState === WebSocket.CLOSED) return;
      if (this.readyState === WebSocket.CONNECTING) {
        const msg = "WebSocket was closed before the connection was established";
        abortHandshake(this, this._req, msg);
        return;
      }
      if (this.readyState === WebSocket.CLOSING) {
        if (this._closeFrameSent && (this._closeFrameReceived || this._receiver._writableState.errorEmitted)) {
          this._socket.end();
        }
        return;
      }
      this._readyState = WebSocket.CLOSING;
      this._sender.close(code, data, !this._isServer, (err) => {
        if (err) return;
        this._closeFrameSent = true;
        if (this._closeFrameReceived || this._receiver._writableState.errorEmitted) {
          this._socket.end();
        }
      });
      setCloseTimer(this);
    }
    /**
     * Pause the socket.
     *
     * @public
     */
    pause() {
      if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) {
        return;
      }
      this._paused = true;
      this._socket.pause();
    }
    /**
     * Send a ping.
     *
     * @param {*} [data] The data to send
     * @param {Boolean} [mask] Indicates whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when the ping is sent
     * @public
     */
    ping(data, mask, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      }
      if (typeof data === "function") {
        cb = data;
        data = mask = void 0;
      } else if (typeof mask === "function") {
        cb = mask;
        mask = void 0;
      }
      if (typeof data === "number") data = data.toString();
      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }
      if (mask === void 0) mask = !this._isServer;
      this._sender.ping(data || EMPTY_BUFFER, mask, cb);
    }
    /**
     * Send a pong.
     *
     * @param {*} [data] The data to send
     * @param {Boolean} [mask] Indicates whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when the pong is sent
     * @public
     */
    pong(data, mask, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      }
      if (typeof data === "function") {
        cb = data;
        data = mask = void 0;
      } else if (typeof mask === "function") {
        cb = mask;
        mask = void 0;
      }
      if (typeof data === "number") data = data.toString();
      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }
      if (mask === void 0) mask = !this._isServer;
      this._sender.pong(data || EMPTY_BUFFER, mask, cb);
    }
    /**
     * Resume the socket.
     *
     * @public
     */
    resume() {
      if (this.readyState === WebSocket.CONNECTING || this.readyState === WebSocket.CLOSED) {
        return;
      }
      this._paused = false;
      if (!this._receiver._writableState.needDrain) this._socket.resume();
    }
    /**
     * Send a data message.
     *
     * @param {*} data The message to send
     * @param {Object} [options] Options object
     * @param {Boolean} [options.binary] Specifies whether `data` is binary or
     *     text
     * @param {Boolean} [options.compress] Specifies whether or not to compress
     *     `data`
     * @param {Boolean} [options.fin=true] Specifies whether the fragment is the
     *     last one
     * @param {Boolean} [options.mask] Specifies whether or not to mask `data`
     * @param {Function} [cb] Callback which is executed when data is written out
     * @public
     */
    send(data, options, cb) {
      if (this.readyState === WebSocket.CONNECTING) {
        throw new Error("WebSocket is not open: readyState 0 (CONNECTING)");
      }
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (typeof data === "number") data = data.toString();
      if (this.readyState !== WebSocket.OPEN) {
        sendAfterClose(this, data, cb);
        return;
      }
      const opts = {
        binary: typeof data !== "string",
        mask: !this._isServer,
        compress: true,
        fin: true,
        ...options
      };
      if (!this._extensions[PerMessageDeflate.extensionName]) {
        opts.compress = false;
      }
      this._sender.send(data || EMPTY_BUFFER, opts, cb);
    }
    /**
     * Forcibly close the connection.
     *
     * @public
     */
    terminate() {
      if (this.readyState === WebSocket.CLOSED) return;
      if (this.readyState === WebSocket.CONNECTING) {
        const msg = "WebSocket was closed before the connection was established";
        abortHandshake(this, this._req, msg);
        return;
      }
      if (this._socket) {
        this._readyState = WebSocket.CLOSING;
        this._socket.destroy();
      }
    }
  }
  Object.defineProperty(WebSocket, "CONNECTING", {
    enumerable: true,
    value: readyStates.indexOf("CONNECTING")
  });
  Object.defineProperty(WebSocket.prototype, "CONNECTING", {
    enumerable: true,
    value: readyStates.indexOf("CONNECTING")
  });
  Object.defineProperty(WebSocket, "OPEN", {
    enumerable: true,
    value: readyStates.indexOf("OPEN")
  });
  Object.defineProperty(WebSocket.prototype, "OPEN", {
    enumerable: true,
    value: readyStates.indexOf("OPEN")
  });
  Object.defineProperty(WebSocket, "CLOSING", {
    enumerable: true,
    value: readyStates.indexOf("CLOSING")
  });
  Object.defineProperty(WebSocket.prototype, "CLOSING", {
    enumerable: true,
    value: readyStates.indexOf("CLOSING")
  });
  Object.defineProperty(WebSocket, "CLOSED", {
    enumerable: true,
    value: readyStates.indexOf("CLOSED")
  });
  Object.defineProperty(WebSocket.prototype, "CLOSED", {
    enumerable: true,
    value: readyStates.indexOf("CLOSED")
  });
  [
    "binaryType",
    "bufferedAmount",
    "extensions",
    "isPaused",
    "protocol",
    "readyState",
    "url"
  ].forEach((property) => {
    Object.defineProperty(WebSocket.prototype, property, { enumerable: true });
  });
  ["open", "error", "close", "message"].forEach((method) => {
    Object.defineProperty(WebSocket.prototype, `on${method}`, {
      enumerable: true,
      get() {
        for (const listener of this.listeners(method)) {
          if (listener[kForOnEventAttribute]) return listener[kListener];
        }
        return null;
      },
      set(handler) {
        for (const listener of this.listeners(method)) {
          if (listener[kForOnEventAttribute]) {
            this.removeListener(method, listener);
            break;
          }
        }
        if (typeof handler !== "function") return;
        this.addEventListener(method, handler, {
          [kForOnEventAttribute]: true
        });
      }
    });
  });
  WebSocket.prototype.addEventListener = addEventListener;
  WebSocket.prototype.removeEventListener = removeEventListener;
  websocket = WebSocket;
  function initAsClient(websocket2, address, protocols, options) {
    const opts = {
      allowSynchronousEvents: true,
      autoPong: true,
      closeTimeout: CLOSE_TIMEOUT,
      protocolVersion: protocolVersions[1],
      maxPayload: 100 * 1024 * 1024,
      skipUTF8Validation: false,
      perMessageDeflate: true,
      followRedirects: false,
      maxRedirects: 10,
      ...options,
      socketPath: void 0,
      hostname: void 0,
      protocol: void 0,
      timeout: void 0,
      method: "GET",
      host: void 0,
      path: void 0,
      port: void 0
    };
    websocket2._autoPong = opts.autoPong;
    websocket2._closeTimeout = opts.closeTimeout;
    if (!protocolVersions.includes(opts.protocolVersion)) {
      throw new RangeError(
        `Unsupported protocol version: ${opts.protocolVersion} (supported versions: ${protocolVersions.join(", ")})`
      );
    }
    let parsedUrl;
    if (address instanceof URL2) {
      parsedUrl = address;
    } else {
      try {
        parsedUrl = new URL2(address);
      } catch (e) {
        throw new SyntaxError(`Invalid URL: ${address}`);
      }
    }
    if (parsedUrl.protocol === "http:") {
      parsedUrl.protocol = "ws:";
    } else if (parsedUrl.protocol === "https:") {
      parsedUrl.protocol = "wss:";
    }
    websocket2._url = parsedUrl.href;
    const isSecure = parsedUrl.protocol === "wss:";
    const isIpcUrl = parsedUrl.protocol === "ws+unix:";
    let invalidUrlMessage;
    if (parsedUrl.protocol !== "ws:" && !isSecure && !isIpcUrl) {
      invalidUrlMessage = `The URL's protocol must be one of "ws:", "wss:", "http:", "https:", or "ws+unix:"`;
    } else if (isIpcUrl && !parsedUrl.pathname) {
      invalidUrlMessage = "The URL's pathname is empty";
    } else if (parsedUrl.hash) {
      invalidUrlMessage = "The URL contains a fragment identifier";
    }
    if (invalidUrlMessage) {
      const err = new SyntaxError(invalidUrlMessage);
      if (websocket2._redirects === 0) {
        throw err;
      } else {
        emitErrorAndClose(websocket2, err);
        return;
      }
    }
    const defaultPort = isSecure ? 443 : 80;
    const key = randomBytes(16).toString("base64");
    const request = isSecure ? https.request : http.request;
    const protocolSet = /* @__PURE__ */ new Set();
    let perMessageDeflate;
    opts.createConnection = opts.createConnection || (isSecure ? tlsConnect : netConnect);
    opts.defaultPort = opts.defaultPort || defaultPort;
    opts.port = parsedUrl.port || defaultPort;
    opts.host = parsedUrl.hostname.startsWith("[") ? parsedUrl.hostname.slice(1, -1) : parsedUrl.hostname;
    opts.headers = {
      ...opts.headers,
      "Sec-WebSocket-Version": opts.protocolVersion,
      "Sec-WebSocket-Key": key,
      Connection: "Upgrade",
      Upgrade: "websocket"
    };
    opts.path = parsedUrl.pathname + parsedUrl.search;
    opts.timeout = opts.handshakeTimeout;
    if (opts.perMessageDeflate) {
      perMessageDeflate = new PerMessageDeflate(
        opts.perMessageDeflate !== true ? opts.perMessageDeflate : {},
        false,
        opts.maxPayload
      );
      opts.headers["Sec-WebSocket-Extensions"] = format({
        [PerMessageDeflate.extensionName]: perMessageDeflate.offer()
      });
    }
    if (protocols.length) {
      for (const protocol of protocols) {
        if (typeof protocol !== "string" || !subprotocolRegex.test(protocol) || protocolSet.has(protocol)) {
          throw new SyntaxError(
            "An invalid or duplicated subprotocol was specified"
          );
        }
        protocolSet.add(protocol);
      }
      opts.headers["Sec-WebSocket-Protocol"] = protocols.join(",");
    }
    if (opts.origin) {
      if (opts.protocolVersion < 13) {
        opts.headers["Sec-WebSocket-Origin"] = opts.origin;
      } else {
        opts.headers.Origin = opts.origin;
      }
    }
    if (parsedUrl.username || parsedUrl.password) {
      opts.auth = `${parsedUrl.username}:${parsedUrl.password}`;
    }
    if (isIpcUrl) {
      const parts = opts.path.split(":");
      opts.socketPath = parts[0];
      opts.path = parts[1];
    }
    let req;
    if (opts.followRedirects) {
      if (websocket2._redirects === 0) {
        websocket2._originalIpc = isIpcUrl;
        websocket2._originalSecure = isSecure;
        websocket2._originalHostOrSocketPath = isIpcUrl ? opts.socketPath : parsedUrl.host;
        const headers = options && options.headers;
        options = { ...options, headers: {} };
        if (headers) {
          for (const [key2, value] of Object.entries(headers)) {
            options.headers[key2.toLowerCase()] = value;
          }
        }
      } else if (websocket2.listenerCount("redirect") === 0) {
        const isSameHost = isIpcUrl ? websocket2._originalIpc ? opts.socketPath === websocket2._originalHostOrSocketPath : false : websocket2._originalIpc ? false : parsedUrl.host === websocket2._originalHostOrSocketPath;
        if (!isSameHost || websocket2._originalSecure && !isSecure) {
          delete opts.headers.authorization;
          delete opts.headers.cookie;
          if (!isSameHost) delete opts.headers.host;
          opts.auth = void 0;
        }
      }
      if (opts.auth && !options.headers.authorization) {
        options.headers.authorization = "Basic " + Buffer.from(opts.auth).toString("base64");
      }
      req = websocket2._req = request(opts);
      if (websocket2._redirects) {
        websocket2.emit("redirect", websocket2.url, req);
      }
    } else {
      req = websocket2._req = request(opts);
    }
    if (opts.timeout) {
      req.on("timeout", () => {
        abortHandshake(websocket2, req, "Opening handshake has timed out");
      });
    }
    req.on("error", (err) => {
      if (req === null || req[kAborted]) return;
      req = websocket2._req = null;
      emitErrorAndClose(websocket2, err);
    });
    req.on("response", (res) => {
      const location = res.headers.location;
      const statusCode = res.statusCode;
      if (location && opts.followRedirects && statusCode >= 300 && statusCode < 400) {
        if (++websocket2._redirects > opts.maxRedirects) {
          abortHandshake(websocket2, req, "Maximum redirects exceeded");
          return;
        }
        req.abort();
        let addr;
        try {
          addr = new URL2(location, address);
        } catch (e) {
          const err = new SyntaxError(`Invalid URL: ${location}`);
          emitErrorAndClose(websocket2, err);
          return;
        }
        initAsClient(websocket2, addr, protocols, options);
      } else if (!websocket2.emit("unexpected-response", req, res)) {
        abortHandshake(
          websocket2,
          req,
          `Unexpected server response: ${res.statusCode}`
        );
      }
    });
    req.on("upgrade", (res, socket, head) => {
      websocket2.emit("upgrade", res);
      if (websocket2.readyState !== WebSocket.CONNECTING) return;
      req = websocket2._req = null;
      const upgrade = res.headers.upgrade;
      if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
        abortHandshake(websocket2, socket, "Invalid Upgrade header");
        return;
      }
      const digest = createHash("sha1").update(key + GUID).digest("base64");
      if (res.headers["sec-websocket-accept"] !== digest) {
        abortHandshake(websocket2, socket, "Invalid Sec-WebSocket-Accept header");
        return;
      }
      const serverProt = res.headers["sec-websocket-protocol"];
      let protError;
      if (serverProt !== void 0) {
        if (!protocolSet.size) {
          protError = "Server sent a subprotocol but none was requested";
        } else if (!protocolSet.has(serverProt)) {
          protError = "Server sent an invalid subprotocol";
        }
      } else if (protocolSet.size) {
        protError = "Server sent no subprotocol";
      }
      if (protError) {
        abortHandshake(websocket2, socket, protError);
        return;
      }
      if (serverProt) websocket2._protocol = serverProt;
      const secWebSocketExtensions = res.headers["sec-websocket-extensions"];
      if (secWebSocketExtensions !== void 0) {
        if (!perMessageDeflate) {
          const message = "Server sent a Sec-WebSocket-Extensions header but no extension was requested";
          abortHandshake(websocket2, socket, message);
          return;
        }
        let extensions;
        try {
          extensions = parse(secWebSocketExtensions);
        } catch (err) {
          const message = "Invalid Sec-WebSocket-Extensions header";
          abortHandshake(websocket2, socket, message);
          return;
        }
        const extensionNames = Object.keys(extensions);
        if (extensionNames.length !== 1 || extensionNames[0] !== PerMessageDeflate.extensionName) {
          const message = "Server indicated an extension that was not requested";
          abortHandshake(websocket2, socket, message);
          return;
        }
        try {
          perMessageDeflate.accept(extensions[PerMessageDeflate.extensionName]);
        } catch (err) {
          const message = "Invalid Sec-WebSocket-Extensions header";
          abortHandshake(websocket2, socket, message);
          return;
        }
        websocket2._extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
      }
      websocket2.setSocket(socket, head, {
        allowSynchronousEvents: opts.allowSynchronousEvents,
        generateMask: opts.generateMask,
        maxPayload: opts.maxPayload,
        skipUTF8Validation: opts.skipUTF8Validation
      });
    });
    if (opts.finishRequest) {
      opts.finishRequest(req, websocket2);
    } else {
      req.end();
    }
  }
  function emitErrorAndClose(websocket2, err) {
    websocket2._readyState = WebSocket.CLOSING;
    websocket2._errorEmitted = true;
    websocket2.emit("error", err);
    websocket2.emitClose();
  }
  function netConnect(options) {
    options.path = options.socketPath;
    return net.connect(options);
  }
  function tlsConnect(options) {
    options.path = void 0;
    if (!options.servername && options.servername !== "") {
      options.servername = net.isIP(options.host) ? "" : options.host;
    }
    return tls.connect(options);
  }
  function abortHandshake(websocket2, stream2, message) {
    websocket2._readyState = WebSocket.CLOSING;
    const err = new Error(message);
    Error.captureStackTrace(err, abortHandshake);
    if (stream2.setHeader) {
      stream2[kAborted] = true;
      stream2.abort();
      if (stream2.socket && !stream2.socket.destroyed) {
        stream2.socket.destroy();
      }
      process.nextTick(emitErrorAndClose, websocket2, err);
    } else {
      stream2.destroy(err);
      stream2.once("error", websocket2.emit.bind(websocket2, "error"));
      stream2.once("close", websocket2.emitClose.bind(websocket2));
    }
  }
  function sendAfterClose(websocket2, data, cb) {
    if (data) {
      const length = isBlob(data) ? data.size : toBuffer(data).length;
      if (websocket2._socket) websocket2._sender._bufferedBytes += length;
      else websocket2._bufferedAmount += length;
    }
    if (cb) {
      const err = new Error(
        `WebSocket is not open: readyState ${websocket2.readyState} (${readyStates[websocket2.readyState]})`
      );
      process.nextTick(cb, err);
    }
  }
  function receiverOnConclude(code, reason) {
    const websocket2 = this[kWebSocket];
    websocket2._closeFrameReceived = true;
    websocket2._closeMessage = reason;
    websocket2._closeCode = code;
    if (websocket2._socket[kWebSocket] === void 0) return;
    websocket2._socket.removeListener("data", socketOnData);
    process.nextTick(resume, websocket2._socket);
    if (code === 1005) websocket2.close();
    else websocket2.close(code, reason);
  }
  function receiverOnDrain() {
    const websocket2 = this[kWebSocket];
    if (!websocket2.isPaused) websocket2._socket.resume();
  }
  function receiverOnError(err) {
    const websocket2 = this[kWebSocket];
    if (websocket2._socket[kWebSocket] !== void 0) {
      websocket2._socket.removeListener("data", socketOnData);
      process.nextTick(resume, websocket2._socket);
      websocket2.close(err[kStatusCode]);
    }
    if (!websocket2._errorEmitted) {
      websocket2._errorEmitted = true;
      websocket2.emit("error", err);
    }
  }
  function receiverOnFinish() {
    this[kWebSocket].emitClose();
  }
  function receiverOnMessage(data, isBinary) {
    this[kWebSocket].emit("message", data, isBinary);
  }
  function receiverOnPing(data) {
    const websocket2 = this[kWebSocket];
    if (websocket2._autoPong) websocket2.pong(data, !this._isServer, NOOP);
    websocket2.emit("ping", data);
  }
  function receiverOnPong(data) {
    this[kWebSocket].emit("pong", data);
  }
  function resume(stream2) {
    stream2.resume();
  }
  function senderOnError(err) {
    const websocket2 = this[kWebSocket];
    if (websocket2.readyState === WebSocket.CLOSED) return;
    if (websocket2.readyState === WebSocket.OPEN) {
      websocket2._readyState = WebSocket.CLOSING;
      setCloseTimer(websocket2);
    }
    this._socket.end();
    if (!websocket2._errorEmitted) {
      websocket2._errorEmitted = true;
      websocket2.emit("error", err);
    }
  }
  function setCloseTimer(websocket2) {
    websocket2._closeTimer = setTimeout(
      websocket2._socket.destroy.bind(websocket2._socket),
      websocket2._closeTimeout
    );
  }
  function socketOnClose() {
    const websocket2 = this[kWebSocket];
    this.removeListener("close", socketOnClose);
    this.removeListener("data", socketOnData);
    this.removeListener("end", socketOnEnd);
    websocket2._readyState = WebSocket.CLOSING;
    if (!this._readableState.endEmitted && !websocket2._closeFrameReceived && !websocket2._receiver._writableState.errorEmitted && this._readableState.length !== 0) {
      const chunk = this.read(this._readableState.length);
      websocket2._receiver.write(chunk);
    }
    websocket2._receiver.end();
    this[kWebSocket] = void 0;
    clearTimeout(websocket2._closeTimer);
    if (websocket2._receiver._writableState.finished || websocket2._receiver._writableState.errorEmitted) {
      websocket2.emitClose();
    } else {
      websocket2._receiver.on("error", receiverOnFinish);
      websocket2._receiver.on("finish", receiverOnFinish);
    }
  }
  function socketOnData(chunk) {
    if (!this[kWebSocket]._receiver.write(chunk)) {
      this.pause();
    }
  }
  function socketOnEnd() {
    const websocket2 = this[kWebSocket];
    websocket2._readyState = WebSocket.CLOSING;
    websocket2._receiver.end();
    this.end();
  }
  function socketOnError() {
    const websocket2 = this[kWebSocket];
    this.removeListener("error", socketOnError);
    this.on("error", NOOP);
    if (websocket2) {
      websocket2._readyState = WebSocket.CLOSING;
      this.destroy();
    }
  }
  return websocket;
}
var stream;
var hasRequiredStream;
function requireStream() {
  if (hasRequiredStream) return stream;
  hasRequiredStream = 1;
  requireWebsocket();
  const { Duplex } = require$$0$4;
  function emitClose(stream2) {
    stream2.emit("close");
  }
  function duplexOnEnd() {
    if (!this.destroyed && this._writableState.finished) {
      this.destroy();
    }
  }
  function duplexOnError(err) {
    this.removeListener("error", duplexOnError);
    this.destroy();
    if (this.listenerCount("error") === 0) {
      this.emit("error", err);
    }
  }
  function createWebSocketStream(ws2, options) {
    let terminateOnDestroy = true;
    const duplex = new Duplex({
      ...options,
      autoDestroy: false,
      emitClose: false,
      objectMode: false,
      writableObjectMode: false
    });
    ws2.on("message", function message(msg, isBinary) {
      const data = !isBinary && duplex._readableState.objectMode ? msg.toString() : msg;
      if (!duplex.push(data)) ws2.pause();
    });
    ws2.once("error", function error2(err) {
      if (duplex.destroyed) return;
      terminateOnDestroy = false;
      duplex.destroy(err);
    });
    ws2.once("close", function close() {
      if (duplex.destroyed) return;
      duplex.push(null);
    });
    duplex._destroy = function(err, callback) {
      if (ws2.readyState === ws2.CLOSED) {
        callback(err);
        process.nextTick(emitClose, duplex);
        return;
      }
      let called = false;
      ws2.once("error", function error2(err2) {
        called = true;
        callback(err2);
      });
      ws2.once("close", function close() {
        if (!called) callback(err);
        process.nextTick(emitClose, duplex);
      });
      if (terminateOnDestroy) ws2.terminate();
    };
    duplex._final = function(callback) {
      if (ws2.readyState === ws2.CONNECTING) {
        ws2.once("open", function open() {
          duplex._final(callback);
        });
        return;
      }
      if (ws2._socket === null) return;
      if (ws2._socket._writableState.finished) {
        callback();
        if (duplex._readableState.endEmitted) duplex.destroy();
      } else {
        ws2._socket.once("finish", function finish() {
          callback();
        });
        ws2.close();
      }
    };
    duplex._read = function() {
      if (ws2.isPaused) ws2.resume();
    };
    duplex._write = function(chunk, encoding, callback) {
      if (ws2.readyState === ws2.CONNECTING) {
        ws2.once("open", function open() {
          duplex._write(chunk, encoding, callback);
        });
        return;
      }
      ws2.send(chunk, callback);
    };
    duplex.on("end", duplexOnEnd);
    duplex.on("error", duplexOnError);
    return duplex;
  }
  stream = createWebSocketStream;
  return stream;
}
var subprotocol;
var hasRequiredSubprotocol;
function requireSubprotocol() {
  if (hasRequiredSubprotocol) return subprotocol;
  hasRequiredSubprotocol = 1;
  const { tokenChars } = requireValidation();
  function parse(header) {
    const protocols = /* @__PURE__ */ new Set();
    let start = -1;
    let end = -1;
    let i = 0;
    for (i; i < header.length; i++) {
      const code = header.charCodeAt(i);
      if (end === -1 && tokenChars[code] === 1) {
        if (start === -1) start = i;
      } else if (i !== 0 && (code === 32 || code === 9)) {
        if (end === -1 && start !== -1) end = i;
      } else if (code === 44) {
        if (start === -1) {
          throw new SyntaxError(`Unexpected character at index ${i}`);
        }
        if (end === -1) end = i;
        const protocol2 = header.slice(start, end);
        if (protocols.has(protocol2)) {
          throw new SyntaxError(`The "${protocol2}" subprotocol is duplicated`);
        }
        protocols.add(protocol2);
        start = end = -1;
      } else {
        throw new SyntaxError(`Unexpected character at index ${i}`);
      }
    }
    if (start === -1 || end !== -1) {
      throw new SyntaxError("Unexpected end of input");
    }
    const protocol = header.slice(start, i);
    if (protocols.has(protocol)) {
      throw new SyntaxError(`The "${protocol}" subprotocol is duplicated`);
    }
    protocols.add(protocol);
    return protocols;
  }
  subprotocol = { parse };
  return subprotocol;
}
var websocketServer;
var hasRequiredWebsocketServer;
function requireWebsocketServer() {
  if (hasRequiredWebsocketServer) return websocketServer;
  hasRequiredWebsocketServer = 1;
  const EventEmitter = require$$0$5;
  const http = require$$2;
  const { Duplex } = require$$0$4;
  const { createHash } = require$$1$3;
  const extension2 = requireExtension();
  const PerMessageDeflate = requirePermessageDeflate();
  const subprotocol2 = requireSubprotocol();
  const WebSocket = requireWebsocket();
  const { CLOSE_TIMEOUT, GUID, kWebSocket } = requireConstants();
  const keyRegex = /^[+/0-9A-Za-z]{22}==$/;
  const RUNNING = 0;
  const CLOSING = 1;
  const CLOSED = 2;
  class WebSocketServer extends EventEmitter {
    /**
     * Create a `WebSocketServer` instance.
     *
     * @param {Object} options Configuration options
     * @param {Boolean} [options.allowSynchronousEvents=true] Specifies whether
     *     any of the `'message'`, `'ping'`, and `'pong'` events can be emitted
     *     multiple times in the same tick
     * @param {Boolean} [options.autoPong=true] Specifies whether or not to
     *     automatically send a pong in response to a ping
     * @param {Number} [options.backlog=511] The maximum length of the queue of
     *     pending connections
     * @param {Boolean} [options.clientTracking=true] Specifies whether or not to
     *     track clients
     * @param {Number} [options.closeTimeout=30000] Duration in milliseconds to
     *     wait for the closing handshake to finish after `websocket.close()` is
     *     called
     * @param {Function} [options.handleProtocols] A hook to handle protocols
     * @param {String} [options.host] The hostname where to bind the server
     * @param {Number} [options.maxPayload=104857600] The maximum allowed message
     *     size
     * @param {Boolean} [options.noServer=false] Enable no server mode
     * @param {String} [options.path] Accept only connections matching this path
     * @param {(Boolean|Object)} [options.perMessageDeflate=false] Enable/disable
     *     permessage-deflate
     * @param {Number} [options.port] The port where to bind the server
     * @param {(http.Server|https.Server)} [options.server] A pre-created HTTP/S
     *     server to use
     * @param {Boolean} [options.skipUTF8Validation=false] Specifies whether or
     *     not to skip UTF-8 validation for text and close messages
     * @param {Function} [options.verifyClient] A hook to reject connections
     * @param {Function} [options.WebSocket=WebSocket] Specifies the `WebSocket`
     *     class to use. It must be the `WebSocket` class or class that extends it
     * @param {Function} [callback] A listener for the `listening` event
     */
    constructor(options, callback) {
      super();
      options = {
        allowSynchronousEvents: true,
        autoPong: true,
        maxPayload: 100 * 1024 * 1024,
        skipUTF8Validation: false,
        perMessageDeflate: false,
        handleProtocols: null,
        clientTracking: true,
        closeTimeout: CLOSE_TIMEOUT,
        verifyClient: null,
        noServer: false,
        backlog: null,
        // use default (511 as implemented in net.js)
        server: null,
        host: null,
        path: null,
        port: null,
        WebSocket,
        ...options
      };
      if (options.port == null && !options.server && !options.noServer || options.port != null && (options.server || options.noServer) || options.server && options.noServer) {
        throw new TypeError(
          'One and only one of the "port", "server", or "noServer" options must be specified'
        );
      }
      if (options.port != null) {
        this._server = http.createServer((req, res) => {
          const body = http.STATUS_CODES[426];
          res.writeHead(426, {
            "Content-Length": body.length,
            "Content-Type": "text/plain"
          });
          res.end(body);
        });
        this._server.listen(
          options.port,
          options.host,
          options.backlog,
          callback
        );
      } else if (options.server) {
        this._server = options.server;
      }
      if (this._server) {
        const emitConnection = this.emit.bind(this, "connection");
        this._removeListeners = addListeners(this._server, {
          listening: this.emit.bind(this, "listening"),
          error: this.emit.bind(this, "error"),
          upgrade: (req, socket, head) => {
            this.handleUpgrade(req, socket, head, emitConnection);
          }
        });
      }
      if (options.perMessageDeflate === true) options.perMessageDeflate = {};
      if (options.clientTracking) {
        this.clients = /* @__PURE__ */ new Set();
        this._shouldEmitClose = false;
      }
      this.options = options;
      this._state = RUNNING;
    }
    /**
     * Returns the bound address, the address family name, and port of the server
     * as reported by the operating system if listening on an IP socket.
     * If the server is listening on a pipe or UNIX domain socket, the name is
     * returned as a string.
     *
     * @return {(Object|String|null)} The address of the server
     * @public
     */
    address() {
      if (this.options.noServer) {
        throw new Error('The server is operating in "noServer" mode');
      }
      if (!this._server) return null;
      return this._server.address();
    }
    /**
     * Stop the server from accepting new connections and emit the `'close'` event
     * when all existing connections are closed.
     *
     * @param {Function} [cb] A one-time listener for the `'close'` event
     * @public
     */
    close(cb) {
      if (this._state === CLOSED) {
        if (cb) {
          this.once("close", () => {
            cb(new Error("The server is not running"));
          });
        }
        process.nextTick(emitClose, this);
        return;
      }
      if (cb) this.once("close", cb);
      if (this._state === CLOSING) return;
      this._state = CLOSING;
      if (this.options.noServer || this.options.server) {
        if (this._server) {
          this._removeListeners();
          this._removeListeners = this._server = null;
        }
        if (this.clients) {
          if (!this.clients.size) {
            process.nextTick(emitClose, this);
          } else {
            this._shouldEmitClose = true;
          }
        } else {
          process.nextTick(emitClose, this);
        }
      } else {
        const server = this._server;
        this._removeListeners();
        this._removeListeners = this._server = null;
        server.close(() => {
          emitClose(this);
        });
      }
    }
    /**
     * See if a given request should be handled by this server instance.
     *
     * @param {http.IncomingMessage} req Request object to inspect
     * @return {Boolean} `true` if the request is valid, else `false`
     * @public
     */
    shouldHandle(req) {
      if (this.options.path) {
        const index = req.url.indexOf("?");
        const pathname = index !== -1 ? req.url.slice(0, index) : req.url;
        if (pathname !== this.options.path) return false;
      }
      return true;
    }
    /**
     * Handle a HTTP Upgrade request.
     *
     * @param {http.IncomingMessage} req The request object
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @public
     */
    handleUpgrade(req, socket, head, cb) {
      socket.on("error", socketOnError);
      const key = req.headers["sec-websocket-key"];
      const upgrade = req.headers.upgrade;
      const version = +req.headers["sec-websocket-version"];
      if (req.method !== "GET") {
        const message = "Invalid HTTP method";
        abortHandshakeOrEmitwsClientError(this, req, socket, 405, message);
        return;
      }
      if (upgrade === void 0 || upgrade.toLowerCase() !== "websocket") {
        const message = "Invalid Upgrade header";
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
        return;
      }
      if (key === void 0 || !keyRegex.test(key)) {
        const message = "Missing or invalid Sec-WebSocket-Key header";
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
        return;
      }
      if (version !== 13 && version !== 8) {
        const message = "Missing or invalid Sec-WebSocket-Version header";
        abortHandshakeOrEmitwsClientError(this, req, socket, 400, message, {
          "Sec-WebSocket-Version": "13, 8"
        });
        return;
      }
      if (!this.shouldHandle(req)) {
        abortHandshake(socket, 400);
        return;
      }
      const secWebSocketProtocol = req.headers["sec-websocket-protocol"];
      let protocols = /* @__PURE__ */ new Set();
      if (secWebSocketProtocol !== void 0) {
        try {
          protocols = subprotocol2.parse(secWebSocketProtocol);
        } catch (err) {
          const message = "Invalid Sec-WebSocket-Protocol header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
      }
      const secWebSocketExtensions = req.headers["sec-websocket-extensions"];
      const extensions = {};
      if (this.options.perMessageDeflate && secWebSocketExtensions !== void 0) {
        const perMessageDeflate = new PerMessageDeflate(
          this.options.perMessageDeflate,
          true,
          this.options.maxPayload
        );
        try {
          const offers = extension2.parse(secWebSocketExtensions);
          if (offers[PerMessageDeflate.extensionName]) {
            perMessageDeflate.accept(offers[PerMessageDeflate.extensionName]);
            extensions[PerMessageDeflate.extensionName] = perMessageDeflate;
          }
        } catch (err) {
          const message = "Invalid or unacceptable Sec-WebSocket-Extensions header";
          abortHandshakeOrEmitwsClientError(this, req, socket, 400, message);
          return;
        }
      }
      if (this.options.verifyClient) {
        const info = {
          origin: req.headers[`${version === 8 ? "sec-websocket-origin" : "origin"}`],
          secure: !!(req.socket.authorized || req.socket.encrypted),
          req
        };
        if (this.options.verifyClient.length === 2) {
          this.options.verifyClient(info, (verified, code, message, headers) => {
            if (!verified) {
              return abortHandshake(socket, code || 401, message, headers);
            }
            this.completeUpgrade(
              extensions,
              key,
              protocols,
              req,
              socket,
              head,
              cb
            );
          });
          return;
        }
        if (!this.options.verifyClient(info)) return abortHandshake(socket, 401);
      }
      this.completeUpgrade(extensions, key, protocols, req, socket, head, cb);
    }
    /**
     * Upgrade the connection to WebSocket.
     *
     * @param {Object} extensions The accepted extensions
     * @param {String} key The value of the `Sec-WebSocket-Key` header
     * @param {Set} protocols The subprotocols
     * @param {http.IncomingMessage} req The request object
     * @param {Duplex} socket The network socket between the server and client
     * @param {Buffer} head The first packet of the upgraded stream
     * @param {Function} cb Callback
     * @throws {Error} If called more than once with the same socket
     * @private
     */
    completeUpgrade(extensions, key, protocols, req, socket, head, cb) {
      if (!socket.readable || !socket.writable) return socket.destroy();
      if (socket[kWebSocket]) {
        throw new Error(
          "server.handleUpgrade() was called more than once with the same socket, possibly due to a misconfiguration"
        );
      }
      if (this._state > RUNNING) return abortHandshake(socket, 503);
      const digest = createHash("sha1").update(key + GUID).digest("base64");
      const headers = [
        "HTTP/1.1 101 Switching Protocols",
        "Upgrade: websocket",
        "Connection: Upgrade",
        `Sec-WebSocket-Accept: ${digest}`
      ];
      const ws2 = new this.options.WebSocket(null, void 0, this.options);
      if (protocols.size) {
        const protocol = this.options.handleProtocols ? this.options.handleProtocols(protocols, req) : protocols.values().next().value;
        if (protocol) {
          headers.push(`Sec-WebSocket-Protocol: ${protocol}`);
          ws2._protocol = protocol;
        }
      }
      if (extensions[PerMessageDeflate.extensionName]) {
        const params = extensions[PerMessageDeflate.extensionName].params;
        const value = extension2.format({
          [PerMessageDeflate.extensionName]: [params]
        });
        headers.push(`Sec-WebSocket-Extensions: ${value}`);
        ws2._extensions = extensions;
      }
      this.emit("headers", headers, req);
      socket.write(headers.concat("\r\n").join("\r\n"));
      socket.removeListener("error", socketOnError);
      ws2.setSocket(socket, head, {
        allowSynchronousEvents: this.options.allowSynchronousEvents,
        maxPayload: this.options.maxPayload,
        skipUTF8Validation: this.options.skipUTF8Validation
      });
      if (this.clients) {
        this.clients.add(ws2);
        ws2.on("close", () => {
          this.clients.delete(ws2);
          if (this._shouldEmitClose && !this.clients.size) {
            process.nextTick(emitClose, this);
          }
        });
      }
      cb(ws2, req);
    }
  }
  websocketServer = WebSocketServer;
  function addListeners(server, map) {
    for (const event of Object.keys(map)) server.on(event, map[event]);
    return function removeListeners() {
      for (const event of Object.keys(map)) {
        server.removeListener(event, map[event]);
      }
    };
  }
  function emitClose(server) {
    server._state = CLOSED;
    server.emit("close");
  }
  function socketOnError() {
    this.destroy();
  }
  function abortHandshake(socket, code, message, headers) {
    message = message || http.STATUS_CODES[code];
    headers = {
      Connection: "close",
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(message),
      ...headers
    };
    socket.once("finish", socket.destroy);
    socket.end(
      `HTTP/1.1 ${code} ${http.STATUS_CODES[code]}\r
` + Object.keys(headers).map((h) => `${h}: ${headers[h]}`).join("\r\n") + "\r\n\r\n" + message
    );
  }
  function abortHandshakeOrEmitwsClientError(server, req, socket, code, message, headers) {
    if (server.listenerCount("wsClientError")) {
      const err = new Error(message);
      Error.captureStackTrace(err, abortHandshakeOrEmitwsClientError);
      server.emit("wsClientError", err, socket, req);
    } else {
      abortHandshake(socket, code, message, headers);
    }
  }
  return websocketServer;
}
var ws;
var hasRequiredWs;
function requireWs() {
  if (hasRequiredWs) return ws;
  hasRequiredWs = 1;
  const WebSocket = requireWebsocket();
  WebSocket.createWebSocketStream = requireStream();
  WebSocket.Server = requireWebsocketServer();
  WebSocket.Receiver = requireReceiver();
  WebSocket.Sender = requireSender();
  WebSocket.WebSocket = WebSocket;
  WebSocket.WebSocketServer = WebSocket.Server;
  ws = WebSocket;
  return ws;
}
var node;
var hasRequiredNode;
function requireNode() {
  if (hasRequiredNode) return node;
  hasRequiredNode = 1;
  node = requireWs();
  return node;
}
requireNode();
var require_proxy_deep = __commonJS({
  "../../node_modules/.pnpm/proxy-deep@3.1.1/node_modules/proxy-deep/index.js"(exports, module) {
    function parsePath2(text) {
      return text.split(".");
    }
    function push(arr, el) {
      const newArr = arr.slice();
      newArr.push(el);
      return newArr;
    }
    var trapNames = [
      "apply",
      "construct",
      "defineProperty",
      "deleteProperty",
      "enumerate",
      "get",
      "getOwnPropertyDescriptor",
      "getPrototypeOf",
      "has",
      "isExtensible",
      "ownKeys",
      "preventExtensions",
      "set",
      "setPrototypeOf"
    ];
    var keys = {
      get: 1,
      set: 1,
      deleteProperty: 1,
      has: 1,
      defineProperty: 1,
      getOwnPropertyDescriptor: 1
    };
    function DeepProxy2(rootTarget, traps, options) {
      let path = [];
      let userData = {};
      if (options !== void 0 && typeof options.path !== "undefined") {
        path = parsePath2(options.path);
      }
      if (options !== void 0 && typeof options.userData !== "undefined") {
        userData = options.userData;
      }
      function createProxy(target, path2) {
        const context = { rootTarget, path: path2 };
        Object.assign(context, userData);
        const realTraps = {};
        for (const trapName of trapNames) {
          const keyParamIdx = keys[trapName], trap = traps[trapName];
          if (typeof trap !== "undefined") {
            if (typeof keyParamIdx !== "undefined") {
              realTraps[trapName] = function() {
                const key = arguments[keyParamIdx];
                context.nest = function(nestedTarget) {
                  if (nestedTarget === void 0)
                    nestedTarget = rootTarget;
                  return createProxy(nestedTarget, push(path2, key));
                };
                return trap.apply(context, arguments);
              };
            } else {
              realTraps[trapName] = function() {
                context.nest = function(nestedTarget) {
                  if (nestedTarget === void 0)
                    nestedTarget = {};
                  return createProxy(nestedTarget, path2);
                };
                return trap.apply(context, arguments);
              };
            }
          }
        }
        return new Proxy(target, realTraps);
      }
      return createProxy(rootTarget, path);
    }
    module.exports = DeepProxy2;
  }
});
__toESM(require_proxy_deep());
debug$1.extend("watchLogs");
error$2.extend("watchLogs");
debug$1.extend("createPreconfirmedBlockStream");
debug$1.extend("createStoreSync");
internalTableIds.map((tableId) => ({ tableId }));
/**
 * UUID.core.js - UUID.js for Minimalists
 *
 * @file
 * @author  LiosK
 * @version v4.2.0
 * @license Apache License 2.0: Copyright (c) 2010-2018 LiosK
 * @url https://github.com/LiosK/UUID.js/blob/master/src/uuid.core.js
 */
var Type = /* @__PURE__ */ ((Type2) => {
  Type2[Type2["Boolean"] = 0] = "Boolean";
  Type2[Type2["Number"] = 1] = "Number";
  Type2[Type2["OptionalNumber"] = 2] = "OptionalNumber";
  Type2[Type2["BigInt"] = 3] = "BigInt";
  Type2[Type2["OptionalBigInt"] = 4] = "OptionalBigInt";
  Type2[Type2["String"] = 5] = "String";
  Type2[Type2["OptionalString"] = 6] = "OptionalString";
  Type2[Type2["NumberArray"] = 7] = "NumberArray";
  Type2[Type2["OptionalNumberArray"] = 8] = "OptionalNumberArray";
  Type2[Type2["BigIntArray"] = 9] = "BigIntArray";
  Type2[Type2["OptionalBigIntArray"] = 10] = "OptionalBigIntArray";
  Type2[Type2["StringArray"] = 11] = "StringArray";
  Type2[Type2["OptionalStringArray"] = 12] = "OptionalStringArray";
  Type2[Type2["Entity"] = 13] = "Entity";
  Type2[Type2["OptionalEntity"] = 14] = "OptionalEntity";
  Type2[Type2["EntityArray"] = 15] = "EntityArray";
  Type2[Type2["OptionalEntityArray"] = 16] = "OptionalEntityArray";
  Type2[Type2["T"] = 17] = "T";
  Type2[Type2["OptionalT"] = 18] = "OptionalT";
  return Type2;
})(Type || {});
var debug2 = debug$1.extend("recs");
var error = debug$1.extend("reccs");
debug2.log = console.debug.bind(console);
error.log = console.error.bind(console);
function hexKeyTupleToEntity(hexKeyTuple) {
  return concatHex(hexKeyTuple);
}
hexKeyTupleToEntity([]);
({
  uint8: Type.Number,
  uint16: Type.Number,
  uint24: Type.Number,
  uint32: Type.Number,
  uint40: Type.Number,
  uint48: Type.Number,
  uint56: Type.BigInt,
  uint64: Type.BigInt,
  uint72: Type.BigInt,
  uint80: Type.BigInt,
  uint88: Type.BigInt,
  uint96: Type.BigInt,
  uint104: Type.BigInt,
  uint112: Type.BigInt,
  uint120: Type.BigInt,
  uint128: Type.BigInt,
  uint136: Type.BigInt,
  uint144: Type.BigInt,
  uint152: Type.BigInt,
  uint160: Type.BigInt,
  uint168: Type.BigInt,
  uint176: Type.BigInt,
  uint184: Type.BigInt,
  uint192: Type.BigInt,
  uint200: Type.BigInt,
  uint208: Type.BigInt,
  uint216: Type.BigInt,
  uint224: Type.BigInt,
  uint232: Type.BigInt,
  uint240: Type.BigInt,
  uint248: Type.BigInt,
  uint256: Type.BigInt,
  int8: Type.Number,
  int16: Type.Number,
  int24: Type.Number,
  int32: Type.Number,
  int40: Type.Number,
  int48: Type.Number,
  int56: Type.BigInt,
  int64: Type.BigInt,
  int72: Type.BigInt,
  int80: Type.BigInt,
  int88: Type.BigInt,
  int96: Type.BigInt,
  int104: Type.BigInt,
  int112: Type.BigInt,
  int120: Type.BigInt,
  int128: Type.BigInt,
  int136: Type.BigInt,
  int144: Type.BigInt,
  int152: Type.BigInt,
  int160: Type.BigInt,
  int168: Type.BigInt,
  int176: Type.BigInt,
  int184: Type.BigInt,
  int192: Type.BigInt,
  int200: Type.BigInt,
  int208: Type.BigInt,
  int216: Type.BigInt,
  int224: Type.BigInt,
  int232: Type.BigInt,
  int240: Type.BigInt,
  int248: Type.BigInt,
  int256: Type.BigInt,
  bytes1: Type.String,
  bytes2: Type.String,
  bytes3: Type.String,
  bytes4: Type.String,
  bytes5: Type.String,
  bytes6: Type.String,
  bytes7: Type.String,
  bytes8: Type.String,
  bytes9: Type.String,
  bytes10: Type.String,
  bytes11: Type.String,
  bytes12: Type.String,
  bytes13: Type.String,
  bytes14: Type.String,
  bytes15: Type.String,
  bytes16: Type.String,
  bytes17: Type.String,
  bytes18: Type.String,
  bytes19: Type.String,
  bytes20: Type.String,
  bytes21: Type.String,
  bytes22: Type.String,
  bytes23: Type.String,
  bytes24: Type.String,
  bytes25: Type.String,
  bytes26: Type.String,
  bytes27: Type.String,
  bytes28: Type.String,
  bytes29: Type.String,
  bytes30: Type.String,
  bytes31: Type.String,
  bytes32: Type.String,
  bool: Type.Boolean,
  address: Type.String,
  "uint8[]": Type.NumberArray,
  "uint16[]": Type.NumberArray,
  "uint24[]": Type.NumberArray,
  "uint32[]": Type.NumberArray,
  "uint40[]": Type.NumberArray,
  "uint48[]": Type.NumberArray,
  "uint56[]": Type.BigIntArray,
  "uint64[]": Type.BigIntArray,
  "uint72[]": Type.BigIntArray,
  "uint80[]": Type.BigIntArray,
  "uint88[]": Type.BigIntArray,
  "uint96[]": Type.BigIntArray,
  "uint104[]": Type.BigIntArray,
  "uint112[]": Type.BigIntArray,
  "uint120[]": Type.BigIntArray,
  "uint128[]": Type.BigIntArray,
  "uint136[]": Type.BigIntArray,
  "uint144[]": Type.BigIntArray,
  "uint152[]": Type.BigIntArray,
  "uint160[]": Type.BigIntArray,
  "uint168[]": Type.BigIntArray,
  "uint176[]": Type.BigIntArray,
  "uint184[]": Type.BigIntArray,
  "uint192[]": Type.BigIntArray,
  "uint200[]": Type.BigIntArray,
  "uint208[]": Type.BigIntArray,
  "uint216[]": Type.BigIntArray,
  "uint224[]": Type.BigIntArray,
  "uint232[]": Type.BigIntArray,
  "uint240[]": Type.BigIntArray,
  "uint248[]": Type.BigIntArray,
  "uint256[]": Type.BigIntArray,
  "int8[]": Type.NumberArray,
  "int16[]": Type.NumberArray,
  "int24[]": Type.NumberArray,
  "int32[]": Type.NumberArray,
  "int40[]": Type.NumberArray,
  "int48[]": Type.NumberArray,
  "int56[]": Type.BigIntArray,
  "int64[]": Type.BigIntArray,
  "int72[]": Type.BigIntArray,
  "int80[]": Type.BigIntArray,
  "int88[]": Type.BigIntArray,
  "int96[]": Type.BigIntArray,
  "int104[]": Type.BigIntArray,
  "int112[]": Type.BigIntArray,
  "int120[]": Type.BigIntArray,
  "int128[]": Type.BigIntArray,
  "int136[]": Type.BigIntArray,
  "int144[]": Type.BigIntArray,
  "int152[]": Type.BigIntArray,
  "int160[]": Type.BigIntArray,
  "int168[]": Type.BigIntArray,
  "int176[]": Type.BigIntArray,
  "int184[]": Type.BigIntArray,
  "int192[]": Type.BigIntArray,
  "int200[]": Type.BigIntArray,
  "int208[]": Type.BigIntArray,
  "int216[]": Type.BigIntArray,
  "int224[]": Type.BigIntArray,
  "int232[]": Type.BigIntArray,
  "int240[]": Type.BigIntArray,
  "int248[]": Type.BigIntArray,
  "int256[]": Type.BigIntArray,
  "bytes1[]": Type.StringArray,
  "bytes2[]": Type.StringArray,
  "bytes3[]": Type.StringArray,
  "bytes4[]": Type.StringArray,
  "bytes5[]": Type.StringArray,
  "bytes6[]": Type.StringArray,
  "bytes7[]": Type.StringArray,
  "bytes8[]": Type.StringArray,
  "bytes9[]": Type.StringArray,
  "bytes10[]": Type.StringArray,
  "bytes11[]": Type.StringArray,
  "bytes12[]": Type.StringArray,
  "bytes13[]": Type.StringArray,
  "bytes14[]": Type.StringArray,
  "bytes15[]": Type.StringArray,
  "bytes16[]": Type.StringArray,
  "bytes17[]": Type.StringArray,
  "bytes18[]": Type.StringArray,
  "bytes19[]": Type.StringArray,
  "bytes20[]": Type.StringArray,
  "bytes21[]": Type.StringArray,
  "bytes22[]": Type.StringArray,
  "bytes23[]": Type.StringArray,
  "bytes24[]": Type.StringArray,
  "bytes25[]": Type.StringArray,
  "bytes26[]": Type.StringArray,
  "bytes27[]": Type.StringArray,
  "bytes28[]": Type.StringArray,
  "bytes29[]": Type.StringArray,
  "bytes30[]": Type.StringArray,
  "bytes31[]": Type.StringArray,
  "bytes32[]": Type.StringArray,
  "bool[]": Type.T,
  // no boolean arr,
  "address[]": Type.StringArray,
  bytes: Type.String,
  string: Type.String
});
({
  ...mudFoundry,
  rpcUrls: {
    ...mudFoundry.rpcUrls
  }
});
({
  ...baseSepolia,
  rpcUrls: {
    default: {
      http: [
        "https://base-sepolia.g.alchemy.com/v2/-hnbjcqjwXmO7ip5cyHBh",
        ...baseSepolia.rpcUrls.default.http
      ]
    }
  }
});
({
  ...base,
  rpcUrls: {
    default: {
      http: [
        "https://base-mainnet.g.alchemy.com/v2/o0Q1hppQS1CH1vqg63edZ",
        ...base.rpcUrls.default.http
      ]
    }
  }
});
function Loading($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    $$renderer2.push(`<div class="loading svelte-1j79sd3"><div class="status-box svelte-1j79sd3"><div class="mc-logo svelte-1j79sd3"><img src="/images/logo.png" alt="Moving Castles GmbH" class="svelte-1j79sd3"/></div> <div>${escape_html(store_get($$store_subs ??= {}, "$loadingMessage", loadingMessage))}</div></div></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
var CommandType;
(function(CommandType2) {
  CommandType2[CommandType2["V3_SWAP_EXACT_IN"] = 0] = "V3_SWAP_EXACT_IN";
  CommandType2[CommandType2["V3_SWAP_EXACT_OUT"] = 1] = "V3_SWAP_EXACT_OUT";
  CommandType2[CommandType2["PERMIT2_TRANSFER_FROM"] = 2] = "PERMIT2_TRANSFER_FROM";
  CommandType2[CommandType2["SWEEP"] = 4] = "SWEEP";
  CommandType2[CommandType2["PAY_PORTION"] = 6] = "PAY_PORTION";
  CommandType2[CommandType2["V2_SWAP_EXACT_IN"] = 8] = "V2_SWAP_EXACT_IN";
  CommandType2[CommandType2["V2_SWAP_EXACT_OUT"] = 9] = "V2_SWAP_EXACT_OUT";
  CommandType2[CommandType2["PERMIT2_PERMIT"] = 10] = "PERMIT2_PERMIT";
  CommandType2[CommandType2["WRAP_ETH"] = 11] = "WRAP_ETH";
  CommandType2[CommandType2["UNWRAP_WETH"] = 12] = "UNWRAP_WETH";
  CommandType2[CommandType2["V4_SWAP"] = 16] = "V4_SWAP";
})(CommandType || (CommandType = {}));
const PERMIT_STRUCT = {
  name: "permit",
  type: "tuple",
  components: [
    {
      name: "details",
      type: "tuple",
      components: [
        { name: "token", type: "address" },
        { name: "amount", type: "uint160" },
        { name: "expiration", type: "uint48" },
        { name: "nonce", type: "uint48" }
      ]
    },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" }
  ]
};
({
  [CommandType.V3_SWAP_EXACT_IN]: [
    { type: "address" },
    { type: "uint256" },
    { type: "uint256" },
    { type: "bytes" },
    { type: "bool" }
  ],
  [CommandType.V3_SWAP_EXACT_OUT]: [
    { type: "address" },
    { type: "uint256" },
    { type: "uint256" },
    { type: "bytes" },
    { type: "bool" }
  ],
  [CommandType.PERMIT2_PERMIT]: [PERMIT_STRUCT, { type: "bytes" }],
  [CommandType.PERMIT2_TRANSFER_FROM]: [
    { type: "address" },
    { type: "address" },
    { type: "uint256" }
  ],
  [CommandType.V4_SWAP]: [{ type: "bytes" }, { type: "bytes[]" }],
  [CommandType.WRAP_ETH]: [{ type: "address" }, { type: "uint256" }],
  [CommandType.UNWRAP_WETH]: [{ type: "address" }, { type: "uint256" }],
  [CommandType.V2_SWAP_EXACT_IN]: [
    { type: "address" },
    { type: "uint256" },
    { type: "uint256" },
    { type: "address[]" },
    { type: "bool" }
  ],
  [CommandType.V2_SWAP_EXACT_OUT]: [
    { type: "address" },
    { type: "uint256" },
    { type: "uint256" },
    { type: "address[]" },
    { type: "bool" }
  ],
  [CommandType.SWEEP]: [
    { type: "address" },
    { type: "address" },
    { type: "uint256" }
  ],
  [CommandType.PAY_PORTION]: [
    { type: "address" },
    { type: "address" },
    { type: "uint256" }
  ]
});
parseAbi$1([
  "function allowance(address user, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)"
]);
var V4ActionType$1;
(function(V4ActionType2) {
  V4ActionType2[V4ActionType2["INCREASE_LIQUIDITY"] = 0] = "INCREASE_LIQUIDITY";
  V4ActionType2[V4ActionType2["DECREASE_LIQUIDITY"] = 1] = "DECREASE_LIQUIDITY";
  V4ActionType2[V4ActionType2["MINT_POSITION"] = 2] = "MINT_POSITION";
  V4ActionType2[V4ActionType2["BURN_POSITION"] = 3] = "BURN_POSITION";
  V4ActionType2[V4ActionType2["INCREASE_LIQUIDITY_FROM_DELTAS"] = 4] = "INCREASE_LIQUIDITY_FROM_DELTAS";
  V4ActionType2[V4ActionType2["MINT_POSITION_FROM_DELTAS"] = 5] = "MINT_POSITION_FROM_DELTAS";
  V4ActionType2[V4ActionType2["SWAP_EXACT_IN_SINGLE"] = 6] = "SWAP_EXACT_IN_SINGLE";
  V4ActionType2[V4ActionType2["SWAP_EXACT_IN"] = 7] = "SWAP_EXACT_IN";
  V4ActionType2[V4ActionType2["SWAP_EXACT_OUT_SINGLE"] = 8] = "SWAP_EXACT_OUT_SINGLE";
  V4ActionType2[V4ActionType2["SWAP_EXACT_OUT"] = 9] = "SWAP_EXACT_OUT";
  V4ActionType2[V4ActionType2["SETTLE"] = 11] = "SETTLE";
  V4ActionType2[V4ActionType2["SETTLE_ALL"] = 12] = "SETTLE_ALL";
  V4ActionType2[V4ActionType2["TAKE"] = 14] = "TAKE";
  V4ActionType2[V4ActionType2["TAKE_ALL"] = 15] = "TAKE_ALL";
  V4ActionType2[V4ActionType2["TAKE_PORTION"] = 16] = "TAKE_PORTION";
  V4ActionType2[V4ActionType2["CLOSE_CURRENCY"] = 18] = "CLOSE_CURRENCY";
  V4ActionType2[V4ActionType2["SWEEP"] = 20] = "SWEEP";
  V4ActionType2[V4ActionType2["WRAP"] = 21] = "WRAP";
  V4ActionType2[V4ActionType2["UNWRAP"] = 22] = "UNWRAP";
})(V4ActionType$1 || (V4ActionType$1 = {}));
const POOL_KEY_STRUCT$1 = {
  name: "poolKey",
  type: "tuple",
  components: [
    { name: "currency0", type: "address" },
    { name: "currency1", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" }
  ]
};
const PATH_KEY_STRUCT$1 = {
  components: [
    { name: "intermediateCurrency", type: "address" },
    { name: "fee", type: "uint256" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
    { name: "hookData", type: "bytes" }
  ]
};
({
  [V4ActionType$1.INCREASE_LIQUIDITY]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType$1.DECREASE_LIQUIDITY]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType$1.MINT_POSITION]: [
    POOL_KEY_STRUCT$1,
    { type: "int24" },
    { type: "int24" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" }
  ],
  [V4ActionType$1.BURN_POSITION]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType$1.INCREASE_LIQUIDITY_FROM_DELTAS]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType$1.MINT_POSITION_FROM_DELTAS]: [
    POOL_KEY_STRUCT$1,
    { type: "int24" },
    { type: "int24" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" }
  ],
  [V4ActionType$1.SWAP_EXACT_IN_SINGLE]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        POOL_KEY_STRUCT$1,
        { name: "zeroForOne", type: "bool" },
        { name: "amountIn", type: "uint128" },
        { name: "amountOutMinimum", type: "uint128" },
        { name: "hookData", type: "bytes" }
      ]
    }
  ],
  [V4ActionType$1.SWAP_EXACT_IN]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        { name: "currencyIn", type: "address" },
        {
          name: "path",
          type: "tuple[]",
          components: PATH_KEY_STRUCT$1.components
        },
        { name: "amountIn", type: "uint128" },
        { name: "amountOutMinimum", type: "uint128" }
      ]
    }
  ],
  [V4ActionType$1.SWAP_EXACT_OUT_SINGLE]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        POOL_KEY_STRUCT$1,
        { name: "zeroForOne", type: "bool" },
        { name: "amountOut", type: "uint128" },
        { name: "amountInMaximum", type: "uint128" },
        { name: "hookData", type: "bytes" }
      ]
    }
  ],
  [V4ActionType$1.SWAP_EXACT_OUT]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        { name: "currencyOut", type: "address" },
        {
          name: "path",
          type: "tuple[]",
          components: PATH_KEY_STRUCT$1.components
        },
        { name: "amountOut", type: "uint128" },
        { name: "amountInMaximum", type: "uint128" }
      ]
    }
  ],
  [V4ActionType$1.SETTLE]: [
    { type: "address" },
    { type: "uint256" },
    { type: "bool" }
  ],
  [V4ActionType$1.SETTLE_ALL]: [{ type: "address" }, { type: "uint256" }],
  [V4ActionType$1.TAKE]: [
    { type: "address" },
    { type: "address" },
    { type: "uint256" }
  ],
  [V4ActionType$1.TAKE_ALL]: [{ type: "address" }, { type: "uint256" }],
  [V4ActionType$1.TAKE_PORTION]: [
    { type: "address" },
    { type: "address" },
    { type: "uint256" }
  ],
  [V4ActionType$1.CLOSE_CURRENCY]: [{ type: "address" }],
  [V4ActionType$1.SWEEP]: [{ type: "address" }, { type: "address" }],
  [V4ActionType$1.WRAP]: [{ type: "uint256" }],
  [V4ActionType$1.UNWRAP]: [{ type: "uint256" }]
});
var derc20BuyLimitAbi = [
  {
    inputs: [
      { internalType: "string", name: "name_", type: "string" },
      { internalType: "string", name: "symbol_", type: "string" },
      { internalType: "uint256", name: "initialSupply", type: "uint256" },
      { internalType: "address", name: "recipient", type: "address" },
      { internalType: "address", name: "owner_", type: "address" },
      { internalType: "uint256", name: "yearlyMintRate_", type: "uint256" },
      { internalType: "uint256", name: "vestingDuration_", type: "uint256" },
      { internalType: "address[]", name: "recipients_", type: "address[]" },
      { internalType: "uint256[]", name: "amounts_", type: "uint256[]" },
      { internalType: "string", name: "tokenURI_", type: "string" },
      { internalType: "contract IPoolManager", name: "buyLimitedPoolManager_", type: "address" },
      { internalType: "uint256", name: "buyLimitEnd_", type: "uint256" },
      { internalType: "uint256", name: "spendLimitAmount_", type: "uint256" },
      { internalType: "address", name: "airlock_", type: "address" }
    ],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  { inputs: [], name: "ArrayLengthsMismatch", type: "error" },
  { inputs: [], name: "BuyLimitExceeded", type: "error" },
  { inputs: [], name: "CheckpointUnorderedInsertion", type: "error" },
  { inputs: [], name: "ECDSAInvalidSignature", type: "error" },
  {
    inputs: [{ internalType: "uint256", name: "length", type: "uint256" }],
    name: "ECDSAInvalidSignatureLength",
    type: "error"
  },
  {
    inputs: [{ internalType: "bytes32", name: "s", type: "bytes32" }],
    name: "ECDSAInvalidSignatureS",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint256", name: "increasedSupply", type: "uint256" },
      { internalType: "uint256", name: "cap", type: "uint256" }
    ],
    name: "ERC20ExceededSafeSupply",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "allowance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" }
    ],
    name: "ERC20InsufficientAllowance",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "sender", type: "address" },
      { internalType: "uint256", name: "balance", type: "uint256" },
      { internalType: "uint256", name: "needed", type: "uint256" }
    ],
    name: "ERC20InsufficientBalance",
    type: "error"
  },
  {
    inputs: [{ internalType: "address", name: "approver", type: "address" }],
    name: "ERC20InvalidApprover",
    type: "error"
  },
  {
    inputs: [{ internalType: "address", name: "receiver", type: "address" }],
    name: "ERC20InvalidReceiver",
    type: "error"
  },
  {
    inputs: [{ internalType: "address", name: "sender", type: "address" }],
    name: "ERC20InvalidSender",
    type: "error"
  },
  {
    inputs: [{ internalType: "address", name: "spender", type: "address" }],
    name: "ERC20InvalidSpender",
    type: "error"
  },
  {
    inputs: [{ internalType: "uint256", name: "deadline", type: "uint256" }],
    name: "ERC2612ExpiredSignature",
    type: "error"
  },
  {
    inputs: [
      { internalType: "address", name: "signer", type: "address" },
      { internalType: "address", name: "owner", type: "address" }
    ],
    name: "ERC2612InvalidSigner",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint256", name: "timepoint", type: "uint256" },
      { internalType: "uint48", name: "clock", type: "uint48" }
    ],
    name: "ERC5805FutureLookup",
    type: "error"
  },
  { inputs: [], name: "ERC6372InconsistentClock", type: "error" },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "currentNonce", type: "uint256" }
    ],
    name: "InvalidAccountNonce",
    type: "error"
  },
  { inputs: [], name: "InvalidShortString", type: "error" },
  { inputs: [], name: "MalformedCountryCode", type: "error" },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" }
    ],
    name: "MaxPreMintPerAddressExceeded",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" }
    ],
    name: "MaxTotalPreMintExceeded",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" }
    ],
    name: "MaxTotalVestedExceeded",
    type: "error"
  },
  {
    inputs: [
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "limit", type: "uint256" }
    ],
    name: "MaxYearlyMintRateExceeded",
    type: "error"
  },
  { inputs: [], name: "MintingNotStartedYet", type: "error" },
  { inputs: [], name: "NoCountryCode", type: "error" },
  { inputs: [], name: "NoMintableAmount", type: "error" },
  {
    inputs: [{ internalType: "address", name: "owner", type: "address" }],
    name: "OwnableInvalidOwner",
    type: "error"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "OwnableUnauthorizedAccount",
    type: "error"
  },
  { inputs: [], name: "PoolLocked", type: "error" },
  {
    inputs: [
      { internalType: "uint8", name: "bits", type: "uint8" },
      { internalType: "uint256", name: "value", type: "uint256" }
    ],
    name: "SafeCastOverflowedUintDowncast",
    type: "error"
  },
  {
    inputs: [{ internalType: "string", name: "str", type: "string" }],
    name: "StringTooLong",
    type: "error"
  },
  { inputs: [], name: "VestingNotStartedYet", type: "error" },
  {
    inputs: [{ internalType: "uint256", name: "expiry", type: "uint256" }],
    name: "VotesExpiredSignature",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "owner", type: "address" },
      { indexed: true, internalType: "address", name: "spender", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
    ],
    name: "Approval",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "delegator", type: "address" },
      { indexed: true, internalType: "address", name: "fromDelegate", type: "address" },
      { indexed: true, internalType: "address", name: "toDelegate", type: "address" }
    ],
    name: "DelegateChanged",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "delegate", type: "address" },
      { indexed: false, internalType: "uint256", name: "previousVotes", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "newVotes", type: "uint256" }
    ],
    name: "DelegateVotesChanged",
    type: "event"
  },
  { anonymous: false, inputs: [], name: "EIP712DomainChanged", type: "event" },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "previousOwner", type: "address" },
      { indexed: true, internalType: "address", name: "newOwner", type: "address" }
    ],
    name: "OwnershipTransferred",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "string", name: "countryCode", type: "string" },
      { indexed: false, internalType: "uint256", name: "tokenAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "numeraireAmount", type: "uint256" }
    ],
    name: "Receipt",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "from", type: "address" },
      { indexed: true, internalType: "address", name: "to", type: "address" },
      { indexed: false, internalType: "uint256", name: "value", type: "uint256" }
    ],
    name: "Transfer",
    type: "event"
  },
  {
    inputs: [],
    name: "CLOCK_MODE",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "DOMAIN_SEPARATOR",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "airlock",
    outputs: [{ internalType: "contract Airlock", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" }
    ],
    name: "allowance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" }
    ],
    name: "approve",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "amount", type: "uint256" }],
    name: "burn",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "buyLimitEnd",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "buyLimitedPoolManager",
    outputs: [{ internalType: "contract IPoolManager", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint32", name: "pos", type: "uint32" }
    ],
    name: "checkpoints",
    outputs: [
      {
        components: [
          { internalType: "uint48", name: "_key", type: "uint48" },
          { internalType: "uint208", name: "_value", type: "uint208" }
        ],
        internalType: "struct Checkpoints.Checkpoint208",
        name: "",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "clock",
    outputs: [{ internalType: "uint48", name: "", type: "uint48" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "computeAvailableVestedAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "currentYearStart",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "delegatee", type: "address" }],
    name: "delegate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "delegatee", type: "address" },
      { internalType: "uint256", name: "nonce", type: "uint256" },
      { internalType: "uint256", name: "expiry", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" }
    ],
    name: "delegateBySig",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "delegates",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "eip712Domain",
    outputs: [
      { internalType: "bytes1", name: "fields", type: "bytes1" },
      { internalType: "string", name: "name", type: "string" },
      { internalType: "string", name: "version", type: "string" },
      { internalType: "uint256", name: "chainId", type: "uint256" },
      { internalType: "address", name: "verifyingContract", type: "address" },
      { internalType: "bytes32", name: "salt", type: "bytes32" },
      { internalType: "uint256[]", name: "extensions", type: "uint256[]" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "getBuyLimitPoolInfo",
    outputs: [
      { internalType: "bool", name: "earlyExit", type: "bool" },
      { internalType: "bool", name: "isToken0", type: "bool" },
      { internalType: "PoolId", name: "poolId", type: "bytes32" }
    ],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "getCountryCode",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "uint256", name: "timepoint", type: "uint256" }],
    name: "getPastTotalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "account", type: "address" },
      { internalType: "uint256", name: "timepoint", type: "uint256" }
    ],
    name: "getPastVotes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "", type: "address" }],
    name: "getSpentAmounts",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getVestingDataOf",
    outputs: [
      { internalType: "uint256", name: "totalAmount", type: "uint256" },
      { internalType: "uint256", name: "releasedAmount", type: "uint256" }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "getVotes",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "isPoolUnlocked",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "lastMintTimestamp",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "pool_", type: "address" }],
    name: "lockPool",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "mintInflation",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "name",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "owner_", type: "address" }],
    name: "nonces",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "account", type: "address" }],
    name: "numCheckpoints",
    outputs: [{ internalType: "uint32", name: "", type: "uint32" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "owner", type: "address" },
      { internalType: "address", name: "spender", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
      { internalType: "uint8", name: "v", type: "uint8" },
      { internalType: "bytes32", name: "r", type: "bytes32" },
      { internalType: "bytes32", name: "s", type: "bytes32" }
    ],
    name: "permit",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "pool",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  },
  { inputs: [], name: "release", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [],
    name: "renounceOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "countryCode", type: "string" }],
    name: "setCountryCode",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "spendLimitAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "tokenURI",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" }
    ],
    name: "transfer",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [
      { internalType: "address", name: "from", type: "address" },
      { internalType: "address", name: "to", type: "address" },
      { internalType: "uint256", name: "value", type: "uint256" }
    ],
    name: "transferFrom",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "address", name: "newOwner", type: "address" }],
    name: "transferOwnership",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  { inputs: [], name: "unlockPool", outputs: [], stateMutability: "nonpayable", type: "function" },
  {
    inputs: [{ internalType: "uint256", name: "newMintRate", type: "uint256" }],
    name: "updateMintRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "string", name: "tokenURI_", type: "string" }],
    name: "updateTokenURI",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [],
    name: "vestedTotalAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "vestingDuration",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "vestingStart",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "yearlyMintRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  }
];
var swapAndReceiptEventsAbi = [
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "PoolId", name: "id", type: "bytes32" },
      { indexed: true, internalType: "address", name: "sender", type: "address" },
      { indexed: false, internalType: "int128", name: "amount0", type: "int128" },
      { indexed: false, internalType: "int128", name: "amount1", type: "int128" },
      { indexed: false, internalType: "uint160", name: "sqrtPriceX96", type: "uint160" },
      { indexed: false, internalType: "uint128", name: "liquidity", type: "uint128" },
      { indexed: false, internalType: "int24", name: "tick", type: "int24" },
      { indexed: false, internalType: "uint24", name: "fee", type: "uint24" }
    ],
    name: "Swap",
    type: "event"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "address", name: "buyer", type: "address" },
      { indexed: true, internalType: "string", name: "countryCode", type: "string" },
      { indexed: false, internalType: "uint256", name: "tokenAmount", type: "uint256" },
      { indexed: false, internalType: "uint256", name: "numeraireAmount", type: "uint256" }
    ],
    name: "Receipt",
    type: "event"
  }
];
async function buyLimitSetCountryCode(walletClient, address, countryCode) {
  return await walletClient.writeContract({
    address,
    abi: derc20BuyLimitAbi,
    functionName: "setCountryCode",
    args: [countryCode]
  });
}
function getPoolKey(auctionParams2) {
  const token = auctionParams2.token.address;
  const numeraire = auctionParams2.numeraire.address;
  const [currency0, currency1] = [token, numeraire].sort(
    (a, b) => a.toLowerCase() < b.toLowerCase() ? -1 : 1
  );
  return {
    currency0,
    currency1,
    fee: DYNAMIC_FEE_FLAG,
    tickSpacing: auctionParams2.pool.tickSpacing,
    hooks: auctionParams2.hookAddress
  };
}
var permit2Abi = parseAbi$1([
  "function allowance(address user, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)"
]);
var PERMIT2_PERMIT_TYPE = {
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" }
  ],
  PermitSingle: [
    { name: "details", type: "PermitDetails" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" }
  ]
};
async function isPermit2AllowanceRequired(publicClient2, walletAddress, tokenAddress, requiredAllowance) {
  const permit2Address = getAddresses(publicClient2.chain.id).permit2;
  const allowance = await publicClient2.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [walletAddress, permit2Address]
  });
  return allowance < requiredAllowance;
}
async function permit2AllowMax(publicClient2, walletClient, tokenAddress) {
  const permit2Address = getAddresses(publicClient2.chain.id).permit2;
  const txHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [permit2Address, maxUint256]
  });
  const receipt = await publicClient2.waitForTransactionReceipt({ hash: txHash });
  return {
    txHash,
    receipt
  };
}
async function signPermit2(publicClient2, walletClient, tokenAddress, spender, amount) {
  if (publicClient2.chain.id !== walletClient.chain.id) {
    throw new Error("public and wallet client chains mismatch");
  }
  const permit2Address = getAddresses(publicClient2.chain.id).permit2;
  const permit2Allowance = await publicClient2.readContract({
    address: permit2Address,
    abi: permit2Abi,
    functionName: "allowance",
    args: [walletClient.account.address, tokenAddress, spender]
  });
  const nonce = permit2Allowance[2];
  const nowSec = Math.floor(Date.now() / 1e3);
  const permit2 = {
    details: {
      token: tokenAddress,
      amount,
      expiration: nowSec + 3600,
      nonce
    },
    spender,
    sigDeadline: BigInt(nowSec + 3600)
  };
  const permitSignature2 = await walletClient.signTypedData({
    account: walletClient.account,
    domain: {
      name: "Permit2",
      chainId: publicClient2.chain.id,
      verifyingContract: permit2Address
    },
    types: PERMIT2_PERMIT_TYPE,
    primaryType: "PermitSingle",
    message: permit2
  });
  return { permit: permit2, permitSignature: permitSignature2 };
}
async function waitForDopplerSwapReceipt(publicClient2, hash) {
  const receipt = await publicClient2.waitForTransactionReceipt({ hash });
  const parsedLogs = parseEventLogs({
    abi: swapAndReceiptEventsAbi,
    logs: receipt.logs
  });
  const swapLogs = parsedLogs.filter(
    ({ eventName, args }) => eventName === "Swap" && args.liquidity > 0 || eventName === "Receipt"
  );
  return swapLogs;
}
({
  [base.id]: {},
  [baseSepolia.id]: {}
});
var vertex_default$a = "precision mediump float;\n\nattribute vec2 a_position;\n\nuniform float u_time;\nuniform vec2 u_resolution;\n\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n} ";
var fragment_default$a = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Plasma effect parameters (optimized single-layer version)\n#define RADIAL_FREQUENCY 30.0      // Controls radial wave frequency\n#define ANGULAR_FREQUENCY 8.0      // Controls angular wave frequency\n#define TIME_SPEED 3.5             // Controls overall animation speed\n\n// Color mixing weights for RGB channels (red-only effect)\n#define RED_WEIGHT 1.0\n#define GREEN_WEIGHT 0.0\n#define BLUE_WEIGHT 0.0\n\n// Precomputed constants for optimization\n#define HALF 0.5                   // 0.5 for sin() offset\n#define ONE 1.0                    // 1.0 for alpha channel\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;        // Animation time\nuniform vec2 u_resolution;   // Screen resolution\nuniform bool u_invert;       // Whether to invert colors\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  // Normalize fragment coordinates to [0,1] range\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  \n  // Center coordinates around origin\n  vec2 p = uv - 0.5;\n  \n  // Convert to polar coordinates\n  float r = length(p);       // Distance from center\n  float a = atan(p.y, p.x);  // Angle from center\n  \n  // Precompute time phase to avoid redundant multiplication\n  float time_phase = u_time * TIME_SPEED;\n  \n  // Optimized plasma calculation: combine all wave components into single sin() call\n  // This reduces from 3 separate sin() calls to 1, improving performance\n  float combined = r * RADIAL_FREQUENCY + a * ANGULAR_FREQUENCY + time_phase;\n  float plasma = sin(combined) * HALF + HALF;\n  \n  // Apply color mixing (red-only effect for high contrast)\n  // Optimized: since GREEN_WEIGHT and BLUE_WEIGHT are 0.0, we can simplify\n  vec3 color = vec3(plasma, 0.0, 0.0);\n  \n  // Apply color inversion if enabled (optimized: use conditional assignment)\n  color = u_invert ? vec3(ONE) - color : color;\n  \n  // Output final color with full alpha\n  gl_FragColor = vec4(color, ONE);\n} ";
var plasmaOptimized = {
  vertex: vertex_default$a,
  fragment: fragment_default$a
};
var vertex_default$9 = "precision mediump float;\n\nattribute vec2 a_position;\n\nuniform float u_time;\nuniform vec2 u_resolution;\n\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}";
var fragment_default$9 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Plasma effect parameters (optimized single-layer version)\n#define RADIAL_FREQUENCY 30.0      // Controls radial wave frequency\n#define ANGULAR_FREQUENCY 8.0      // Controls angular wave frequency\n#define TIME_SPEED 3.5             // Controls overall animation speed\n\n// Color mixing weights for RGB channels (green-only effect)\n#define RED_WEIGHT 0.0\n#define GREEN_WEIGHT 1.0\n#define BLUE_WEIGHT 0.0\n\n// Precomputed constants for optimization\n#define HALF 0.5                   // 0.5 for sin() offset\n#define ONE 1.0                    // 1.0 for alpha channel\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;        // Animation time\nuniform vec2 u_resolution;   // Screen resolution\nuniform bool u_invert;       // Whether to invert colors\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  // Normalize fragment coordinates to [0,1] range\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n\n  // Center coordinates around origin\n  vec2 p = uv - 0.5;\n\n  // Convert to polar coordinates\n  float r = length(p);       // Distance from center\n  float a = atan(p.y, p.x);  // Angle from center\n\n  // Precompute time phase to avoid redundant multiplication\n  float time_phase = u_time * TIME_SPEED;\n\n  // Optimized plasma calculation: combine all wave components into single sin() call\n  // This reduces from 3 separate sin() calls to 1, improving performance\n  float combined = r * RADIAL_FREQUENCY + a * ANGULAR_FREQUENCY + time_phase;\n  float plasma = sin(combined) * HALF + HALF;\n\n  // Apply color mixing (green-only effect for high contrast)\n  // Optimized: since RED_WEIGHT and BLUE_WEIGHT are 0.0, we can simplify\n  vec3 color = vec3(0.0, plasma, 0.0);\n\n  // Apply color inversion if enabled (optimized: use conditional assignment)\n  color = u_invert ? vec3(ONE) - color : color;\n\n  // Output final color with full alpha\n  gl_FragColor = vec4(color, ONE);\n}";
var plasmaOptimizedGreen = {
  vertex: vertex_default$9,
  fragment: fragment_default$9
};
var vertex_default$8 = "precision mediump float;\n\nattribute vec2 a_position;\n\nuniform float u_time;\nuniform vec2 u_resolution;\n\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}";
var fragment_default$8 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Star field parameters\n#define STAR_LAYERS 1.0            // Number of star layers (depth)\n#define SPEED_BASE 0.8             // Base animation speed\n#define SPEED_LAYER_MULT 0.5       // Speed increase per layer\n#define SCALE_BASE 15.0            // Base grid scale for stars\n#define SCALE_LAYER_MULT 10.0      // Scale increase per layer\n#define Z_CYCLE_SPEED 0.3          // How fast stars cycle through depth\n\n// Star appearance\n#define STAR_SIZE 0.02             // Base star size\n#define STREAK_SIZE 0.1            // Size of star streak/trail\n#define STREAK_INTENSITY 0.3       // Brightness of streak effect\n#define CELL_OFFSET_RANGE 0.8      // Random position range within cell\n\n// Color configuration (dark golden)\n#define COLOR_BASE vec3(0.55, 0.25, 0.2)\n#define COLOR_DEPTH vec3(0.3, 0.2, 0.05)\n#define COLOR_DEPTH_BLEND 0.3      // How much depth affects color\n\n// Vignette\n#define VIGNETTE_STRENGTH 0.5      // Edge darkening intensity\n\n// Precomputed constants\n#define HASH_V vec2(127.1, 311.7)\n#define HASH_C 43758.5453\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;\nuniform vec2 u_resolution;\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  vec2 center = gl_FragCoord.xy / u_resolution - 0.5;\n  float time = u_time * SPEED_BASE;\n  vec3 col = vec3(0.0);\n\n  // Unrolled loop for 3 layers - eliminates loop overhead\n  float layerScale, z, zFade, persp, d, star, zBlend;\n  vec2 cellUV, cellID, cellPos, starOffset, sp;\n\n  // Layer 0\n  layerScale = SCALE_BASE;\n  cellUV = center * layerScale;\n  cellID = floor(cellUV);\n  cellPos = fract(cellUV) - 0.5;\n  starOffset = vec2(\n    fract(sin(dot(cellID * 1.3, HASH_V)) * HASH_C),\n    fract(sin(dot(cellID * 2.7, HASH_V)) * HASH_C)\n  ) - 0.5;\n  z = fract(fract(sin(dot(cellID, HASH_V)) * HASH_C) - time * Z_CYCLE_SPEED);\n  zFade = smoothstep(0.0, 0.1, z) * smoothstep(1.0, 0.3, z);\n  persp = 1.0 / (z * 2.0 + 0.1);\n  sp = (cellPos - starOffset * CELL_OFFSET_RANGE) * persp * 0.1;\n  d = length(sp);\n  star = smoothstep(STAR_SIZE * persp, 0.0, d) + smoothstep(STREAK_SIZE * persp, 0.0, d) * STREAK_INTENSITY * 0.5;\n  zBlend = 0.7 + z * COLOR_DEPTH_BLEND;\n  col += star * zFade * (COLOR_BASE * zBlend + COLOR_DEPTH * (1.0 - z));\n\n  // Layer 1\n  layerScale = SCALE_BASE + SCALE_LAYER_MULT;\n  cellUV = center * layerScale;\n  cellID = floor(cellUV);\n  cellPos = fract(cellUV) - 0.5;\n  starOffset = vec2(\n    fract(sin(dot(cellID * 1.3 + 1.0, HASH_V)) * HASH_C),\n    fract(sin(dot(cellID * 2.7 + 1.0, HASH_V)) * HASH_C)\n  ) - 0.5;\n  z = fract(fract(sin(dot(cellID + 100.0, HASH_V)) * HASH_C) - time * Z_CYCLE_SPEED * (1.0 + SPEED_LAYER_MULT));\n  zFade = smoothstep(0.0, 0.1, z) * smoothstep(1.0, 0.3, z);\n  persp = 1.0 / (z * 2.0 + 0.1);\n  sp = (cellPos - starOffset * CELL_OFFSET_RANGE) * persp * 0.1;\n  d = length(sp);\n  star = smoothstep(STAR_SIZE * persp, 0.0, d) + smoothstep(STREAK_SIZE * persp, 0.0, d) * STREAK_INTENSITY * 0.5;\n  zBlend = 0.7 + z * COLOR_DEPTH_BLEND;\n  col += star * zFade * (COLOR_BASE * zBlend + COLOR_DEPTH * (1.0 - z));\n\n  // Layer 2\n  layerScale = SCALE_BASE + SCALE_LAYER_MULT * 2.0;\n  cellUV = center * layerScale;\n  cellID = floor(cellUV);\n  cellPos = fract(cellUV) - 0.5;\n  starOffset = vec2(\n    fract(sin(dot(cellID * 1.3 + 2.0, HASH_V)) * HASH_C),\n    fract(sin(dot(cellID * 2.7 + 2.0, HASH_V)) * HASH_C)\n  ) - 0.5;\n  z = fract(fract(sin(dot(cellID + 200.0, HASH_V)) * HASH_C) - time * Z_CYCLE_SPEED * (1.0 + SPEED_LAYER_MULT * 2.0));\n  zFade = smoothstep(0.0, 0.1, z) * smoothstep(1.0, 0.3, z);\n  persp = 1.0 / (z * 2.0 + 0.1);\n  sp = (cellPos - starOffset * CELL_OFFSET_RANGE) * persp * 0.1;\n  d = length(sp);\n  star = smoothstep(STAR_SIZE * persp, 0.0, d) + smoothstep(STREAK_SIZE * persp, 0.0, d) * STREAK_INTENSITY * 0.5;\n  zBlend = 0.7 + z * COLOR_DEPTH_BLEND;\n  col += star * zFade * (COLOR_BASE * zBlend + COLOR_DEPTH * (1.0 - z));\n\n  // Vignette\n  col *= 1.0 - length(center) * VIGNETTE_STRENGTH;\n\n  gl_FragColor = vec4(col, 1.0);\n}";
var starfield = {
  vertex: vertex_default$8,
  fragment: fragment_default$8
};
var vertex_default$7 = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}\n";
var fragment_default$7 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n\n// Swirl effect parameters\n#define SWIRL_BASE_STRENGTH 2.0    // Base strength of swirl effect\n#define SWIRL_SPEED 0.1            // Speed of swirl animation\n\n// Noise generation parameters\n#define NOISE_SCALE 3.0            // Scale factor for noise coordinates\n#define NOISE_OCTAVES 4            // Number of noise octaves for fractal noise\n#define NOISE_AMPLITUDE 0.5        // Initial noise amplitude\n#define NOISE_FREQUENCY 1.0        // Initial noise frequency\n#define NOISE_PERSISTENCE 0.5      // Noise amplitude decay per octave\n#define NOISE_LACUNARITY 2.0       // Noise frequency increase per octave\n\n// Color parameters\n#define NOISE_POWER 2.0            // Power curve for noise variation\n#define NOISE_OPACITY 0.8          // Opacity multiplier for noise\n\n// Hash function constants\n#define HASH_CONST_1 127.1         // Hash function constant 1\n#define HASH_CONST_2 311.7         // Hash function constant 2\n#define HASH_MULTIPLIER 43758.5453 // Hash function multiplier\n\n// Mathematical constants\n#define HALF 0.5                   // 0.5 for centering\n#define ONE 1.0                    // 1.0 for full values\n#define TWO 2.0                    // 2.0 for doubling\n#define THREE 3.0                  // 3.0 for cubic smoothing\n#define ZERO 0.0                   // 0.0 for zero values\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;        // Animation time\nuniform vec2 u_resolution;   // Screen resolution\nuniform vec3 u_color;        // Base color for the effect\n\n// ============================================================================\n// UTILITY FUNCTIONS\n// ============================================================================\n\n// Simple hash function for noise generation\nfloat hash(vec2 p) {\n  return fract(sin(dot(p, vec2(HASH_CONST_1, HASH_CONST_2))) * HASH_MULTIPLIER);\n}\n\n// Smooth interpolation using cubic smoothing\nfloat smoothNoise(vec2 p) {\n  vec2 i = floor(p);           // Integer part for grid lookup\n  vec2 f = fract(p);           // Fractional part for interpolation\n  f = f * f * (THREE - TWO * f); // Cubic smoothing function\n  \n  // Sample noise at four corners of the grid cell\n  float a = hash(i);\n  float b = hash(i + vec2(ONE, ZERO));\n  float c = hash(i + vec2(ZERO, ONE));\n  float d = hash(i + vec2(ONE, ONE));\n  \n  // Bilinear interpolation\n  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\n// Fractal noise for organic texture generation\nfloat fractalNoise(vec2 p) {\n  float value = ZERO;\n  float amplitude = NOISE_AMPLITUDE;\n  float frequency = NOISE_FREQUENCY;\n  \n  // Generate multiple octaves of noise for fractal detail\n  for(int i = 0; i < NOISE_OCTAVES; i++) {\n    value += amplitude * smoothNoise(p * frequency);\n    amplitude *= NOISE_PERSISTENCE;  // Decrease amplitude each octave\n    frequency *= NOISE_LACUNARITY;   // Increase frequency each octave\n  }\n  \n  return value;\n}\n\n// Create swirl effect using rotation matrix with continuous inwards movement\nvec2 swirl(vec2 p, float strength, float time) {\n  float angle = length(p) * strength + time;\n  float c = cos(angle);\n  float s = sin(angle);\n  mat2 rotation = mat2(c, -s, s, c);\n  return rotation * p;\n}\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  // Normalize fragment coordinates to [0,1] range\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  \n  // Center coordinates and scale to [-1,1] range\n  vec2 p = (uv - HALF) * TWO;\n  \n  // Create gentle swirl effect with continuous inwards movement\n  p = swirl(p, SWIRL_BASE_STRENGTH, u_time * SWIRL_SPEED);\n  \n  // Scale coordinates for noise generation\n  p *= NOISE_SCALE;\n  \n  // Generate fractal noise\n  float noise = fractalNoise(p);\n  \n  // Apply power curve for subtle variations\n  noise = pow(noise, NOISE_POWER);\n\n  // Define color palette (use uniform color and black)\n  vec3 black = vec3(ZERO, ZERO, ZERO);\n\n  // Mix between black and the palette color based on noise\n  vec3 color = mix(black, u_color, noise * NOISE_OPACITY);\n\n  // Output final color with full alpha\n  gl_FragColor = vec4(color, ONE);\n}\n";
var swirlyNoise = {
  vertex: vertex_default$7,
  fragment: fragment_default$7
};
var vertex_default$6 = "attribute vec2 a_position;\n\nvoid main() {\n    gl_Position = vec4(a_position, 0.0, 1.0);\n}\n";
var fragment_default$6 = "precision highp float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Motion parameters\n#define INWARD_SPEED 2.0                // Base speed of inward vortex motion\n#define MAX_SPEED_MULTIPLIER 6.0        // Maximum speed multiplier at peak\n#define ROTATION_SPEED 1.5              // Base rotation speed for spiral\n#define ROTATION_SEED_MIN 0.7           // Minimum rotation multiplier (70%)\n#define ROTATION_SEED_RANGE 0.6         // Range for rotation variation (70%-130%)\n\n// Seed-based frequency ranges\n#define SEED1_FREQ_BASE 3.0             // Base frequency for seed1 patterns\n#define SEED1_FREQ_RANGE 15.0           // Frequency range (3-18)\n#define SEED2_FREQ_BASE 4.0             // Base frequency for seed2 patterns\n#define SEED2_FREQ_RANGE 20.0           // Frequency range (4-24)\n#define SEED_OFFSET_SCALE 100.0         // Scale for phase offsets\n\n// Noise characteristic ranges\n#define SMOOTHNESS_BASE 0.5             // Base smoothness value\n#define SMOOTHNESS_RANGE 1.0            // Smoothness range (0.5-1.5)\n#define TILE_SIZE1_BASE 5.0             // Base tile size for seed1\n#define TILE_SIZE1_RANGE 15.0           // Tile size range (5-20)\n#define TILE_SIZE2_BASE 4.0             // Base tile size for seed2\n#define TILE_SIZE2_RANGE 12.0           // Tile size range (4-16)\n\n// Pattern layer weights\n#define LAYER_BASE_WEIGHT 0.25          // Base weight for pattern layers\n#define LAYER_CHAOS_WEIGHT 0.15         // Additional weight from chaos\n#define LAYER3_BASE_WEIGHT 0.2          // Layer 3 specific base weight\n#define LAYER3_CHAOS_WEIGHT 0.2         // Layer 3 chaos weight\n#define LAYER4_BASE_WEIGHT 0.3          // Layer 4 base weight\n#define LAYER4_CHAOS_WEIGHT 0.3         // Layer 4 chaos weight\n#define LAYER5_CHAOS_WEIGHT 0.4         // Layer 5 chaos weight multiplier\n\n// Warp effect multipliers\n#define WARP1_CHAOS_SCALE 0.5           // Warp1 chaos intensity scale\n#define WARP1_STRENGTH_BASE 1.0         // Warp1 base strength\n#define WARP1_STRENGTH_CHAOS 3.0        // Warp1 chaos multiplier\n#define WARP2_STRENGTH_BASE 0.5         // Warp2 base strength\n#define WARP2_STRENGTH_CHAOS 2.0        // Warp2 chaos multiplier\n#define WARP3_THRESHOLD 0.7             // Complexity threshold for warp3\n#define WARP3_MULTIPLIER 3.33           // Warp3 intensity multiplier\n#define WARP3_STRENGTH 1.5              // Warp3 displacement strength\n\n// Turbulence parameters\n#define TURB_THRESHOLD 0.6              // Complexity threshold for turbulence\n#define TURB_MULTIPLIER 2.5             // Turbulence pattern multiplier\n#define TURB_OCTAVE1_WEIGHT 0.5         // First octave weight\n#define TURB_OCTAVE2_WEIGHT 0.25        // Second octave weight\n#define TURB_OCTAVE3_WEIGHT 0.125       // Third octave weight\n#define TURB_OCTAVE2_FREQ 2.3           // Second octave frequency\n#define TURB_OCTAVE3_FREQ 5.1           // Third octave frequency\n\n// Madness layer parameters\n#define MAD_THRESHOLD 0.8               // Complexity threshold for madness\n#define MAD_MULTIPLIER 5.0              // Madness intensity multiplier\n#define MAD_FEEDBACK_FREQ 3.7           // Feedback frequency multiplier\n#define MAD_FEEDBACK_SCALE 10.0         // Feedback displacement scale\n#define MAD_PATTERN_WEIGHT 0.6          // Madness pattern weight\n\n// Contrast and color parameters\n#define CONTRAST_BASE 1.5               // Base contrast power\n#define CONTRAST_CHAOS_RANGE 1.5        // Contrast chaos range (1.5-3.0)\n#define SMOOTH_LOW_BASE 0.2             // Base smoothstep lower bound\n#define SMOOTH_LOW_CHAOS_OFFSET 0.15    // Chaos offset for lower bound\n#define SMOOTH_HIGH_BASE 0.9            // Base smoothstep upper bound\n#define SMOOTH_HIGH_CHAOS_OFFSET 0.1    // Chaos offset for upper bound\n#define COLOR_THRESHOLD_1 0.33          // First color transition threshold\n#define COLOR_THRESHOLD_2 0.66          // Second color transition threshold\n#define COLOR_SCALE 3.0                 // Color interpolation scale\n\n// Pulse parameters\n#define PULSE_FREQ_BASE 2.0             // Base pulse frequency\n#define PULSE_FREQ_CHAOS 6.0            // Chaos pulse frequency range (2-8 Hz)\n#define PULSE_AMOUNT_BASE 0.3           // Base pulse amount\n#define PULSE_AMOUNT_CHAOS 0.5          // Chaos pulse amount range (0.3-0.8)\n#define PULSE_BRIGHTNESS_BASE 1.3       // Base brightness multiplier\n#define PULSE_BRIGHTNESS_CHAOS 0.7      // Chaos brightness range\n\n// Color shift parameters\n#define COLOR_SHIFT_THRESHOLD 0.7       // Complexity threshold for color shift\n#define COLOR_SHIFT_MULTIPLIER 3.33     // Color shift intensity multiplier\n#define COLOR_SHIFT_MIX 0.3             // Color channel mix amount\n\n// Intensity parameters\n#define INTENSITY_BASE 0.6              // Base intensity\n#define INTENSITY_COMPLEXITY 0.6        // Complexity intensity contribution\n#define INTENSITY_CHAOS 0.2             // Chaos intensity contribution\n\n// Hash function constants\n#define HASH_MULTIPLIER1 0.1031         // Hash multiplier 1\n#define HASH_MULTIPLIER2 0.1030         // Hash multiplier 2\n#define HASH_MULTIPLIER3 0.0973         // Hash multiplier 3\n#define HASH_OFFSET 33.33               // Hash offset value\n\n// Mathematical constants\n#define PI 3.14159265359                // Pi constant\n#define TWO_PI 6.28318530718            // 2 * Pi\n#define HALF 0.5                        // 0.5 constant\n#define ONE 1.0                         // 1.0 constant\n#define TWO 2.0                         // 2.0 constant\n#define THREE 3.0                       // 3.0 constant\n#define ZERO 0.0                        // 0.0 constant\n#define EPSILON 0.001                   // Small value to prevent singularities\n\n// Noise mode thresholds\n#define NOISE_MODE1_THRESHOLD 0.5       // Threshold for rotated noise mode\n#define NOISE_MODE2_RIDGED 0.66         // Threshold for ridged noise mode\n#define NOISE_MODE2_CELLULAR 0.33       // Threshold for cellular noise mode\n\n// Seed mixing constants\n#define SEED_MIX1 7.0                   // First seed mixing value\n#define SEED_MIX2 13.0                  // Second seed mixing value\n#define NOISE_MODE1_SEED 3.7            // Seed multiplier for noise mode 1\n#define NOISE_MODE2_SEED 5.3            // Seed multiplier for noise mode 2\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;                   // Current time in seconds\nuniform vec2 u_resolution;              // Screen resolution (width, height)\nuniform bool u_invert;                  // Color inversion toggle\nuniform float u_seed1;                  // First seed value (0-1)\nuniform float u_seed2;                  // Second seed value (0-1)\n\n// ============================================================================\n// HASH FUNCTIONS\n// ============================================================================\n\n// Hash function - single float to single float\nfloat hash11(float p) {\n    p = fract(p * HASH_MULTIPLIER1);\n    p *= p + HASH_OFFSET;\n    p *= p + p;\n    return fract(p);\n}\n\n// Hash function - vec2 to single float\nfloat hash12(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * HASH_MULTIPLIER1);\n    p3 += dot(p3, p3.yzx + HASH_OFFSET);\n    return fract((p3.x + p3.y) * p3.z);\n}\n\n// Hash function - vec2 to vec2\nvec2 hash22(vec2 p) {\n    vec3 p3 = fract(vec3(p.xyx) * vec3(HASH_MULTIPLIER1, HASH_MULTIPLIER2, HASH_MULTIPLIER3));\n    p3 += dot(p3, p3.yzx + HASH_OFFSET);\n    return fract((p3.xx + p3.yz) * p3.zy);\n}\n\n// ============================================================================\n// NOISE FUNCTIONS\n// ============================================================================\n\n// Basic noise function with variable interpolation smoothness\nfloat noise(vec2 p, float smoothness) {\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n\n    // Variable smoothness - changes the character of the noise\n    f = f * f * (THREE - TWO * f * smoothness);\n\n    // Sample noise at four corners of the grid cell\n    float a = hash12(i);\n    float b = hash12(i + vec2(ONE, ZERO));\n    float c = hash12(i + vec2(ZERO, ONE));\n    float d = hash12(i + vec2(ONE, ONE));\n\n    // Bilinear interpolation\n    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\n// Rotated noise - fundamentally different grid alignment per seed\nfloat rotatedNoise(vec2 p, float angle, float smoothness) {\n    float c = cos(angle);\n    float s = sin(angle);\n    mat2 rot = mat2(c, -s, s, c);\n    return noise(rot * p, smoothness);\n}\n\n// Domain-repeated noise - creates different tiling patterns\nfloat tiledNoise(vec2 p, float tileSize, float smoothness) {\n    return noise(mod(p, tileSize), smoothness);\n}\n\n// Ridged noise - creates sharp peaks (more geometric feel)\nfloat ridgedNoise(vec2 p, float smoothness) {\n    return ONE - abs(noise(p, smoothness) * TWO - ONE);\n}\n\n// Cellular/worley-like noise approximation\nfloat cellularNoise(vec2 p) {\n    vec2 i = floor(p);\n    vec2 f = fract(p);\n\n    float minDist = ONE;\n\n    // Check neighboring cells (3x3 grid)\n    for(int x = -1; x <= 1; x++) {\n        for(int y = -1; y <= 1; y++) {\n            vec2 neighbor = vec2(float(x), float(y));\n            vec2 point = hash22(i + neighbor);\n            vec2 diff = neighbor + point - f;\n            minDist = min(minDist, length(diff));\n        }\n    }\n\n    return minDist;\n}\n\n// ============================================================================\n// COLOR PALETTE FUNCTIONS\n// ============================================================================\n\n// Generate vibrant, high-contrast color from hue\nvec3 generatePaletteColor(float hue) {\n    vec3 color = vec3(\n        sin(hue),\n        sin(hue + 2.09),\n        sin(hue + 4.18)\n    );\n\n    // Make all components positive and normalize to brightest\n    color = abs(color);\n    float maxComponent = max(max(color.r, color.g), color.b);\n    return color / maxComponent;\n}\n\n// First palette color from seed1\nvec3 getPaletteColor1(float seed1, float seed2) {\n    return generatePaletteColor(seed1 * TWO_PI);\n}\n\n// Second palette color from seed2 - offset by 120 degrees for contrast\nvec3 getPaletteColor2(float seed1, float seed2) {\n    return generatePaletteColor(seed2 * TWO_PI + 2.09);\n}\n\n// Third palette color - offset by 240 degrees for maximum contrast\nvec3 getPaletteColor3(float seed1, float seed2) {\n    return generatePaletteColor(fract(seed1 + seed2) * TWO_PI + 4.18);\n}\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n    // Normalize coordinates to [-1, 1] range\n    vec2 uv = (gl_FragCoord.xy * TWO - u_resolution) / min(u_resolution.x, u_resolution.y);\n\n    // Time-based factors (pre-compute to avoid redundant calculations)\n    const float invMaxTime = ONE / 10.0;\n    float timeFactor = min(u_time * invMaxTime, ONE);\n    float speedMultiplier = ONE + timeFactor * (MAX_SPEED_MULTIPLIER - ONE);\n    float complexityFactor = timeFactor;\n    float chaosIntensity = complexityFactor * complexityFactor * complexityFactor;\n\n    // Convert to polar coordinates\n    float radius = max(length(uv), EPSILON); // Prevent singularity at center\n    float logRadius = log(radius);\n\n    // Spiral motion parameters\n    float spiralTime = u_time * INWARD_SPEED * speedMultiplier;\n    float rotationSpeed = ROTATION_SPEED * (ROTATION_SEED_MIN + u_seed1 * ROTATION_SEED_RANGE);\n    float rotation = logRadius * rotationSpeed + spiralTime;\n\n    // Create rotating coordinate system (single calculation)\n    float cosRot = cos(rotation);\n    float sinRot = sin(rotation);\n    vec2 rotatedUV = vec2(\n        uv.x * cosRot - uv.y * sinRot,\n        uv.x * sinRot + uv.y * cosRot\n    );\n\n    // Pre-compute seed-based parameters (hoisted out of conditionals)\n    float seed1Freq = SEED1_FREQ_BASE + u_seed1 * SEED1_FREQ_RANGE;\n    float seed2Freq = SEED2_FREQ_BASE + u_seed2 * SEED2_FREQ_RANGE;\n    float seedOffset1 = u_seed1 * SEED_OFFSET_SCALE;\n    float seedOffset2 = u_seed2 * SEED_OFFSET_SCALE;\n    float combinedSeed = fract(u_seed1 * SEED_MIX1 + u_seed2 * SEED_MIX2);\n\n    // Noise characteristics\n    float noiseRotation1 = u_seed1 * TWO_PI;\n    float noiseRotation2 = u_seed2 * TWO_PI;\n    float smoothness1 = SMOOTHNESS_BASE + u_seed1 * SMOOTHNESS_RANGE;\n    float smoothness2 = SMOOTHNESS_BASE + u_seed2 * SMOOTHNESS_RANGE;\n    float tileSize1 = TILE_SIZE1_BASE + u_seed1 * TILE_SIZE1_RANGE;\n    float tileSize2 = TILE_SIZE2_BASE + u_seed2 * TILE_SIZE2_RANGE;\n\n    // Determine noise modes (pre-compute booleans)\n    bool useRotatedNoise1 = fract(u_seed1 * NOISE_MODE1_SEED) > NOISE_MODE1_THRESHOLD;\n    bool useRidgedNoise = fract(u_seed2 * NOISE_MODE2_SEED) > NOISE_MODE2_RIDGED;\n    bool useCellularNoise = fract(u_seed2 * NOISE_MODE2_SEED) < NOISE_MODE2_CELLULAR;\n\n    // Coordinate warping - layer 1\n    vec2 warpCoord1 = rotatedUV * (TWO + combinedSeed * 4.0) + vec2(spiralTime * 0.3);\n    float warp1 = (useRotatedNoise1 ?\n        rotatedNoise(warpCoord1, noiseRotation1, smoothness1) :\n        tiledNoise(warpCoord1, tileSize1, smoothness1)) * chaosIntensity * WARP1_CHAOS_SCALE;\n\n    vec2 warpedUV = rotatedUV + vec2(warp1, -warp1) * (WARP1_STRENGTH_BASE + chaosIntensity * WARP1_STRENGTH_CHAOS);\n\n    // Coordinate warping - layer 2\n    vec2 warpCoord2 = warpedUV * (THREE + u_seed2 * 5.0) - vec2(spiralTime * HALF);\n    float warp2 = (useRidgedNoise ?\n        ridgedNoise(warpCoord2, smoothness2) :\n        (useCellularNoise ? cellularNoise(warpCoord2) : noise(warpCoord2, smoothness2))) * chaosIntensity;\n\n    warpedUV += vec2(sin(warp2 * TWO_PI), cos(warp2 * TWO_PI)) * (WARP2_STRENGTH_BASE + chaosIntensity * WARP2_STRENGTH_CHAOS);\n\n    // Coordinate warping - layer 3 (extreme chaos)\n    if (complexityFactor > WARP3_THRESHOLD) {\n        float warp3a = rotatedNoise(warpedUV * (10.0 + seedOffset1 * 0.1), noiseRotation2, smoothness1);\n        float warp3b = ridgedNoise(warpedUV * (8.0 + seedOffset2 * 0.1), smoothness2);\n        float warp3 = mix(warp3a, warp3b, combinedSeed) * (complexityFactor - WARP3_THRESHOLD) * WARP3_MULTIPLIER;\n        warpedUV += vec2(cos(warp3 * 12.0), sin(warp3 * 9.0)) * WARP3_STRENGTH;\n    }\n\n    // Pattern accumulation\n    float pattern = ZERO;\n\n    // Layer 1: Hyper-frequency rotating bands\n    float angularPattern1 = sin(warpedUV.x * seed1Freq + seedOffset1) + cos(warpedUV.y * seed1Freq + seedOffset1);\n    float bands = (angularPattern1 + logRadius * (ONE + u_seed1 * 8.0)) * HALF + HALF;\n    bands = sin(bands * (TWO + u_seed1 * 5.0 + chaosIntensity * 8.0)) * HALF + HALF;\n    pattern += bands * (LAYER_BASE_WEIGHT + chaosIntensity * LAYER_CHAOS_WEIGHT);\n\n    // Layer 2: Wildly varying radial rings\n    float ringFreq = (4.0 + u_seed2 * 12.0) * (ONE + chaosIntensity * THREE);\n    float rings = sin(logRadius * ringFreq - spiralTime * (ONE + chaosIntensity * TWO) + seedOffset2) * HALF + HALF;\n    pattern += rings * (LAYER_BASE_WEIGHT + chaosIntensity * LAYER_CHAOS_WEIGHT);\n\n    // Layer 3: Interfering angular segments\n    float segmentFreq = (5.0 + combinedSeed * 15.0) * (ONE + chaosIntensity * 8.0);\n    float phaseOffset = combinedSeed * TWO_PI + spiralTime * (ONE + chaosIntensity * THREE);\n    float angularPattern2 = sin(warpedUV.x * segmentFreq + phaseOffset) * cos(warpedUV.y * segmentFreq - phaseOffset);\n    pattern += (angularPattern2 * HALF + HALF) * (LAYER3_BASE_WEIGHT + chaosIntensity * LAYER3_CHAOS_WEIGHT);\n\n    // Layer 4: Multi-scale noise interference\n    vec2 noiseCoord1 = warpedUV * (TWO + u_seed1 * 4.0) + vec2(spiralTime * 0.4, seedOffset1 * 0.1);\n    float noiseScale1 = TWO + chaosIntensity * 6.0;\n    float noisePattern1 = useRidgedNoise ?\n        ridgedNoise(noiseCoord1 * noiseScale1, smoothness1) :\n        rotatedNoise(noiseCoord1 * noiseScale1, noiseRotation1, smoothness1);\n    pattern += noisePattern1 * (LAYER4_BASE_WEIGHT + chaosIntensity * LAYER4_CHAOS_WEIGHT);\n\n    // Layer 5: High-frequency noise chaos\n    vec2 noiseCoord2 = warpedUV * (6.0 + u_seed2 * 8.0) - vec2(spiralTime * 0.6, seedOffset2 * 0.1);\n    float noiseScale2 = ONE + chaosIntensity * 4.0;\n    float noisePattern2 = useCellularNoise ?\n        cellularNoise(noiseCoord2 * noiseScale2) :\n        tiledNoise(noiseCoord2 * noiseScale2, tileSize2, smoothness2);\n    pattern += noisePattern2 * chaosIntensity * LAYER5_CHAOS_WEIGHT;\n\n    // Layer 6: Extreme turbulence (conditional)\n    if (complexityFactor > TURB_THRESHOLD) {\n        vec2 turbCoord = warpedUV * (12.0 + combinedSeed * 20.0);\n        vec2 spiralVec = vec2(spiralTime);\n\n        float turbulence = (useRotatedNoise1 ?\n            rotatedNoise(turbCoord + spiralVec, noiseRotation1, smoothness1) * TURB_OCTAVE1_WEIGHT +\n            ridgedNoise(turbCoord * TURB_OCTAVE2_FREQ - spiralVec * 1.4, smoothness2) * TURB_OCTAVE2_WEIGHT :\n            tiledNoise(turbCoord + spiralVec, tileSize1, smoothness1) * TURB_OCTAVE1_WEIGHT +\n            noise(turbCoord * TURB_OCTAVE2_FREQ - spiralVec * 1.4, smoothness2) * TURB_OCTAVE2_WEIGHT) +\n            cellularNoise(turbCoord * TURB_OCTAVE3_FREQ + spiralVec * 0.8) * TURB_OCTAVE3_WEIGHT;\n\n        pattern += turbulence * (complexityFactor - TURB_THRESHOLD) * TURB_MULTIPLIER;\n    }\n\n    // Layer 7: Complete madness (conditional)\n    if (complexityFactor > MAD_THRESHOLD) {\n        float madness = (complexityFactor - MAD_THRESHOLD) * MAD_MULTIPLIER;\n        vec2 madCoord = warpedUV * (20.0 + seedOffset1 * HALF) + vec2(spiralTime * TWO, -spiralTime * 1.5);\n\n        float mad1, mad2;\n        if (useRidgedNoise) {\n            mad1 = ridgedNoise(madCoord, smoothness1);\n            mad2 = cellularNoise(madCoord * MAD_FEEDBACK_FREQ + vec2(mad1 * MAD_FEEDBACK_SCALE));\n        } else if (useCellularNoise) {\n            mad1 = cellularNoise(madCoord);\n            mad2 = rotatedNoise(madCoord * MAD_FEEDBACK_FREQ + vec2(mad1 * MAD_FEEDBACK_SCALE), noiseRotation2, smoothness2);\n        } else {\n            mad1 = rotatedNoise(madCoord, noiseRotation1, smoothness1);\n            mad2 = ridgedNoise(madCoord * MAD_FEEDBACK_FREQ + vec2(mad1 * MAD_FEEDBACK_SCALE), smoothness2);\n        }\n\n        pattern += (mad1 * mad2 + HALF) * madness * MAD_PATTERN_WEIGHT;\n    }\n\n    // Normalize and apply contrast\n    pattern = clamp(pattern, ZERO, ONE);\n    pattern = pow(pattern, CONTRAST_BASE + chaosIntensity * CONTRAST_CHAOS_RANGE);\n    pattern = smoothstep(\n        SMOOTH_LOW_BASE - chaosIntensity * SMOOTH_LOW_CHAOS_OFFSET,\n        SMOOTH_HIGH_BASE + chaosIntensity * SMOOTH_HIGH_CHAOS_OFFSET,\n        pattern\n    );\n\n    // Get color palette (pre-compute outside of conditional)\n    vec3 paletteColor1 = getPaletteColor1(u_seed1, u_seed2);\n    vec3 paletteColor2 = getPaletteColor2(u_seed1, u_seed2);\n    vec3 paletteColor3 = getPaletteColor3(u_seed1, u_seed2);\n\n    // Map pattern to colors\n    vec3 finalColor;\n    if (pattern < COLOR_THRESHOLD_1) {\n        finalColor = mix(vec3(ZERO), paletteColor1, pattern * COLOR_SCALE);\n    } else if (pattern < COLOR_THRESHOLD_2) {\n        finalColor = mix(paletteColor1, paletteColor2, (pattern - COLOR_THRESHOLD_1) * COLOR_SCALE);\n    } else {\n        finalColor = mix(paletteColor2, paletteColor3, (pattern - COLOR_THRESHOLD_2) * COLOR_SCALE);\n    }\n\n    // Add pulsing intensity\n    float pulseFreq = PULSE_FREQ_BASE + chaosIntensity * PULSE_FREQ_CHAOS;\n    float pulse = sin(u_time * pulseFreq + pattern * PI) * HALF + HALF;\n    float pulseAmount = PULSE_AMOUNT_BASE + chaosIntensity * PULSE_AMOUNT_CHAOS;\n    finalColor = mix(finalColor, finalColor * (PULSE_BRIGHTNESS_BASE + chaosIntensity * PULSE_BRIGHTNESS_CHAOS), pulse * pulseAmount);\n\n    // Color shifting chaos at extreme complexity\n    if (chaosIntensity > COLOR_SHIFT_THRESHOLD) {\n        float colorShift = (chaosIntensity - COLOR_SHIFT_THRESHOLD) * COLOR_SHIFT_MULTIPLIER;\n        finalColor.rgb = finalColor.brg * (ONE - colorShift * COLOR_SHIFT_MIX) + finalColor.rgb * (colorShift * COLOR_SHIFT_MIX);\n    }\n\n    // Overall intensity\n    finalColor *= INTENSITY_BASE + complexityFactor * INTENSITY_COMPLEXITY + chaosIntensity * INTENSITY_CHAOS;\n\n    // Invert if needed\n    if (u_invert) {\n        finalColor = vec3(ONE) - finalColor;\n    }\n\n    gl_FragColor = vec4(finalColor, ONE);\n}\n";
var tripProcessing = {
  vertex: vertex_default$6,
  fragment: fragment_default$6
};
var vertex_default$5 = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}\n";
var fragment_default$5 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Zoom effect parameters\n#define ZOOM_POWER 1.5             // Power curve for zoom acceleration\n#define ZOOM_INTENSITY 0.3         // Zoom intensity multiplier\n\n// Time-based intensity parameters\n#define INTENSITY_PEAK_TIME 8.0    // Time in seconds when intensity peaks\n#define INTENSITY_POWER 0.3        // Power curve for intensity ramp-up\n\n// Pattern frequency parameters\n#define NUM_HOR_BANDS 10.0         // Number of horizontal bands\n#define NUM_RINGS 5.0              // Number of radial rings\n#define NUM_ARMS 6.0               // Number of spiral arms\n\n// Spiral parameters\n#define SPIRAL_ANGLE 1.047197551   // π/3 radians (60 degrees)\n\n// Color parameters\n#define COLOR_AMPLITUDE 0.75       // Amplitude for color oscillation\n#define COLOR_SPEED 3.0            // Speed of color animation\n\n// Mathematical constants\n#define PI 3.14159265359           // π constant\n#define HALF 0.5                   // 0.5 for centering\n#define ONE 1.0                    // 1.0 for full values\n#define TWO 2.0                    // 2.0 for doubling\n#define ZERO 0.0                   // 0.0 for zero values\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;        // Animation time\nuniform vec2 u_resolution;   // Screen resolution\nuniform bool u_invert;       // Whether to invert colors\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n    // Normalize fragment coordinates to [0,1] range\n    vec2 position = gl_FragCoord.xy / u_resolution;\n    \n    // Apply zoom in effect with acceleration over time\n    float zoomFactor = ONE + pow(u_time, ZOOM_POWER) * ZOOM_INTENSITY;\n    vec2 center = vec2(HALF, HALF);\n    position = center + (position - center) / zoomFactor;\n\n    // Center coordinates around origin\n    float cX = position.x - HALF;\n    float cY = position.y - HALF;\n\n    // Convert to log-polar coordinates for spiral effects\n    float newX = log(sqrt(cX*cX + cY*cY));  // Radial distance (log scale)\n    float newY = atan(cX, cY);              // Angular position\n     \n    // Calculate time-based intensity multiplier with exponential ramp-up\n    float normalizedTime = min(u_time / INTENSITY_PEAK_TIME, ONE);\n    float intensityMultiplier = pow(normalizedTime, INTENSITY_POWER);\n    \n    // Initialize color accumulator\n    float color = ZERO;\n    \n    // Add horizontal bands pattern\n    color += cos(NUM_HOR_BANDS * cX - u_time * intensityMultiplier);\n    \n    // Add radial rings pattern\n    color += cos(NUM_RINGS * newX - u_time * intensityMultiplier);\n    \n    // Add spiral arms pattern\n    color += cos(TWO * NUM_ARMS * (newX * sin(SPIRAL_ANGLE) + newY * cos(SPIRAL_ANGLE)) + u_time * intensityMultiplier);\n    \n    // Create final color with animated RGB components\n    vec3 finalColor = vec3(\n        sin(color + u_time / COLOR_SPEED * intensityMultiplier) * COLOR_AMPLITUDE,  // Red\n        color,                                                                      // Green\n        sin(color + u_time / COLOR_SPEED * intensityMultiplier) * COLOR_AMPLITUDE   // Blue\n    );\n    \n    // Apply color inversion if enabled (optimized: use conditional assignment)\n    finalColor = u_invert ? vec3(ONE) - finalColor : finalColor;\n    \n    // Output final color with full alpha\n    gl_FragColor = vec4(finalColor, ONE);\n}\n";
var vortex = {
  vertex: vertex_default$5,
  fragment: fragment_default$5
};
var black = {
  vertex: `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`,
  fragment: `
precision mediump float;
uniform vec2 u_resolution;
uniform float u_time;
uniform bool u_invert;

void main() {
  gl_FragColor = u_invert ? vec4(1.0, 1.0, 1.0, 1.0) : vec4(0.0, 0.0, 0.0, 1.0);
}
`
};
var vertex_default$4 = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n} ";
var fragment_default$4 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// CRT effect parameters\n#define SCANLINE_INTENSITY 0.1            // Intensity of horizontal scanlines\n#define SCANLINE_SPEED 0.015              // Speed of scanline animation\n#define CHROMATIC_ABERRATION 0.0002       // Amount of chromatic aberration\n#define CHROMATIC_ABERRATION_SCALED 0.02  // Pre-scaled aberration value\n\n// Sky gradient colors\n#define SKY_COLOR_TOP_R 1.0        // Top sky color - Red component\n#define SKY_COLOR_TOP_G 0.2        // Top sky color - Green component  \n#define SKY_COLOR_TOP_B 0.5        // Top sky color - Blue component\n#define SKY_COLOR_BOTTOM_R 0.6     // Bottom sky color - Red component\n#define SKY_COLOR_BOTTOM_G 0.6     // Bottom sky color - Green component\n#define SKY_COLOR_BOTTOM_B 0.6     // Bottom sky color - Blue component\n\n// Cloud layer scaling factors\n#define CLOUD_SCALE_1 1.0          // Primary cloud layer scale\n#define CLOUD_SCALE_2 0.7          // Secondary cloud layer scale\n#define CLOUD_SCALE_3 0.5          // Tertiary cloud layer scale\n\n// Cloud animation parameters\n#define CLOUD_SPEED_1 0.2          // Primary cloud layer animation speed\n#define CLOUD_SPEED_2 0.1          // Secondary cloud layer animation speed\n#define CLOUD_SPEED_3 0.35         // Tertiary cloud layer animation speed\n\n// Cloud generation parameters\n#define CLOUD_FREQ_1 3.0           // Primary cloud layer frequency\n#define CLOUD_FREQ_2 5.0           // Secondary cloud layer frequency\n#define CLOUD_FREQ_3 2.0           // Tertiary cloud layer frequency\n\n// Cloud appearance parameters\n#define CLOUD_THRESHOLD_LOW 0.4    // Lower threshold for cloud visibility\n#define CLOUD_THRESHOLD_HIGH 0.6   // Upper threshold for cloud visibility\n#define CLOUD_OPACITY 0.9          // Cloud opacity multiplier\n#define SCANLINE_FREQ 0.7          // Scanline frequency multiplier\n\n// Noise generation parameters\n#define NOISE_OCTAVES 4            // Number of noise octaves for fractal noise\n#define NOISE_AMPLITUDE 0.5        // Initial noise amplitude\n#define NOISE_FREQUENCY 1.0        // Initial noise frequency\n#define NOISE_PERSISTENCE 0.5      // Noise amplitude decay per octave\n#define NOISE_LACUNARITY 2.0       // Noise frequency increase per octave\n\n// Hash function constants\n#define HASH_CONST_1 127.1         // Hash function constant 1\n#define HASH_CONST_2 311.7         // Hash function constant 2\n#define HASH_MULTIPLIER 43758.5453 // Hash function multiplier\n\n// Brightness control\n#define BRIGHTNESS 1.0             // Overall brightness multiplier (0.0 = black, 1.0 = normal, >1.0 = brighter)\n\n// Precomputed constants for optimization\n#define HALF 0.5                   // 0.5 for sin() offset\n#define ONE 1.0                    // 1.0 for alpha channel\n#define ZERO 0.0                   // 0.0 for zero values\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;        // Animation time\nuniform vec2 u_resolution;   // Screen resolution\nuniform bool u_invert;       // Whether to invert colors\n\n// ============================================================================\n// UTILITY FUNCTIONS\n// ============================================================================\n\n// Simple hash function for noise generation\nfloat hash(vec2 p) {\n  return fract(sin(dot(p, vec2(HASH_CONST_1, HASH_CONST_2))) * HASH_MULTIPLIER);\n}\n\n// Smooth interpolation using cubic smoothing\nfloat smoothNoise(vec2 p) {\n  vec2 i = floor(p);           // Integer part for grid lookup\n  vec2 f = fract(p);           // Fractional part for interpolation\n  f = f * f * (3.0 - 2.0 * f); // Cubic smoothing function\n  \n  // Sample noise at four corners of the grid cell\n  float a = hash(i);\n  float b = hash(i + vec2(1.0, 0.0));\n  float c = hash(i + vec2(0.0, 1.0));\n  float d = hash(i + vec2(1.0, 1.0));\n  \n  // Bilinear interpolation\n  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\n// Fractal noise for realistic cloud generation\nfloat fractalNoise(vec2 p) {\n  float value = 0.0;\n  float amplitude = NOISE_AMPLITUDE;\n  float frequency = NOISE_FREQUENCY;\n  \n  // Generate multiple octaves of noise for fractal detail\n  for(int i = 0; i < NOISE_OCTAVES; i++) {\n    value += amplitude * smoothNoise(p * frequency);\n    amplitude *= NOISE_PERSISTENCE;  // Decrease amplitude each octave\n    frequency *= NOISE_LACUNARITY;   // Increase frequency each octave\n  }\n  \n  return value;\n}\n\n// ============================================================================\n// CRT EFFECT FUNCTIONS\n// ============================================================================\n\n// Generate horizontal scanlines for CRT effect\nfloat crtScanlines(vec2 uv) {\n  // Create slowly rolling horizontal scanlines\n  float scanline = sin((uv.y + u_time * SCANLINE_SPEED) * u_resolution.y * SCANLINE_FREQ) * HALF + HALF;\n  return ONE - scanline * SCANLINE_INTENSITY;\n}\n\n// Apply chromatic aberration and generate clouds for each color channel\nvec3 crtChromaticAberration(vec2 uv, vec3 color) {\n  // Apply chromatic aberration by sampling different UV offsets for each color channel\n  float aberration = CHROMATIC_ABERRATION_SCALED;\n  \n  // Calculate center offset once and reuse\n  lowp vec2 centerOffset = normalize(uv - HALF);\n  lowp vec2 offsetR = centerOffset * aberration;\n  lowp vec2 offsetB = centerOffset * aberration;\n  \n  // Use UV coordinates directly without curvature\n  lowp vec2 uvR = clamp(uv + offsetR, ZERO, ONE);\n  lowp vec2 uvG = uv;\n  lowp vec2 uvB = clamp(uv - offsetB, ZERO, ONE);\n  \n  // Precompute time-based phases to avoid redundant multiplications\n  float time_phase1 = u_time * CLOUD_SPEED_1;\n  float time_phase2 = u_time * CLOUD_SPEED_2;\n  float time_phase3 = u_time * CLOUD_SPEED_3;\n  \n  // Sample cloud positions at different UV positions for each channel\n  vec2 cloudPos1R = uvR * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);\n  vec2 cloudPos2R = uvR * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);\n  vec2 cloudPos3R = uvR * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);\n  \n  vec2 cloudPos1G = uvG * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);\n  vec2 cloudPos2G = uvG * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);\n  vec2 cloudPos3G = uvG * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);\n  \n  vec2 cloudPos1B = uvB * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);\n  vec2 cloudPos2B = uvB * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);\n  vec2 cloudPos3B = uvB * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);\n  \n  // Generate cloud noise for red channel\n  float cloud1R = fractalNoise(cloudPos1R);\n  float cloud2R = fractalNoise(cloudPos2R);\n  float cloud3R = fractalNoise(cloudPos3R);\n  float cloudsR = max(cloud1R * CLOUD_SCALE_1, max(cloud2R * CLOUD_SCALE_2, cloud3R * CLOUD_SCALE_3));\n  cloudsR = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, cloudsR);\n  \n  // Generate cloud noise for green channel\n  float cloud1G = fractalNoise(cloudPos1G);\n  float cloud2G = fractalNoise(cloudPos2G);\n  float cloud3G = fractalNoise(cloudPos3G);\n  float cloudsG = max(cloud1G * CLOUD_SCALE_1, max(cloud2G * CLOUD_SCALE_2, cloud3G * CLOUD_SCALE_3));\n  cloudsG = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, cloudsG);\n  \n  // Generate cloud noise for blue channel\n  float cloud1B = fractalNoise(cloudPos1B);\n  float cloud2B = fractalNoise(cloudPos2B);\n  float cloud3B = fractalNoise(cloudPos3B);\n  float cloudsB = max(cloud1B * CLOUD_SCALE_1, max(cloud2B * CLOUD_SCALE_2, cloud3B * CLOUD_SCALE_3));\n  cloudsB = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, cloudsB);\n  \n  // Precompute sky color vectors to avoid redundant vec3 constructions\n  vec3 skyColorTop = vec3(SKY_COLOR_TOP_R, SKY_COLOR_TOP_G, SKY_COLOR_TOP_B);\n  vec3 skyColorBottom = vec3(SKY_COLOR_BOTTOM_R, SKY_COLOR_BOTTOM_G, SKY_COLOR_BOTTOM_B);\n  \n  // Sample sky colors for each channel using pre-calculated constants\n  vec3 skyColorR = mix(skyColorTop, skyColorBottom, uvR.y);\n  vec3 skyColorG = mix(skyColorTop, skyColorBottom, uvG.y);\n  vec3 skyColorB = mix(skyColorTop, skyColorBottom, uvB.y);\n  \n  // Mix sky and clouds for each channel\n  float r = mix(skyColorR.r, ONE, cloudsR * CLOUD_OPACITY);\n  float g = mix(skyColorG.g, ONE, cloudsG * CLOUD_OPACITY);\n  float b = mix(skyColorB.b, ONE, cloudsB * CLOUD_OPACITY);\n  \n  return vec3(r, g, b);\n}\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  // Normalize fragment coordinates to [0,1] range\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  \n  // Apply CRT effects with chromatic aberration (which now handles all the cloud generation)\n  vec3 color = crtChromaticAberration(uv, vec3(ZERO));\n  \n  // Apply remaining CRT effects\n  color *= crtScanlines(uv);\n  \n  // Apply color inversion if enabled (optimized: use conditional assignment)\n  color = u_invert ? vec3(ONE) - color : color;\n  \n  // Apply brightness control\n  color *= BRIGHTNESS;\n  \n  // Output final color with full alpha\n  gl_FragColor = vec4(color, ONE);\n} ";
var clouds = {
  vertex: vertex_default$4,
  fragment: fragment_default$4
};
var vertex_default$3 = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}";
var fragment_default$3 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// CRT effect parameters\n#define SCANLINE_INTENSITY 0.08           // Intensity of horizontal scanlines\n#define SCANLINE_SPEED 0.015              // Speed of scanline animation\n#define CHROMATIC_ABERRATION 0.0002       // Amount of chromatic aberration\n#define CHROMATIC_ABERRATION_SCALED 0.01  // Pre-scaled aberration value (reduced for B&W)\n\n// Sky gradient colors (grayscale)\n#define SKY_COLOR_TOP 0.15                // Top sky color (dark gray)\n#define SKY_COLOR_BOTTOM 0.35             // Bottom sky color (medium gray)\n\n// Cloud layer scaling factors\n#define CLOUD_SCALE_1 1.0          // Primary cloud layer scale\n#define CLOUD_SCALE_2 0.7          // Secondary cloud layer scale\n#define CLOUD_SCALE_3 0.5          // Tertiary cloud layer scale\n\n// Cloud animation parameters\n#define CLOUD_SPEED_1 0.15         // Primary cloud layer animation speed (slower)\n#define CLOUD_SPEED_2 0.08         // Secondary cloud layer animation speed\n#define CLOUD_SPEED_3 0.25         // Tertiary cloud layer animation speed\n\n// Cloud generation parameters\n#define CLOUD_FREQ_1 3.0           // Primary cloud layer frequency\n#define CLOUD_FREQ_2 5.0           // Secondary cloud layer frequency\n#define CLOUD_FREQ_3 2.0           // Tertiary cloud layer frequency\n\n// Cloud appearance parameters\n#define CLOUD_THRESHOLD_LOW 0.4    // Lower threshold for cloud visibility\n#define CLOUD_THRESHOLD_HIGH 0.6   // Upper threshold for cloud visibility\n#define CLOUD_OPACITY 0.6          // Cloud opacity multiplier (reduced for muted look)\n#define CLOUD_BRIGHTNESS 0.5       // Cloud brightness (gray clouds instead of white)\n#define SCANLINE_FREQ 0.7          // Scanline frequency multiplier\n\n// Noise generation parameters\n#define NOISE_OCTAVES 4            // Number of noise octaves for fractal noise\n#define NOISE_AMPLITUDE 0.5        // Initial noise amplitude\n#define NOISE_FREQUENCY 1.0        // Initial noise frequency\n#define NOISE_PERSISTENCE 0.5      // Noise amplitude decay per octave\n#define NOISE_LACUNARITY 2.0       // Noise frequency increase per octave\n\n// Hash function constants\n#define HASH_CONST_1 127.1         // Hash function constant 1\n#define HASH_CONST_2 311.7         // Hash function constant 2\n#define HASH_MULTIPLIER 43758.5453 // Hash function multiplier\n\n// Brightness control\n#define BRIGHTNESS 0.9             // Overall brightness multiplier (slightly muted)\n\n// Precomputed constants for optimization\n#define HALF 0.5                   // 0.5 for sin() offset\n#define ONE 1.0                    // 1.0 for alpha channel\n#define ZERO 0.0                   // 0.0 for zero values\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;        // Animation time\nuniform vec2 u_resolution;   // Screen resolution\nuniform bool u_invert;       // Whether to invert colors\n\n// ============================================================================\n// UTILITY FUNCTIONS\n// ============================================================================\n\n// Simple hash function for noise generation\nfloat hash(vec2 p) {\n  return fract(sin(dot(p, vec2(HASH_CONST_1, HASH_CONST_2))) * HASH_MULTIPLIER);\n}\n\n// Smooth interpolation using cubic smoothing\nfloat smoothNoise(vec2 p) {\n  vec2 i = floor(p);           // Integer part for grid lookup\n  vec2 f = fract(p);           // Fractional part for interpolation\n  f = f * f * (3.0 - 2.0 * f); // Cubic smoothing function\n\n  // Sample noise at four corners of the grid cell\n  float a = hash(i);\n  float b = hash(i + vec2(1.0, 0.0));\n  float c = hash(i + vec2(0.0, 1.0));\n  float d = hash(i + vec2(1.0, 1.0));\n\n  // Bilinear interpolation\n  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\n// Fractal noise for realistic cloud generation\nfloat fractalNoise(vec2 p) {\n  float value = 0.0;\n  float amplitude = NOISE_AMPLITUDE;\n  float frequency = NOISE_FREQUENCY;\n\n  // Generate multiple octaves of noise for fractal detail\n  for(int i = 0; i < NOISE_OCTAVES; i++) {\n    value += amplitude * smoothNoise(p * frequency);\n    amplitude *= NOISE_PERSISTENCE;  // Decrease amplitude each octave\n    frequency *= NOISE_LACUNARITY;   // Increase frequency each octave\n  }\n\n  return value;\n}\n\n// ============================================================================\n// CRT EFFECT FUNCTIONS\n// ============================================================================\n\n// Generate horizontal scanlines for CRT effect\nfloat crtScanlines(vec2 uv) {\n  // Create slowly rolling horizontal scanlines\n  float scanline = sin((uv.y + u_time * SCANLINE_SPEED) * u_resolution.y * SCANLINE_FREQ) * HALF + HALF;\n  return ONE - scanline * SCANLINE_INTENSITY;\n}\n\n// Generate grayscale clouds\nfloat generateClouds(vec2 uv) {\n  // Precompute time-based phases\n  float time_phase1 = u_time * CLOUD_SPEED_1;\n  float time_phase2 = u_time * CLOUD_SPEED_2;\n  float time_phase3 = u_time * CLOUD_SPEED_3;\n\n  // Sample cloud positions\n  vec2 cloudPos1 = uv * CLOUD_FREQ_1 + vec2(time_phase1, ZERO);\n  vec2 cloudPos2 = uv * CLOUD_FREQ_2 + vec2(time_phase2, ZERO);\n  vec2 cloudPos3 = uv * CLOUD_FREQ_3 + vec2(time_phase3, ZERO);\n\n  // Generate cloud noise\n  float cloud1 = fractalNoise(cloudPos1);\n  float cloud2 = fractalNoise(cloudPos2);\n  float cloud3 = fractalNoise(cloudPos3);\n  float clouds = max(cloud1 * CLOUD_SCALE_1, max(cloud2 * CLOUD_SCALE_2, cloud3 * CLOUD_SCALE_3));\n  clouds = smoothstep(CLOUD_THRESHOLD_LOW, CLOUD_THRESHOLD_HIGH, clouds);\n\n  return clouds;\n}\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  // Normalize fragment coordinates to [0,1] range\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n\n  // Generate sky gradient (grayscale)\n  float skyColor = mix(SKY_COLOR_TOP, SKY_COLOR_BOTTOM, uv.y);\n\n  // Generate clouds\n  float clouds = generateClouds(uv);\n\n  // Mix sky and clouds (clouds are gray, not white)\n  float color = mix(skyColor, CLOUD_BRIGHTNESS, clouds * CLOUD_OPACITY);\n\n  // Apply CRT scanlines\n  color *= crtScanlines(uv);\n\n  // Apply color inversion if enabled\n  color = u_invert ? ONE - color : color;\n\n  // Apply brightness control\n  color *= BRIGHTNESS;\n\n  // Output final grayscale color with full alpha\n  gl_FragColor = vec4(vec3(color), ONE);\n}";
var cloudsBw = {
  vertex: vertex_default$3,
  fragment: fragment_default$3
};
var vertex_default$2 = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}\n";
var fragment_default$2 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Zoom effect parameters\n#define ZOOM_POWER 1.5// Power curve for zoom acceleration\n#define ZOOM_INTENSITY.3// Zoom intensity multiplier\n\n// Time-based intensity parameters\n#define INTENSITY_PEAK_TIME 8.0// Time in seconds when intensity peaks\n#define INTENSITY_POWER.3// Power curve for intensity ramp-up\n\n// Pattern frequency parameters\n#define NUM_HOR_BANDS 10.0// Number of horizontal bands\n#define NUM_RINGS 5.0// Number of radial rings\n#define NUM_ARMS 6.0// Number of spiral arms\n\n// Spiral parameters\n#define SPIRAL_ANGLE 1.047197551// π/3 radians (60 degrees)\n\n// Color parameters - Magical purple/pink/cyan theme\n#define COLOR_AMPLITUDE.85// Amplitude for color oscillation\n#define COLOR_SPEED 2.5// Speed of color animation\n\n// Mathematical constants\n#define PI 3.14159265359// π constant\n#define HALF.5// 0.5 for centering\n#define ONE 1.0// 1.0 for full values\n#define TWO 2.0// 2.0 for doubling\n#define ZERO.0// 0.0 for zero values\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;// Animation time\nuniform vec2 u_resolution;// Screen resolution\nuniform bool u_invert;// Whether to invert colors\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main(){\n  // Normalize fragment coordinates to [0,1] range\n  vec2 position=gl_FragCoord.xy/u_resolution;\n  \n  // Apply zoom in effect with acceleration over time - from TOP RIGHT corner\n  float zoomFactor=ONE+pow(u_time,ZOOM_POWER)*ZOOM_INTENSITY;\n  vec2 center=vec2(.95,.95);// Top right corner (1.0, 1.0)\n  position=center+(position-center)/zoomFactor;\n  \n  // Center coordinates around top right corner\n  float cX=position.x-.95;// Offset from right edge\n  float cY=position.y-.95;// Offset from top edge\n  \n  // Convert to log-polar coordinates for spiral effects\n  float newX=log(sqrt(cX*cX+cY*cY));// Radial distance (log scale)\n  float newY=atan(cX,cY);// Angular position\n  \n  // Calculate time-based intensity multiplier with exponential ramp-up\n  float normalizedTime=min(u_time/INTENSITY_PEAK_TIME,ONE);\n  float intensityMultiplier=pow(normalizedTime,INTENSITY_POWER);\n  \n  // Initialize color accumulator\n  float color=ZERO;\n  \n  // Add horizontal bands pattern\n  color+=cos(NUM_HOR_BANDS*cX-u_time*intensityMultiplier);\n  \n  // Add radial rings pattern\n  color+=cos(NUM_RINGS*newX-u_time*intensityMultiplier);\n  \n  // Add spiral arms pattern\n  color+=cos(TWO*NUM_ARMS*(newX*sin(SPIRAL_ANGLE)+newY*cos(SPIRAL_ANGLE))+u_time*intensityMultiplier);\n  \n  // Create final color with magical purple/pink/cyan theme\n  vec3 finalColor=vec3(\n    sin(color+u_time/COLOR_SPEED*intensityMultiplier)*COLOR_AMPLITUDE+.3,// Red (magenta/pink)\n    sin(color+u_time/COLOR_SPEED*intensityMultiplier+PI*.5)*COLOR_AMPLITUDE*.6,// Green (reduced for purple)\n    cos(color+u_time/COLOR_SPEED*intensityMultiplier)*COLOR_AMPLITUDE+.4// Blue (cyan/purple)\n  );\n  \n  // Apply color inversion if enabled\n  finalColor=u_invert?vec3(ZERO)-finalColor:finalColor;\n  \n  // Output final color with full alpha\n  gl_FragColor=vec4(finalColor,ONE);\n}\n";
var magic = {
  vertex: vertex_default$2,
  fragment: fragment_default$2
};
var vertex_default$1 = "attribute vec2 a_position;\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n} ";
var fragment_default$1 = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Plasma effect parameters\n#define RADIAL_FREQUENCY 10.0      // Controls radial wave frequency\n#define RADIAL_SPEED 2.0           // Controls radial animation speed\n#define ANGULAR_FREQUENCY 8.0      // Controls angular wave frequency  \n#define ANGULAR_SPEED 1.0          // Controls angular animation speed\n#define HIGH_FREQ_FREQUENCY 20.0   // Controls high frequency detail\n#define HIGH_FREQ_SPEED 0.5        // Controls high frequency animation speed\n\n// Color mixing weights for RGB channels\n#define RED_WEIGHT 0.5\n#define GREEN_WEIGHT 0.3\n#define BLUE_WEIGHT 1.0\n\n// Brightness control to reduce white highlights\n#define MAX_BRIGHTNESS 0.7  // Reduce from 1.0 to 0.7 to avoid pure white\n\n// Precomputed constants for optimization\n#define HALF_PI 1.57079632679      // π/2 for atan optimization\n#define INV_THREE 0.33333333333    // 1/3 for division optimization\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;        // Animation time\nuniform vec2 u_resolution;   // Screen resolution\nuniform bool u_invert;       // Whether to invert colors\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  // Normalize fragment coordinates to [0,1] range\n  vec2 uv = gl_FragCoord.xy / u_resolution;\n  \n  // Center coordinates around origin (optimized: removed unnecessary * 1.0)\n  vec2 p = uv - 0.5;\n  \n  // Convert to polar coordinates\n  float a = atan(p.y, p.x);  // Angle from center\n  float r = length(p);       // Distance from center\n  \n  // Precompute time-based phases for all layers (reduces redundant multiplications)\n  float time_phase1 = u_time * RADIAL_SPEED;\n  float time_phase2 = u_time * ANGULAR_SPEED;\n  float time_phase3 = u_time * HIGH_FREQ_SPEED;\n  \n  // Create layered plasma effect using multiple sine waves\n  // Each layer adds different visual complexity:\n  \n  // Layer 1: Radial waves (concentric circles)\n  float plasma = sin(r * RADIAL_FREQUENCY - time_phase1) * 0.5 + 0.5;\n  \n  // Layer 2: Angular waves (spokes from center)\n  plasma += sin(a * ANGULAR_FREQUENCY + time_phase2) * 0.5 + 0.5;\n  \n  // Layer 3: High frequency detail (fine texture)\n  plasma += sin(r * HIGH_FREQ_FREQUENCY + time_phase3) * 0.5 + 0.5;\n  \n  // Apply color mixing with different weights for each RGB channel\n  vec3 color = vec3(plasma * RED_WEIGHT, plasma * GREEN_WEIGHT, plasma * BLUE_WEIGHT);\n  \n  // Reduce maximum brightness to avoid pure white highlights\n  color *= MAX_BRIGHTNESS;\n  \n  // Apply color inversion if enabled (optimized: use conditional assignment)\n  color = u_invert ? vec3(1.0) - color : color;\n  \n  // Output final color with full alpha\n  gl_FragColor = vec4(color, 1.0);\n} ";
var plasma = {
  vertex: vertex_default$1,
  fragment: fragment_default$1
};
var vertex_default = "precision mediump float;\n\nattribute vec2 a_position;\n\nuniform float u_time;\nuniform vec2 u_resolution;\n\nvoid main() {\n  gl_Position = vec4(a_position, 0.0, 1.0);\n}";
var fragment_default = "precision mediump float;\n\n// ============================================================================\n// CONFIGURATION VARIABLES\n// ============================================================================\n\n// Lightning tendril parameters\n#define NUM_TENDRILS 15.0          // Number of lightning bolts\n#define TENDRIL_SPACING 1.2566     // Angular spacing (2*PI / NUM_TENDRILS)\n#define TENDRIL_ROTATION_SPEED 1.3 // How fast tendrils rotate\n#define TENDRIL_WOBBLE_SPEED 0.7   // Speed of wobble animation\n#define TENDRIL_WOBBLE_AMOUNT 0.5  // Amount of angular wobble\n#define TENDRIL_WIDTH 0.09         // Base width of lightning\n#define TENDRIL_WIDTH_FALLOFF 0.5  // Width reduction towards edge\n\n// Noise parameters for jagged lightning\n#define NOISE_SCALE_COARSE 8.0     // Large-scale noise frequency\n#define NOISE_SCALE_FINE 5.0      // Fine detail noise frequency\n#define NOISE_AMOUNT_COARSE 0.8    // Large-scale noise intensity\n#define NOISE_AMOUNT_FINE 1.2      // Fine detail noise intensity\n#define NOISE_SPEED_COARSE 2.0     // Large-scale noise animation speed\n#define NOISE_SPEED_FINE 3.0       // Fine detail noise animation speed\n\n// Flicker effect\n#define FLICKER_SPEED 10.0         // Flicker animation speed\n#define FLICKER_AMOUNT 0.0         // Flicker intensity (0-1)\n#define FLICKER_BASE 1.0           // Minimum brightness during flicker\n\n// Distance falloff\n#define INNER_FADE_END 0.1         // Where inner fade ends\n#define OUTER_FADE_START 0.6       // Where outer fade begins\n#define OUTER_FADE_END 0.2         // Where outer fade ends\n\n// Color configuration (purple/pink plasma)\n#define COLOR_LIGHTNING vec3(0.8, 0.3, 1.0)\n#define COLOR_PULSE vec3(0.2, 0.0, 0.3)\n#define COLOR_PULSE_SPEED 5.0\n#define COLOR_PULSE_DIST_SCALE 10.0\n\n// Glow parameters\n#define GLOW_CENTER_RADIUS 0.3     // Central glow size\n#define GLOW_CENTER_COLOR vec3(0.3, 0.1, 0.4)\n#define GLOW_AMBIENT_COLOR vec3(0.06, 0.02, 0.08)\n\n// Animation speed\n#define TIME_SCALE 0.5             // Overall animation speed\n\n// Math constants\n#define PI 3.14159\n#define TWO_PI 6.28318\n\n// Hash constants\n#define HASH_V vec2(12.9898, 78.233)\n#define HASH_C 43758.5453\n\n// ============================================================================\n// UNIFORMS\n// ============================================================================\n\nuniform float u_time;\nuniform vec2 u_resolution;\n\n// ============================================================================\n// HELPER FUNCTIONS\n// ============================================================================\n\n// Optimized value noise - inlined hash\nfloat noise(vec2 p) {\n  vec2 i = floor(p);\n  vec2 f = fract(p);\n  f = f * f * (3.0 - 2.0 * f);\n\n  float a = fract(sin(dot(i, HASH_V)) * HASH_C);\n  float b = fract(sin(dot(i + vec2(1.0, 0.0), HASH_V)) * HASH_C);\n  float c = fract(sin(dot(i + vec2(0.0, 1.0), HASH_V)) * HASH_C);\n  float d = fract(sin(dot(i + vec2(1.0, 1.0), HASH_V)) * HASH_C);\n\n  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);\n}\n\n// ============================================================================\n// MAIN SHADER\n// ============================================================================\n\nvoid main() {\n  vec2 center = gl_FragCoord.xy / u_resolution - 0.5;\n  float dist = length(center);\n  float angle = atan(center.y, center.x);\n  float time = u_time * TIME_SCALE;\n\n  // Precompute shared values (moved outside loop)\n  float distFade = smoothstep(0.0, INNER_FADE_END, dist) * smoothstep(OUTER_FADE_START, OUTER_FADE_END, dist);\n  float width = TENDRIL_WIDTH * (1.0 - dist * TENDRIL_WIDTH_FALLOFF);\n  float pulse = sin(time * COLOR_PULSE_SPEED + dist * COLOR_PULSE_DIST_SCALE);\n  vec3 lightningColor = COLOR_LIGHTNING + COLOR_PULSE * pulse;\n\n  // Precompute time/dist scaled values\n  float timeRot = time * TENDRIL_ROTATION_SPEED;\n  float timeWobble = time * TENDRIL_WOBBLE_SPEED;\n  float timeFlicker = time * FLICKER_SPEED;\n  float timeNoiseC = time * NOISE_SPEED_COARSE;\n  float timeNoiseF = time * NOISE_SPEED_FINE;\n  float distNoiseC = dist * NOISE_SCALE_COARSE;\n  float distNoiseF = dist * NOISE_SCALE_FINE;\n\n  vec3 col = vec3(0.0);\n\n  for (float i = 0.0; i < NUM_TENDRILS; i++) {\n    float tendrilAngle = i * TENDRIL_SPACING + timeRot + sin(timeWobble + i) * TENDRIL_WOBBLE_AMOUNT;\n\n    // Angular distance to this tendril\n    float angleDiff = mod(angle - tendrilAngle + PI, TWO_PI) - PI;\n\n    // Jagged lightning using noise\n    float noiseOffset = noise(vec2(distNoiseC + i * 10.0, timeNoiseC + i)) * NOISE_AMOUNT_COARSE;\n    noiseOffset += noise(vec2(distNoiseF + i * 5.0, timeNoiseF)) * NOISE_AMOUNT_FINE;\n    angleDiff += noiseOffset - 0.3;\n\n    // Lightning intensity\n    float lightning = smoothstep(width, 0.0, abs(angleDiff)) * distFade;\n\n    // Flickering\n    lightning *= FLICKER_BASE + FLICKER_AMOUNT * sin(timeFlicker + i * 5.0);\n\n    col += lightning * lightningColor;\n  }\n\n  // Central glow\n  col += smoothstep(GLOW_CENTER_RADIUS, 0.0, dist) * GLOW_CENTER_COLOR;\n\n  // Outer ambient glow\n  col += smoothstep(0.7, 0.2, dist) * GLOW_AMBIENT_COLOR;\n\n  gl_FragColor = vec4(col, 1.0);\n}";
var plasmaLamp = {
  vertex: vertex_default,
  fragment: fragment_default
};
var shaders = {
  black,
  clouds,
  cloudsBw,
  magic,
  plasma,
  plasmaLamp,
  plasmaOptimized,
  plasmaOptimizedGreen,
  starfield,
  swirlyNoise,
  tripProcessing,
  vortex
};
var activeContexts = /* @__PURE__ */ new WeakMap();
var activeContextCount = 0;
var WebGLGeneralRenderer = class {
  /**
   * Creates a new WebGL renderer instance.
   * @param canvas - The HTML canvas element to render to
   * @param options - Configuration options for the renderer
   */
  constructor(canvas, options) {
    this.uniformLocations = /* @__PURE__ */ new Map();
    this.frameCount = 0;
    this.lastFrameTime = 0;
    this.fps = 0;
    this.frameInterval = 1e3 / 60;
    this.contextLost = false;
    this.isPaused = false;
    this.handleContextLost = (event) => {
      event.preventDefault();
      this.contextLost = true;
      if (this.animationId) {
        cancelAnimationFrame(this.animationId);
        this.animationId = void 0;
      }
      console.warn("WebGL context lost");
    };
    this.handleContextRestored = () => {
      console.log("WebGL context restored, reinitializing...");
      this.contextLost = false;
      try {
        this.initWebGL(this.shaderSource);
        if (this.autoRender) {
          this.render();
        }
      } catch (error2) {
        console.error("Failed to restore WebGL context:", error2);
      }
    };
    this.canvas = canvas;
    this.startTime = performance.now();
    this.uniforms = options.uniforms || {};
    this.autoRender = options.autoRender ?? true;
    this.frameInterval = 1e3 / 60;
    this.shaderSource = options.shader;
    this.onError = options.onError;
    this.preserveDrawingBuffer = options.preserveDrawingBuffer ?? false;
    this.initWebGL(options.shader);
    this.setupContextLossHandlers();
    const existingContext = activeContexts.get(canvas);
    if (!existingContext || existingContext !== this.gl) {
      if (!existingContext) {
        activeContextCount++;
      }
      activeContexts.set(canvas, this.gl);
    }
  }
  /**
   * Report an error using the configured error handler
   */
  reportError(error2, context) {
    if (this.onError) {
      this.onError(error2, context);
    }
  }
  /**
   * Creates and compiles a WebGL shader.
   * @param type - The shader type (VERTEX_SHADER or FRAGMENT_SHADER)
   * @param source - The shader source code
   * @returns The compiled WebGL shader
   * @throws Error if shader creation or compilation fails
   */
  createShader(type, source) {
    const shader = this.gl.createShader(type);
    if (!shader) {
      const error2 = new WebGLError("Failed to create shader");
      this.reportError(error2, "WebGL shader creation failed");
      throw error2;
    }
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const shaderType = type === this.gl.VERTEX_SHADER ? "vertex" : "fragment";
      const errorLog = this.gl.getShaderInfoLog(shader);
      const error2 = new ShaderError("Shader compilation error: " + errorLog, shaderType, source);
      this.reportError(error2, "Shader compilation failed");
      throw error2;
    }
    return shader;
  }
  /**
   * Creates and links a WebGL program from vertex and fragment shaders.
   * @param vertexShader - The compiled vertex shader
   * @param fragmentShader - The compiled fragment shader
   * @returns The linked WebGL program
   * @throws Error if program creation or linking fails
   */
  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    if (!program) {
      const error2 = new WebGLError("Failed to create program");
      this.reportError(error2, "WebGL program creation failed");
      throw error2;
    }
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
      const errorLog = this.gl.getProgramInfoLog(program);
      const error2 = new WebGLError("Program linking error: " + errorLog);
      this.reportError(error2, "WebGL program linking failed");
      throw error2;
    }
    return program;
  }
  /**
   * Initializes the WebGL context and sets up the rendering pipeline.
   * Creates shaders, program, buffers, and configures the rendering state.
   * @param shader - The shader source code for vertex and fragment shaders
   * @throws Error if WebGL is not supported or initialization fails
   */
  initWebGL(shader) {
    const gl = this.canvas.getContext("webgl", {
      preserveDrawingBuffer: this.preserveDrawingBuffer
    });
    if (!gl || gl.isContextLost()) {
      const errorMessage = gl === null ? "Failed to create WebGL context. This could be due to too many active WebGL contexts or WebGL not being supported." : "WebGL context lost";
      const error2 = activeContextCount >= 16 ? new WebGLContextLimitError(
        `${errorMessage} (${activeContextCount} active contexts)`,
        activeContextCount
      ) : new WebGLContextError(errorMessage);
      this.reportError(error2, "Failed to initialize WebGL");
      throw error2;
    }
    this.gl = gl;
    this.vertexShader = this.createShader(this.gl.VERTEX_SHADER, shader.vertex);
    this.fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, shader.fragment);
    this.program = this.createProgram(this.vertexShader, this.fragmentShader);
    const positions = new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]);
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, positions, this.gl.STATIC_DRAW);
    this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
    this.gl.useProgram(this.program);
    this.gl.enableVertexAttribArray(this.positionLocation);
    this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
    this.cacheUniformLocations();
    this.updateUniforms();
    this.resize();
  }
  /**
   * Caches uniform locations for efficient uniform updates.
   * Stores uniform locations in a Map for quick access during rendering.
   */
  cacheUniformLocations() {
    this.uniformLocations.clear();
    const uniformNames = [...Object.keys(this.uniforms), "u_time", "u_resolution"];
    for (const name of uniformNames) {
      const location = this.gl.getUniformLocation(this.program, name);
      this.uniformLocations.set(name, location);
    }
  }
  /**
   * Sets up WebGL context loss and restore event handlers.
   */
  setupContextLossHandlers() {
    this.canvas.addEventListener("webglcontextlost", this.handleContextLost, false);
    this.canvas.addEventListener("webglcontextrestored", this.handleContextRestored, false);
  }
  /**
   * Updates all uniforms in the shader program.
   * Sets uniform values based on their type (float, vec2, vec3, vec4, int, bool).
   */
  updateUniforms() {
    for (const [name, uniform] of Object.entries(this.uniforms)) {
      const location = this.uniformLocations.get(name);
      if (!location) continue;
      switch (uniform.type) {
        case "float":
          this.gl.uniform1f(location, uniform.value);
          break;
        case "vec2": {
          const vec2 = uniform.value;
          this.gl.uniform2f(location, vec2[0], vec2[1]);
          break;
        }
        case "vec3": {
          const vec3 = uniform.value;
          this.gl.uniform3f(location, vec3[0], vec3[1], vec3[2]);
          break;
        }
        case "vec4": {
          const vec4 = uniform.value;
          this.gl.uniform4f(location, vec4[0], vec4[1], vec4[2], vec4[3]);
          break;
        }
        case "int":
          this.gl.uniform1i(location, uniform.value);
          break;
        case "bool":
          this.gl.uniform1i(location, uniform.value ? 1 : 0);
          break;
      }
    }
  }
  /**
   * Sets a uniform value in the shader program.
   * @param name - The name of the uniform variable
   * @param value - The value to set (number, array, or boolean)
   * @param type - Optional type override for the uniform
   * @throws Error if the uniform is not found in the shader
   */
  setUniform(name, value, type) {
    if (!this.uniforms[name]) {
      throw new UniformLocationError(name);
    }
    this.uniforms[name].value = value;
    if (type) {
      this.uniforms[name].type = type;
    }
    const location = this.uniformLocations.get(name);
    if (!location) return;
    const uniform = this.uniforms[name];
    switch (uniform.type) {
      case "float":
        this.gl.uniform1f(location, uniform.value);
        break;
      case "vec2": {
        const vec2 = uniform.value;
        this.gl.uniform2f(location, vec2[0], vec2[1]);
        break;
      }
      case "vec3": {
        const vec3 = uniform.value;
        this.gl.uniform3f(location, vec3[0], vec3[1], vec3[2]);
        break;
      }
      case "vec4": {
        const vec4 = uniform.value;
        this.gl.uniform4f(location, vec4[0], vec4[1], vec4[2], vec4[3]);
        break;
      }
      case "int":
        this.gl.uniform1i(location, uniform.value);
        break;
      case "bool":
        this.gl.uniform1i(location, uniform.value ? 1 : 0);
        break;
    }
  }
  /**
   * Renders a single frame using the current shader program.
   * Updates time uniform, clears the viewport, and draws the quad.
   * If autoRender is enabled, schedules the next frame.
   */
  render() {
    if (!this.gl || !this.program || this.contextLost) {
      if (this.autoRender && !this.isPaused) {
        this.animationId = requestAnimationFrame(() => this.render());
      }
      return;
    }
    if (this.isPaused) {
      return;
    }
    const currentTime = performance.now();
    if (currentTime - this.lastFrameTime < this.frameInterval) {
      if (this.autoRender) {
        this.animationId = requestAnimationFrame(() => this.render());
      }
      return;
    }
    this.lastFrameTime = currentTime;
    this.frameCount++;
    const timeLocation = this.uniformLocations.get("u_time");
    if (timeLocation) {
      const time = (currentTime - this.startTime) * 1e-3;
      this.gl.uniform1f(timeLocation, time);
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
    if (this.frameCount % 60 === 0) {
      const elapsed = currentTime - this.startTime;
      this.fps = Math.round(this.frameCount / elapsed * 1e3);
    }
    if (this.autoRender) {
      this.animationId = requestAnimationFrame(() => this.render());
    }
  }
  /**
   * Resizes the canvas and updates the resolution uniform.
   * Adjusts canvas size based on device pixel ratio and updates u_resolution uniform.
   */
  resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * window.devicePixelRatio;
    this.canvas.height = rect.height * window.devicePixelRatio;
    const resolutionLocation = this.uniformLocations.get("u_resolution");
    if (resolutionLocation) {
      this.gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
    }
  }
  /**
   * Gets the current FPS of the renderer.
   * @returns The current frames per second
   */
  getFPS() {
    return this.fps;
  }
  /**
   * Pauses the rendering loop.
   * Useful for mobile/background scenarios to save resources.
   */
  pause() {
    this.isPaused = true;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = void 0;
    }
  }
  /**
   * Resumes the rendering loop after being paused.
   */
  resume() {
    this.isPaused = false;
    if (this.autoRender && !this.animationId) {
      this.animationId = requestAnimationFrame(() => this.render());
    }
  }
  /**
   * Renders a single frame without starting the animation loop.
   * Useful for static renders or manual frame control.
   */
  renderSingleFrame() {
    if (!this.gl || !this.program || this.contextLost) {
      return;
    }
    const currentTime = performance.now();
    this.lastFrameTime = currentTime;
    this.frameCount++;
    const timeLocation = this.uniformLocations.get("u_time");
    if (timeLocation) {
      const time = (currentTime - this.startTime) * 1e-3;
      this.gl.uniform1f(timeLocation, time);
    }
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4);
  }
  /**
   * Destroys the renderer and cleans up resources.
   * Cancels any pending animation frames and frees WebGL resources.
   *
   * Note: We don't call loseContext() because it makes the canvas unusable
   * for future WebGL contexts. Instead, we let the browser's garbage collector
   * handle context cleanup when there are no more references.
   */
  destroy() {
    this.canvas.removeEventListener("webglcontextlost", this.handleContextLost);
    this.canvas.removeEventListener("webglcontextrestored", this.handleContextRestored);
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = void 0;
    }
    if (this.gl && this.program) {
      try {
        const isContextLost = this.gl.isContextLost();
        if (!isContextLost) {
          this.gl.deleteShader(this.vertexShader);
          this.gl.deleteShader(this.fragmentShader);
          this.gl.deleteProgram(this.program);
          this.gl.deleteBuffer(this.positionBuffer);
        }
        if (activeContexts.has(this.canvas)) {
          activeContexts.delete(this.canvas);
          activeContextCount--;
        }
      } catch (error2) {
        console.warn("WebGL cleanup failed (context may be lost):", error2);
      } finally {
        this.uniformLocations.clear();
        this.gl = null;
        this.program = null;
        this.vertexShader = null;
        this.fragmentShader = null;
        this.positionBuffer = null;
      }
    }
  }
};
var ShaderManager = class {
  constructor(options) {
    this._renderer = null;
    this._canvas = null;
    this.resizeTimeout = null;
    this._invert = false;
    this.customUniforms = {};
    this._contextExhausted = false;
    this.recoveryTimeout = null;
    this.recoveryAttempts = 0;
    this.maxRecoveryAttempts = 10;
    this.forceContinuousRendering = false;
    this.singleFramePauseRafId = null;
    this.currentShaderKey = null;
    this.shaderChangeListeners = [];
    this.handleResize = () => {
      if (this.resizeTimeout) {
        clearTimeout(this.resizeTimeout);
      }
      this.resizeTimeout = setTimeout(() => {
        if (this._renderer) {
          this._renderer.resize();
          if (this.singleFrameRender() && !this.forceContinuousRendering) {
            this._renderer.renderSingleFrame();
          }
        }
      }, 100);
    };
    this.errorHandler = options.errorHandler;
    this.singleFrameRender = options.singleFrameRender;
    this.preserveDrawingBuffer = options.preserveDrawingBuffer ?? false;
  }
  /**
   * Get context exhausted state
   */
  get isContextExhausted() {
    return this._contextExhausted;
  }
  /**
   * Get current invert state
   */
  get isInverted() {
    return this._invert;
  }
  /**
   * Get current renderer
   */
  get renderer() {
    return this._renderer;
  }
  /**
   * Set canvas for the shader manager
   */
  set canvas(newCanvas) {
    this._canvas = newCanvas;
    if (this._renderer && newCanvas) {
      this._renderer.canvas = newCanvas;
    }
  }
  /**
   * Get current uniform values
   */
  get uniformValues() {
    return {
      invert: this._invert
    };
  }
  /**
   * Get uniform definitions for WebGL renderer
   */
  get uniformDefinitions() {
    return [
      {
        name: "u_invert",
        value: this._invert
      }
    ];
  }
  /**
   * Subscribe to shader changes
   * @returns Unsubscribe function
   */
  onShaderChange(callback) {
    this.shaderChangeListeners.push(callback);
    callback(this.currentShaderKey);
    return () => {
      const index = this.shaderChangeListeners.indexOf(callback);
      if (index > -1) {
        this.shaderChangeListeners.splice(index, 1);
      }
    };
  }
  /**
   * Notify all listeners of shader change
   */
  notifyShaderChange() {
    this.shaderChangeListeners.forEach((listener) => listener(this.currentShaderKey));
  }
  /**
   * Toggle invert state
   */
  toggleInvert() {
    this._invert = !this._invert;
    if (this.renderer) {
      this.renderer.setUniform("u_invert", this._invert, "bool");
    }
  }
  /**
   * Set invert state
   */
  setInvert(inverted) {
    this._invert = inverted;
    if (this._renderer) {
      this._renderer.setUniform("u_invert", this._invert, "bool");
    }
  }
  /**
   * Set new shader programmatically
   */
  setShader(shaderKey, inverted = false, uniforms) {
    const shaderSource = shaders?.[shaderKey];
    if (!shaderSource) throw new Error("ShaderNotExistError");
    this.customUniforms = uniforms || {};
    if (this.currentShaderKey === shaderKey && this._renderer) {
      if (this._invert !== inverted) {
        this.setInvert(inverted);
      }
      Object.entries(this.customUniforms).forEach(([name, uniform]) => {
        this._renderer?.setUniform(name, uniform.value, uniform.type);
      });
      return;
    }
    this._invert = inverted;
    this.currentShaderKey = shaderKey;
    this.notifyShaderChange();
    if (this._renderer) {
      this._renderer.destroy();
      this._renderer = null;
    }
    if (this._canvas) {
      try {
        this.initializeRenderer(this._canvas, shaderSource);
        this._contextExhausted = false;
        if (this._canvas) {
          this._canvas.style.display = "block";
        }
        if (this.singleFrameRender() && !this.forceContinuousRendering && this._renderer) {
          if (this.singleFramePauseRafId !== null) {
            cancelAnimationFrame(this.singleFramePauseRafId);
            this.singleFramePauseRafId = null;
          }
          this.singleFramePauseRafId = requestAnimationFrame(() => {
            this.singleFramePauseRafId = requestAnimationFrame(() => {
              this.singleFramePauseRafId = null;
              if (this._renderer && !this.forceContinuousRendering) {
                this._renderer.pause();
              }
            });
          });
        }
      } catch (error2) {
        console.error(`Failed to initialize shader "${shaderKey}":`, error2);
        this._contextExhausted = true;
        if (this._canvas) {
          this._canvas.style.display = "none";
        }
        this.scheduleContextRecovery(shaderKey);
      }
    }
  }
  /**
   * Enable continuous rendering (for animations like trip processing)
   */
  enableContinuousRendering() {
    this.forceContinuousRendering = true;
    if (this._renderer) {
      this._renderer.resume();
    }
  }
  /**
   * Disable continuous rendering (revert to mobile/Firefox optimization)
   */
  disableContinuousRendering() {
    this.forceContinuousRendering = false;
    if (this.singleFrameRender() && this._renderer) {
      this._renderer.pause();
    }
  }
  /**
   * Initialize WebGL renderer
   */
  initializeRenderer(canvas, shaderSource) {
    if (!canvas) return;
    this._canvas = canvas;
    const initialUniforms = {};
    initialUniforms["u_invert"] = {
      type: "bool",
      value: this._invert
    };
    Object.entries(this.customUniforms).forEach(([name, uniform]) => {
      initialUniforms[name] = uniform;
    });
    try {
      this._renderer = new WebGLGeneralRenderer(canvas, {
        shader: shaderSource,
        uniforms: initialUniforms,
        onError: this.errorHandler,
        preserveDrawingBuffer: this.preserveDrawingBuffer
      });
      this._renderer.render();
      window.removeEventListener("resize", this.handleResize);
      window.addEventListener("resize", this.handleResize);
    } catch (error2) {
      console.error("Failed to initialize WebGL renderer:", error2);
      this._renderer = null;
      const shaderError = new ShaderInitializationError(
        `Failed to initialize shader renderer: ${error2 instanceof Error ? error2.message : String(error2)}`,
        this.currentShaderKey || "unknown",
        error2
      );
      this.errorHandler(shaderError, "Shader initialization failed");
      throw shaderError;
    }
  }
  /**
   * Update uniform values in the shader
   */
  updateUniforms() {
    if (!this._renderer) return;
    this._renderer.setUniform("u_invert", this._invert, "bool");
  }
  /**
   * Schedule context recovery attempt
   */
  scheduleContextRecovery(shaderKey) {
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
      this.recoveryTimeout = null;
    }
    if (this.recoveryAttempts >= this.maxRecoveryAttempts) {
      return;
    }
    this.recoveryAttempts++;
    this.recoveryTimeout = setTimeout(() => {
      if (this._canvas) {
        const shaderSource = shaders?.[shaderKey];
        if (shaderSource) {
          try {
            this.initializeRenderer(this._canvas, shaderSource);
            this.recoveryAttempts = 0;
            this._contextExhausted = false;
            if (this._canvas) {
              this._canvas.style.display = "block";
            }
          } catch (error2) {
            console.warn(`Recovery attempt ${this.recoveryAttempts} failed, will retry...`);
            this.scheduleContextRecovery(shaderKey);
          }
        }
      }
    }, 5e3);
  }
  /**
   * Clean up resources
   */
  destroy() {
    this.currentShaderKey = null;
    this._contextExhausted = false;
    this.recoveryAttempts = 0;
    if (this._renderer) {
      this._renderer.destroy();
      this._renderer = null;
    }
    window.removeEventListener("resize", this.handleResize);
    if (this.resizeTimeout) {
      clearTimeout(this.resizeTimeout);
      this.resizeTimeout = null;
    }
    if (this.recoveryTimeout) {
      clearTimeout(this.recoveryTimeout);
      this.recoveryTimeout = null;
    }
    if (this.singleFramePauseRafId !== null) {
      cancelAnimationFrame(this.singleFramePauseRafId);
      this.singleFramePauseRafId = null;
    }
    this.shaderChangeListeners = [];
    this._canvas = null;
  }
};
function createShaderManager(options) {
  return new ShaderManager(options);
}
const shaderManager = createShaderManager({
  errorHandler,
  singleFrameRender: () => get$2(singleFrameRender)
});
var AUCTION_STATE = ((AUCTION_STATE2) => {
  AUCTION_STATE2["INIT"] = "INIT";
  AUCTION_STATE2["COUNTRY_BLOCKED"] = "COUNTRY_BLOCKED";
  AUCTION_STATE2["CONNECT_WALLET"] = "CONNECT_WALLET";
  AUCTION_STATE2["SWAP"] = "SWAP";
  AUCTION_STATE2["NOT_STARTED"] = "NOT_STARTED";
  AUCTION_STATE2["WAITING_FOR_EPOCH"] = "WAITING_FOR_EPOCH";
  AUCTION_STATE2["ENDED"] = "ENDED";
  AUCTION_STATE2["ERROR"] = "ERROR";
  return AUCTION_STATE2;
})(AUCTION_STATE || {});
let auctionStateValue = "INIT";
const auctionState = {
  state: {
    get current() {
      return auctionStateValue;
    }
  }
};
const deltaRouterAddress = "0x3658a91bc38f2F7989011D00FDBc11c0d30023A7";
const ratQuoterAddress = "0x58831e87f7F3F59201F8Ca307f34793AB92364Cc";
const eurcCurrency = {
  address: "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42"
};
const usdcCurrency = {
  address: "0x833589fcd6edb6e08f4c7c32d4f71b54bda02913",
  decimals: 6,
  symbol: "USDC"
};
const wethCurrency = {
  address: "0x4200000000000000000000000000000000000006",
  decimals: 18,
  symbol: "ETH",
  isNative: true
  // ETH is native, we use WETH address for swaps but fetch native balance
};
const availableCurrencies = [wethCurrency, usdcCurrency];
const aerodromePaths = {
  [usdcCurrency.address]: [[50, eurcCurrency.address]],
  [wethCurrency.address]: [[100, eurcCurrency.address]]
};
function getAerodromePath(fromCurrencyAddress, isExactOut2) {
  if (!(fromCurrencyAddress in aerodromePaths)) {
    throw new Error("Invalid start address");
  }
  const unpackedPath = aerodromePaths[fromCurrencyAddress];
  const unpackedPathAbiTypes = Array(unpackedPath.length).fill(["int24", "address"]);
  let fullPath = [fromCurrencyAddress, ...unpackedPath.flat()];
  let fullPathAbiTypes = ["address", ...unpackedPathAbiTypes.flat()];
  if (isExactOut2) {
    fullPath = fullPath.reverse();
    fullPathAbiTypes = fullPathAbiTypes.reverse();
  }
  const packedPath = encodePacked(fullPathAbiTypes, fullPath);
  return packedPath;
}
function prepareQuoterPathArgs(fromCurrencyAddress, auctionParams2, isExactOut2) {
  const aerodromePath = getAerodromePath(fromCurrencyAddress, isExactOut2);
  const poolKey = getPoolKey(auctionParams2);
  const zeroForOne = !auctionParams2.isToken0;
  return [aerodromePath, poolKey, zeroForOne];
}
function isPermit2Required(fromCurrencyAddress) {
  return fromCurrencyAddress.toLowerCase() !== wethCurrency.address.toLowerCase();
}
const ratQuoterAbi = parseAbi$1([
  "function quoteExactIn(uint256 amountIn, bytes memory aerodromePath, PoolKey memory uniswapPoolKey, bool uniswapZeroForOne) external returns (uint256 amountOutFinal, uint256 amountInUniswap)",
  "function quoteExactOut(uint256 amountOut, bytes memory aerodromePath, PoolKey memory uniswapPoolKey, bool uniswapZeroForOne) external returns (uint256 amountInInitial, uint256 amountInUniswap)",
  "function uniswapV4Quoter() external view returns (address)",
  "function aerodromeQuoter() external view returns (address)",
  "struct PoolKey { address currency0; address currency1; uint24 fee; int24 tickSpacing; address hooks; }"
]);
async function quoteExactIn(fromCurrencyAddress, auctionParams2, amountIn2) {
  const publicClient$1 = get$2(publicClient);
  if (!publicClient$1) throw new Error("Network not initialized");
  const { result } = await simulateContract(publicClient$1, {
    address: ratQuoterAddress,
    abi: ratQuoterAbi,
    functionName: "quoteExactIn",
    args: [amountIn2, ...prepareQuoterPathArgs(fromCurrencyAddress, auctionParams2, false)],
    account: get$2(userAddress)
  });
  const [amountOutFinal, amountInUniswap] = result;
  return {
    amountOutFinal,
    amountInUniswap
  };
}
async function quoteExactOut(fromCurrencyAddress, auctionParams2, amountOut2) {
  const publicClient$1 = get$2(publicClient);
  if (!publicClient$1) throw new Error("Network not initialized");
  const { result } = await simulateContract(publicClient$1, {
    address: ratQuoterAddress,
    abi: ratQuoterAbi,
    functionName: "quoteExactOut",
    args: [amountOut2, ...prepareQuoterPathArgs(fromCurrencyAddress, auctionParams2, true)],
    account: get$2(userAddress)
  });
  const [amountInInitial, amountInUniswap] = result;
  return {
    amountInInitial,
    amountInUniswap
  };
}
var V4ActionType = /* @__PURE__ */ ((V4ActionType2) => {
  V4ActionType2[V4ActionType2["INCREASE_LIQUIDITY"] = 0] = "INCREASE_LIQUIDITY";
  V4ActionType2[V4ActionType2["DECREASE_LIQUIDITY"] = 1] = "DECREASE_LIQUIDITY";
  V4ActionType2[V4ActionType2["MINT_POSITION"] = 2] = "MINT_POSITION";
  V4ActionType2[V4ActionType2["BURN_POSITION"] = 3] = "BURN_POSITION";
  V4ActionType2[V4ActionType2["INCREASE_LIQUIDITY_FROM_DELTAS"] = 4] = "INCREASE_LIQUIDITY_FROM_DELTAS";
  V4ActionType2[V4ActionType2["MINT_POSITION_FROM_DELTAS"] = 5] = "MINT_POSITION_FROM_DELTAS";
  V4ActionType2[V4ActionType2["SWAP_EXACT_IN_SINGLE"] = 6] = "SWAP_EXACT_IN_SINGLE";
  V4ActionType2[V4ActionType2["SWAP_EXACT_IN"] = 7] = "SWAP_EXACT_IN";
  V4ActionType2[V4ActionType2["SWAP_EXACT_OUT_SINGLE"] = 8] = "SWAP_EXACT_OUT_SINGLE";
  V4ActionType2[V4ActionType2["SWAP_EXACT_OUT"] = 9] = "SWAP_EXACT_OUT";
  V4ActionType2[V4ActionType2["SETTLE"] = 11] = "SETTLE";
  V4ActionType2[V4ActionType2["SETTLE_ALL"] = 12] = "SETTLE_ALL";
  V4ActionType2[V4ActionType2["TAKE"] = 14] = "TAKE";
  V4ActionType2[V4ActionType2["TAKE_ALL"] = 15] = "TAKE_ALL";
  V4ActionType2[V4ActionType2["TAKE_PORTION"] = 16] = "TAKE_PORTION";
  V4ActionType2[V4ActionType2["CLOSE_CURRENCY"] = 18] = "CLOSE_CURRENCY";
  V4ActionType2[V4ActionType2["SWEEP"] = 20] = "SWEEP";
  V4ActionType2[V4ActionType2["WRAP"] = 21] = "WRAP";
  V4ActionType2[V4ActionType2["UNWRAP"] = 22] = "UNWRAP";
  V4ActionType2[V4ActionType2["PERMIT2_PERMIT"] = 25] = "PERMIT2_PERMIT";
  V4ActionType2[V4ActionType2["PERMIT2_TRANSFER_FROM"] = 27] = "PERMIT2_TRANSFER_FROM";
  V4ActionType2[V4ActionType2["AERODROME_SWAP_EXACT_IN"] = 28] = "AERODROME_SWAP_EXACT_IN";
  V4ActionType2[V4ActionType2["AERODROME_SWAP_EXACT_OUT"] = 29] = "AERODROME_SWAP_EXACT_OUT";
  return V4ActionType2;
})(V4ActionType || {});
const ActionConstants = {
  OPEN_DELTA: 0n,
  CONTRACT_BALANCE: 0x8000000000000000000000000000000000000000000000000000000000000000n,
  MSG_SENDER: "0x0000000000000000000000000000000000000001",
  ADDRESS_THIS: "0x0000000000000000000000000000000000000002",
  // CONTRACT_BALANCE variant only for native uniswap v4 swaps, which aren't uint256 compatible
  SWAP_CONTRACT_BALANCE: maxUint128
};
const POOL_KEY_STRUCT = {
  name: "poolKey",
  type: "tuple",
  components: [
    { name: "currency0", type: "address" },
    { name: "currency1", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" }
  ]
};
const PATH_KEY_STRUCT = {
  components: [
    { name: "intermediateCurrency", type: "address" },
    { name: "fee", type: "uint256" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
    { name: "hookData", type: "bytes" }
  ]
};
const ABI_DEFINITION = {
  [
    0
    /* INCREASE_LIQUIDITY */
  ]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [
    1
    /* DECREASE_LIQUIDITY */
  ]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [
    2
    /* MINT_POSITION */
  ]: [
    POOL_KEY_STRUCT,
    { type: "int24" },
    { type: "int24" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" }
  ],
  [
    3
    /* BURN_POSITION */
  ]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [
    4
    /* INCREASE_LIQUIDITY_FROM_DELTAS */
  ]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [
    5
    /* MINT_POSITION_FROM_DELTAS */
  ]: [
    POOL_KEY_STRUCT,
    { type: "int24" },
    { type: "int24" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" }
  ],
  [
    6
    /* SWAP_EXACT_IN_SINGLE */
  ]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        POOL_KEY_STRUCT,
        { name: "zeroForOne", type: "bool" },
        { name: "amountIn", type: "uint128" },
        { name: "amountOutMinimum", type: "uint128" },
        { name: "hookData", type: "bytes" }
      ]
    }
  ],
  [
    7
    /* SWAP_EXACT_IN */
  ]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        { name: "currencyIn", type: "address" },
        {
          name: "path",
          type: "tuple[]",
          components: PATH_KEY_STRUCT.components
        },
        { name: "amountIn", type: "uint128" },
        { name: "amountOutMinimum", type: "uint128" }
      ]
    }
  ],
  [
    8
    /* SWAP_EXACT_OUT_SINGLE */
  ]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        POOL_KEY_STRUCT,
        { name: "zeroForOne", type: "bool" },
        { name: "amountOut", type: "uint128" },
        { name: "amountInMaximum", type: "uint128" },
        { name: "hookData", type: "bytes" }
      ]
    }
  ],
  [
    9
    /* SWAP_EXACT_OUT */
  ]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        { name: "currencyOut", type: "address" },
        {
          name: "path",
          type: "tuple[]",
          components: PATH_KEY_STRUCT.components
        },
        { name: "amountOut", type: "uint128" },
        { name: "amountInMaximum", type: "uint128" }
      ]
    }
  ],
  [
    11
    /* SETTLE */
  ]: [{ type: "address" }, { type: "uint256" }, { type: "bool" }],
  [
    12
    /* SETTLE_ALL */
  ]: [{ type: "address" }, { type: "uint256" }],
  [
    14
    /* TAKE */
  ]: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
  [
    15
    /* TAKE_ALL */
  ]: [{ type: "address" }, { type: "uint256" }],
  [
    16
    /* TAKE_PORTION */
  ]: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
  [
    18
    /* CLOSE_CURRENCY */
  ]: [{ type: "address" }],
  [
    20
    /* SWEEP */
  ]: [{ type: "address" }, { type: "address" }],
  [
    21
    /* WRAP */
  ]: [{ type: "uint256" }],
  [
    22
    /* UNWRAP */
  ]: [{ type: "uint256" }],
  [
    25
    /* PERMIT2_PERMIT */
  ]: parseAbiParameters([
    "PermitSingle",
    "bytes",
    "struct PermitSingle { PermitDetails details; address spender; uint256 sigDeadline; }",
    "struct PermitDetails { address token; uint160 amount; uint48 expiration; uint48 nonce; }"
  ]),
  [
    27
    /* PERMIT2_TRANSFER_FROM */
  ]: parseAbiParameters([
    "address token",
    "address recipient",
    "uint160 amount"
  ]),
  [
    28
    /* AERODROME_SWAP_EXACT_IN */
  ]: parseAbiParameters([
    "V3ExactInputParams params",
    "struct V3ExactInputParams { bytes path; uint256 amountIn; uint256 amountOutMinimum; }"
  ]),
  [
    29
    /* AERODROME_SWAP_EXACT_OUT */
  ]: parseAbiParameters([
    "V3ExactOutputParams params",
    "struct V3ExactOutputParams { bytes path; uint256 amountOut; uint256 amountInMaximum; }"
  ])
};
class V4DeltaActionBuilder {
  actions = "0x";
  inputs = [];
  addAction(type, parameters) {
    const encoded = encodeAbiParameters(ABI_DEFINITION[type], parameters);
    this.actions += type.toString(16).padStart(2, "0");
    this.inputs.push(encoded);
    return this;
  }
  buildExecuteArgs() {
    const encodedArgs = encodeAbiParameters(
      [{ type: "bytes" }, { type: "bytes[]" }],
      [this.actions, this.inputs]
    );
    return [encodedArgs];
  }
}
const deltaRouterAbi = [
  {
    type: "function",
    name: "execute",
    inputs: [
      {
        name: "inputs",
        type: "bytes",
        internalType: "bytes"
      }
    ],
    outputs: [],
    stateMutability: "payable"
  },
  {
    type: "error",
    name: "ContractLocked",
    inputs: []
  },
  {
    type: "error",
    name: "DeltaNotNegative",
    inputs: [
      {
        name: "currency",
        type: "address",
        internalType: "Currency"
      }
    ]
  },
  {
    type: "error",
    name: "DeltaNotPositive",
    inputs: [
      {
        name: "currency",
        type: "address",
        internalType: "Currency"
      }
    ]
  },
  {
    type: "error",
    name: "InputLengthMismatch",
    inputs: []
  },
  {
    type: "error",
    name: "InsufficientBalance",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidBips",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidEthSender",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidHopSlippageLength",
    inputs: []
  },
  {
    type: "error",
    name: "InvalidPath",
    inputs: [
      {
        name: "pathLength",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "NotPoolManager",
    inputs: []
  },
  {
    type: "error",
    name: "UnsupportedAction",
    inputs: [
      {
        name: "action",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "V4TooLittleReceived",
    inputs: [
      {
        name: "minAmountOutReceived",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "amountReceived",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "V4TooLittleReceivedPerHop",
    inputs: [
      {
        name: "hopIndex",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "maxPrice",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "price",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "V4TooMuchRequested",
    inputs: [
      {
        name: "maxAmountInRequested",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "amountRequested",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  },
  {
    type: "error",
    name: "V4TooMuchRequestedPerHop",
    inputs: [
      {
        name: "hopIndex",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "maxPrice",
        type: "uint256",
        internalType: "uint256"
      },
      {
        name: "price",
        type: "uint256",
        internalType: "uint256"
      }
    ]
  }
];
async function swapExactIn(fromCurrencyAddress, auctionParams2, amountIn2, amountOutMinimum, permit2, permitSignature2) {
  const client = await getDrawbridge().getConnectorClient();
  let value = 0n;
  const actionBuilder = new V4DeltaActionBuilder();
  if (fromCurrencyAddress === wethCurrency.address) {
    value = amountIn2;
    actionBuilder.addAction(V4ActionType.WRAP, [ActionConstants.CONTRACT_BALANCE]);
  } else {
    if (!permit2 || !permitSignature2)
      throw new Error("Permit2 data and signature required for token swap");
    actionBuilder.addAction(V4ActionType.PERMIT2_PERMIT, [permit2, permitSignature2]).addAction(V4ActionType.PERMIT2_TRANSFER_FROM, [
      fromCurrencyAddress,
      ActionConstants.ADDRESS_THIS,
      amountIn2
    ]);
  }
  actionBuilder.addAction(V4ActionType.AERODROME_SWAP_EXACT_IN, [
    {
      path: getAerodromePath(fromCurrencyAddress, false),
      amountIn: amountIn2,
      amountOutMinimum: 0n
    }
  ]).addAction(V4ActionType.SWAP_EXACT_IN_SINGLE, [
    {
      poolKey: getPoolKey(auctionParams2),
      zeroForOne: !auctionParams2.isToken0,
      amountIn: ActionConstants.SWAP_CONTRACT_BALANCE,
      amountOutMinimum,
      hookData: "0x"
    }
  ]).addAction(V4ActionType.SETTLE, [
    auctionParams2.numeraire.address,
    ActionConstants.OPEN_DELTA,
    false
  ]).addAction(V4ActionType.TAKE_ALL, [auctionParams2.token.address, 0n]);
  const args = actionBuilder.buildExecuteArgs();
  {
    try {
      console.log("[swapExactIn] Simulating swap...");
      await simulateContract(client, {
        address: deltaRouterAddress,
        abi: deltaRouterAbi,
        functionName: "execute",
        args,
        value
      });
      console.log("[swapExactIn] Simulation successful");
    } catch (e) {
      console.error("[swapExactIn] Simulation failed:", e);
      throw e;
    }
  }
  return await client.writeContract({
    address: deltaRouterAddress,
    abi: deltaRouterAbi,
    functionName: "execute",
    args,
    value
  });
}
async function swapExactOut(fromCurrencyAddress, auctionParams2, amountOut2, amountInMaximum, permit2, permitSignature2) {
  const client = await getDrawbridge().getConnectorClient();
  let value = 0n;
  const actionBuilder = new V4DeltaActionBuilder();
  if (fromCurrencyAddress === wethCurrency.address) {
    value = amountInMaximum;
    actionBuilder.addAction(V4ActionType.WRAP, [ActionConstants.CONTRACT_BALANCE]);
  } else {
    if (!permit2 || !permitSignature2)
      throw new Error("Permit2 data and signature required for token swap");
    actionBuilder.addAction(V4ActionType.PERMIT2_PERMIT, [permit2, permitSignature2]).addAction(V4ActionType.PERMIT2_TRANSFER_FROM, [
      fromCurrencyAddress,
      ActionConstants.ADDRESS_THIS,
      amountInMaximum
    ]);
  }
  actionBuilder.addAction(V4ActionType.SWAP_EXACT_OUT_SINGLE, [
    {
      poolKey: getPoolKey(auctionParams2),
      zeroForOne: !auctionParams2.isToken0,
      amountOut: amountOut2,
      amountInMaximum: maxUint128,
      hookData: "0x"
    }
  ]).addAction(V4ActionType.AERODROME_SWAP_EXACT_OUT, [
    {
      path: getAerodromePath(fromCurrencyAddress, true),
      amountOut: ActionConstants.OPEN_DELTA,
      amountInMaximum
    }
  ]).addAction(V4ActionType.SETTLE, [
    auctionParams2.numeraire.address,
    ActionConstants.OPEN_DELTA,
    false
  ]).addAction(V4ActionType.TAKE_ALL, [auctionParams2.token.address, 0n]);
  if (fromCurrencyAddress === wethCurrency.address) {
    actionBuilder.addAction(V4ActionType.UNWRAP, [ActionConstants.CONTRACT_BALANCE]);
    actionBuilder.addAction(V4ActionType.SWEEP, [zeroAddress, ActionConstants.MSG_SENDER]);
  } else {
    actionBuilder.addAction(V4ActionType.SWEEP, [fromCurrencyAddress, ActionConstants.MSG_SENDER]);
  }
  return await client.writeContract({
    address: deltaRouterAddress,
    abi: deltaRouterAbi,
    functionName: "execute",
    args: actionBuilder.buildExecuteArgs(),
    value
  });
}
const balanceListeners = writable([]);
const tokenBalances = derived(
  balanceListeners,
  ($listeners, _, update) => {
    const unsubscribers = [];
    for (const { listener, currency } of $listeners) {
      unsubscribers.push(
        listener.subscribe((balance) => {
          update((balances) => {
            balances[currency.address] = {
              balance,
              formatted: Number(formatUnits(balance, currency.decimals))
            };
            return balances;
          });
        })
      );
    }
    return () => {
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  },
  {}
);
function asPublicClient(client) {
  return client;
}
function asWalletClient(client) {
  return client;
}
var SWAP_STATE = ((SWAP_STATE2) => {
  SWAP_STATE2["INIT"] = "INIT";
  SWAP_STATE2["AGREEMENT"] = "AGREEMENT";
  SWAP_STATE2["SIGN_AND_SWAP"] = "SIGN_AND_SWAP";
  SWAP_STATE2["SWAP_COMPLETE"] = "SWAP_COMPLETE";
  SWAP_STATE2["WALLET_LIMIT_REACHED"] = "WALLET_LIMIT_REACHED";
  SWAP_STATE2["ERROR"] = "ERROR";
  return SWAP_STATE2;
})(SWAP_STATE || {});
let swapStateValue = "INIT";
let auctionParams = null;
let quoter = null;
let amountIn = void 0;
let amountOut = void 0;
let isExactOut = false;
let permit = void 0;
let permitSignature = void 0;
let spentAmount = void 0;
let savedCountryCode = void 0;
let fromCurrency = wethCurrency;
let numeraireBalance = void 0;
let tokenBalance = void 0;
let swapReceipt = null;
let swapTxHash = void 0;
let eurcToUsdcRate = void 0;
let eurcToEthRate = void 0;
let currentPriceUsdc = void 0;
const VALID_TRANSITIONS = {
  ["INIT"]: (
    /* INIT */
    [
      "AGREEMENT",
      /* AGREEMENT */
      "SIGN_AND_SWAP",
      /* SIGN_AND_SWAP */
      "WALLET_LIMIT_REACHED",
      /* WALLET_LIMIT_REACHED */
      "ERROR"
      /* ERROR */
    ]
  ),
  ["AGREEMENT"]: (
    /* AGREEMENT */
    [
      "SIGN_AND_SWAP",
      /* SIGN_AND_SWAP */
      "ERROR"
      /* ERROR */
    ]
  ),
  ["SIGN_AND_SWAP"]: (
    /* SIGN_AND_SWAP */
    [
      "SWAP_COMPLETE",
      /* SWAP_COMPLETE */
      "ERROR"
      /* ERROR */
    ]
  ),
  ["SWAP_COMPLETE"]: (
    /* SWAP_COMPLETE */
    [
      "SIGN_AND_SWAP",
      /* SIGN_AND_SWAP */
      "ERROR"
      /* ERROR */
    ]
  ),
  ["WALLET_LIMIT_REACHED"]: (
    /* WALLET_LIMIT_REACHED */
    []
  ),
  ["ERROR"]: (
    /* ERROR */
    []
  )
};
const setState = (state) => {
  swapStateValue = state;
};
const resetState = () => {
  swapStateValue = "INIT";
};
const resetData = () => {
  auctionParams = null;
  quoter = null;
  amountIn = void 0;
  amountOut = void 0;
  isExactOut = false;
  permit = void 0;
  permitSignature = void 0;
  spentAmount = void 0;
  savedCountryCode = void 0;
  fromCurrency = wethCurrency;
  numeraireBalance = void 0;
  tokenBalance = void 0;
  swapReceipt = null;
  swapTxHash = void 0;
  eurcToUsdcRate = void 0;
  eurcToEthRate = void 0;
  currentPriceUsdc = void 0;
};
const transitionTo = (newState) => {
  if (newState === swapStateValue) return;
  const validTransitions = VALID_TRANSITIONS[swapStateValue];
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(void 0, void 0, `Invalid state transition from ${swapStateValue} to ${newState}`);
    errorHandler(err);
    return;
  }
  setState(newState);
};
const swapState = {
  state: {
    reset: resetState,
    set: setState,
    transitionTo,
    get current() {
      return swapStateValue;
    }
  },
  data: {
    // Getters
    get auctionParams() {
      return auctionParams;
    },
    get quoter() {
      return quoter;
    },
    get amountIn() {
      return amountIn;
    },
    get amountOut() {
      return amountOut;
    },
    get isExactOut() {
      return isExactOut;
    },
    get fromCurrency() {
      return fromCurrency;
    },
    get permit() {
      return permit;
    },
    get permitSignature() {
      return permitSignature;
    },
    get spentAmount() {
      return spentAmount;
    },
    get savedCountryCode() {
      return savedCountryCode;
    },
    get numeraireBalance() {
      return numeraireBalance;
    },
    get tokenBalance() {
      return tokenBalance;
    },
    get swapReceipt() {
      return swapReceipt;
    },
    get swapTxHash() {
      return swapTxHash;
    },
    get eurcToUsdcRate() {
      return eurcToUsdcRate;
    },
    get eurcToEthRate() {
      return eurcToEthRate;
    },
    get currentPriceUsdc() {
      return currentPriceUsdc;
    },
    // Setters
    setAuctionParams: (params) => {
      auctionParams = params;
    },
    setQuoter: (q) => {
      quoter = q;
    },
    setAmountIn: (amount) => {
      amountIn = amount;
    },
    setAmountOut: (amount) => {
      amountOut = amount;
    },
    setIsExactOut: (value) => {
      isExactOut = value;
    },
    setPermit: (p) => {
      permit = p;
    },
    setPermitSignature: (sig) => {
      permitSignature = sig;
    },
    setSpentAmount: (amount) => {
      spentAmount = amount;
    },
    setSavedCountryCode: (code) => {
      savedCountryCode = code;
    },
    setFromCurrency: (currency) => {
      fromCurrency = currency;
    },
    setNumeraireBalance: (balance) => {
      numeraireBalance = balance;
    },
    setTokenBalance: (balance) => {
      tokenBalance = balance;
    },
    setSwapReceipt: (receipt) => {
      swapReceipt = receipt;
    },
    setSwapTxHash: (hash) => {
      swapTxHash = hash;
    },
    setEurcToUsdcRate: (rate) => {
      eurcToUsdcRate = rate;
    },
    setEurcToEthRate: (rate) => {
      eurcToEthRate = rate;
    },
    setCurrentPriceUsdc: (price) => {
      currentPriceUsdc = price;
    },
    // Helper methods
    clearPermit: () => {
      permit = void 0;
      permitSignature = void 0;
    },
    reset: resetData
  }
};
function RemainingAllowance($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function isEthSelected() {
      return swapState.data.fromCurrency.address.toLowerCase() === wethCurrency.address.toLowerCase();
    }
    function getRemainingAllowanceEurc() {
      const spent = swapState.data.spentAmount;
      const auctionParams2 = swapState.data.auctionParams;
      if (spent === void 0 || !auctionParams2) return void 0;
      const spendLimitRaw = auctionParams2.spendLimitAmount;
      const decimals = auctionParams2.numeraire.decimals;
      const limitNumber = Number(spendLimitRaw);
      const hasEmbeddedDecimals = limitNumber > 1e6;
      const limitEurc = hasEmbeddedDecimals ? Number(formatUnits(BigInt(spendLimitRaw), decimals)) : limitNumber;
      const spentEurc = Number(formatUnits(spent, decimals));
      return limitEurc - spentEurc;
    }
    function getTotalAllowanceEurc() {
      const auctionParams2 = swapState.data.auctionParams;
      if (!auctionParams2) return void 0;
      const spendLimitRaw = auctionParams2.spendLimitAmount;
      const decimals = auctionParams2.numeraire.decimals;
      const limitNumber = Number(spendLimitRaw);
      const hasEmbeddedDecimals = limitNumber > 1e6;
      return hasEmbeddedDecimals ? Number(formatUnits(BigInt(spendLimitRaw), decimals)) : limitNumber;
    }
    function getRate() {
      return isEthSelected() ? swapState.data.eurcToEthRate : swapState.data.eurcToUsdcRate;
    }
    function getRemainingAllowance() {
      const remainingEurc = getRemainingAllowanceEurc();
      const rate = getRate();
      if (remainingEurc === void 0 || rate === void 0) return void 0;
      return remainingEurc * rate;
    }
    function getTotalAllowance() {
      const totalEurc = getTotalAllowanceEurc();
      const rate = getRate();
      if (totalEurc === void 0 || rate === void 0) return void 0;
      return totalEurc * rate;
    }
    function formatValue(value) {
      if (value === void 0) return "...";
      return isEthSelected() ? value.toFixed(6) : value.toFixed(2);
    }
    const remaining = getRemainingAllowance();
    const total = getTotalAllowance();
    const currencySymbol = isEthSelected() ? "ETH" : "USDC";
    const currencyPrefix = isEthSelected() ? "" : "$";
    if (swapState.data.auctionParams) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="remaining-allowance svelte-19lxe7y"><div class="label svelte-19lxe7y">Remaining spend limit (${escape_html(currencySymbol)})</div> <div class="value-row svelte-19lxe7y"><span class="amount svelte-19lxe7y">${escape_html(currencyPrefix)}${escape_html(formatValue(remaining))}</span> <span class="total svelte-19lxe7y">of ${escape_html(currencyPrefix)}${escape_html(formatValue(total))} total</span></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function SwapForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isUsingEstimate = false;
    function getCurrencyBalance(address) {
      return store_get($$store_subs ??= {}, "$tokenBalances", tokenBalances)[address]?.formatted;
    }
    function hasZeroBalance(address) {
      const balance = getCurrencyBalance(address);
      return balance === void 0 || balance === 0;
    }
    function getSelectedCurrencyBalance() {
      const fromCurrency2 = swapState.data.fromCurrency;
      if (!fromCurrency2) return void 0;
      return getCurrencyBalance(fromCurrency2.address);
    }
    function getAmountInNumber() {
      const amountIn2 = swapState.data.amountIn;
      if (amountIn2 === void 0) return void 0;
      if (amountIn2 === 0n) return 0;
      return Number(formatUnits(amountIn2, swapState.data.fromCurrency.decimals));
    }
    function isAmountExceedsBalance() {
      const balance = getSelectedCurrencyBalance();
      const amountIn2 = getAmountInNumber();
      if (balance === void 0 || amountIn2 === void 0) return false;
      return amountIn2 > balance;
    }
    function isBelowMinimum() {
      const amountIn2 = swapState.data.amountIn;
      const amountOut2 = swapState.data.amountOut;
      const auctionParams2 = swapState.data.auctionParams;
      if (!auctionParams2) return false;
      if (amountIn2 === 0n) return true;
      if (amountOut2 === void 0) return false;
      const ratAmount = Number(formatUnits(amountOut2, auctionParams2.token.decimals));
      return ratAmount < 1;
    }
    function handleCurrencyChange(event) {
      const select = event.target;
      const selected = availableCurrencies.find((c) => c.address === select.value);
      if (selected) {
        swapState.data.setFromCurrency(selected);
        swapState.data.setAmountIn(void 0);
        swapState.data.setAmountOut(void 0);
        swapState.data.clearPermit();
      }
    }
    function getAmountInDisplay() {
      const amountIn2 = swapState.data.amountIn;
      if (amountIn2 === 0n) return "0";
      const auctionParams2 = swapState.data.auctionParams;
      if (!amountIn2 || !auctionParams2) return "";
      return formatUnits(amountIn2, swapState.data.fromCurrency.decimals);
    }
    function getAmountOut() {
      const amountOut2 = swapState.data.amountOut;
      if (amountOut2 === 0n) return 0;
      const auctionParams2 = swapState.data.auctionParams;
      if (!amountOut2 || !auctionParams2) return void 0;
      return Number(formatUnits(amountOut2, auctionParams2.token.decimals));
    }
    function getInGameRats() {
      const amountOut2 = swapState.data.amountOut;
      const auctionParams2 = swapState.data.auctionParams;
      if (!amountOut2 || !auctionParams2) return void 0;
      const ratAmount = Number(formatUnits(amountOut2, auctionParams2.token.decimals));
      return Math.floor(ratAmount / 100);
    }
    $$renderer2.push(`<div class="swap-form svelte-1s2xrfj">`);
    RemainingAllowance($$renderer2);
    $$renderer2.push(`<!----> `);
    if (swapState.data.currentPriceUsdc !== void 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="current-price svelte-1s2xrfj">Current Price: <span class="price">${escape_html(swapState.data.currentPriceUsdc.toFixed(4))}</span> USDC per
      $RAT</div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> `);
    if (swapState.data.auctionParams) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="inputs-section svelte-1s2xrfj"><div class="input-group svelte-1s2xrfj"><label for="currency-select" class="svelte-1s2xrfj">Pay with:</label> `);
      $$renderer2.select(
        {
          id: "currency-select",
          value: swapState.data.fromCurrency.address,
          onchange: handleCurrencyChange,
          class: ""
        },
        ($$renderer3) => {
          $$renderer3.push(`<!--[-->`);
          const each_array = ensure_array_like(availableCurrencies);
          for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
            let currency = each_array[$$index];
            $$renderer3.option(
              {
                value: currency.address,
                disabled: hasZeroBalance(currency.address),
                class: ""
              },
              ($$renderer4) => {
                $$renderer4.push(`${escape_html(currency.symbol)}${escape_html(hasZeroBalance(currency.address) ? " (no balance)" : "")}`);
              },
              "svelte-1s2xrfj",
              { disabled: hasZeroBalance(currency.address) }
            );
          }
          $$renderer3.push(`<!--]-->`);
        },
        "svelte-1s2xrfj"
      );
      $$renderer2.push(`</div> <div class="input-group svelte-1s2xrfj"><div${attr_class("input-with-currency svelte-1s2xrfj", void 0, { "error": isAmountExceedsBalance() })}><span class="currency-label svelte-1s2xrfj">${escape_html(swapState.data.fromCurrency.symbol)}</span> <input id="numeraire-input" type="text" inputmode="decimal" placeholder="0.0"${attr("value", getAmountInDisplay())} class="svelte-1s2xrfj"/> `);
      if (getSelectedCurrencyBalance() !== void 0 && getSelectedCurrencyBalance() > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<button class="max-button svelte-1s2xrfj" type="button">MAX</button>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div> <div class="balance-row svelte-1s2xrfj"><span${attr_class("balance-text svelte-1s2xrfj", void 0, { "error": isAmountExceedsBalance() })}>Balance: ${escape_html(getSelectedCurrencyBalance()?.toLocaleString(void 0, { maximumFractionDigits: 6 }) ?? "...")}
            ${escape_html(swapState.data.fromCurrency.symbol)}</span> `);
      if (isAmountExceedsBalance()) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<span class="error-text svelte-1s2xrfj">· Insufficient</span>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div> <div class="input-group svelte-1s2xrfj"><div${attr_class("input-with-currency svelte-1s2xrfj", void 0, { "error": isBelowMinimum(), "estimate": isUsingEstimate })}><span class="currency-label svelte-1s2xrfj">$RAT</span> <input id="token-input" type="text" readonly placeholder="0"${attr("value", getAmountOut() ?? "")} class="svelte-1s2xrfj"/></div> <div class="output-row svelte-1s2xrfj"><span${attr_class("error-text svelte-1s2xrfj", void 0, { "visible": isBelowMinimum() })}>Minimum purchase is 1 $RAT</span> `);
      {
        $$renderer2.push("<!--[!-->");
        $$renderer2.push(`<span class="subtext svelte-1s2xrfj">minimum guaranteed</span>`);
      }
      $$renderer2.push(`<!--]--></div> <div class="rat-subjects-label svelte-1s2xrfj">≈ <strong class="svelte-1s2xrfj">${escape_html(getInGameRats() ?? 0)}</strong> Rat Subjects</div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
const CURRENCY_SYMBOL = "¤";
function BigButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      text,
      cost,
      tippyText,
      disabled = false,
      extraBig = false,
      onclick
    } = $$props;
    Tooltip($$renderer2, {
      content: tippyText,
      children: ($$renderer3) => {
        $$renderer3.push(`<button${attr_class("svelte-19cqyry", void 0, { "disabled": disabled, "extraBig": extraBig })}><div class="button-content svelte-19cqyry"><span class="button-text svelte-19cqyry">${escape_html(text)}</span> `);
        if (cost) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="button-cost svelte-19cqyry">(${escape_html(CURRENCY_SYMBOL)}${escape_html(cost)})</span>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></div> <div class="canvas-container svelte-19cqyry">`);
        ShaderLocal($$renderer3);
        $$renderer3.push(`<!----></div></button>`);
      }
    });
  });
}
function Tooltip$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      content,
      props = {},
      svg = false,
      allowHTML = true,
      isPhone: isPhone2 = false,
      children
    } = $$props;
    ({ ...props });
    if (svg) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<g class="svelte-crphuq">`);
      children($$renderer2);
      $$renderer2.push(`<!----></g>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<span class="svelte-crphuq">`);
      children($$renderer2);
      $$renderer2.push(`<!----></span>`);
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function SmallButton$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      text,
      cost,
      tippyText,
      disabled = false,
      extraClass = "",
      isPhone: isPhone2 = false,
      onmousedown,
      onmouseup,
      onclick
    } = $$props;
    Tooltip$1($$renderer2, {
      content: tippyText,
      isPhone: isPhone2,
      children: ($$renderer3) => {
        $$renderer3.push(`<button${attr_class(clsx(extraClass), "svelte-13306o8", { "disabled": disabled })}><span class="button-text svelte-13306o8">${escape_html(text)}</span> `);
        if (cost) {
          $$renderer3.push("<!--[-->");
          $$renderer3.push(`<span class="button-cost svelte-13306o8">(${escape_html(cost)})</span>`);
        } else {
          $$renderer3.push("<!--[!-->");
        }
        $$renderer3.push(`<!--]--></button>`);
      }
    });
  });
}
function SmallButton($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let {
      text,
      cost,
      tippyText,
      disabled = false,
      extraClass = "",
      onmouseup,
      onclick
    } = $$props;
    const handleMousedown = () => {
      playSound("ratfunUI", "smallButtonDown");
    };
    const handleMouseup = (e) => {
      playSound("ratfunUI", "smallButtonUp");
      onmouseup?.(e);
    };
    SmallButton$1($$renderer2, {
      text,
      cost,
      tippyText,
      disabled,
      extraClass,
      isPhone: store_get($$store_subs ??= {}, "$isPhone", isPhone),
      onmousedown: handleMousedown,
      onmouseup: handleMouseup,
      onclick
    });
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function Checkbox($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      checked = false,
      disabled = false,
      onchange,
      ariaLabel = "Toggle checkbox"
    } = $$props;
    $$renderer2.push(`<button${attr_class("checkbox svelte-aa82gq", void 0, { "checked": checked, "disabled": disabled })}${attr("disabled", disabled, true)} type="button"${attr("aria-checked", checked)} role="checkbox"${attr("aria-label", ariaLabel)}><span class="dot svelte-aa82gq"></span></button>`);
  });
}
function Mascot$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      text = [],
      smallText = false,
      hugeText = false,
      centerText = false,
      isGameMascot = false,
      closeTextOnClick = false,
      finishTextOnClick = false
    } = $$props;
    let showBubble = true;
    gsap.timeline({ paused: true });
    gsap.timeline({ repeat: -1, yoyo: true });
    gsap.timeline({ repeat: -1, yoyo: true });
    gsap.timeline({ repeat: -1, yoyo: true });
    $$renderer2.push(`<div${attr_class("mascot-container svelte-o118yy", void 0, { "clickable": closeTextOnClick || finishTextOnClick })}>`);
    if (text.length > 0 && showBubble) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div${attr_class("bubble svelte-o118yy", void 0, {
        "small-text": smallText,
        "huge-text": hugeText,
        "center-text": centerText,
        "isGameMascot": isGameMascot
      })}></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="mascot svelte-o118yy"><div class="layer layer-4 svelte-o118yy"><img src="/images/mascot/mascot-layer-4.png"${attr("draggable", false)} alt="RAT.FUN" class="svelte-o118yy"/></div> <div class="layer layer-3 svelte-o118yy"><img src="/images/mascot/mascot-layer-3.png"${attr("draggable", false)} alt="RAT.FUN" class="svelte-o118yy"/></div> <div class="layer layer-2 svelte-o118yy"><img src="/images/mascot/mascot-layer-2.png"${attr("draggable", false)} alt="RAT.FUN" class="svelte-o118yy"/></div> <div class="layer layer-1 svelte-o118yy"><img src="/images/mascot/mascot-layer-1.png"${attr("draggable", false)} alt="RAT.FUN" class="svelte-o118yy"/></div></div></div>`);
  });
}
function Mascot($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let {
      entranceOn = false,
      bigDanceOn = false,
      smallDanceOn = false,
      headBobOn = false,
      text = [],
      smallText = false,
      hugeText = false,
      centerText = false,
      isGameMascot = false,
      closeTextOnClick = false,
      finishTextOnClick = false,
      autoHideAfter = 0
    } = $$props;
    Mascot$1($$renderer2, {
      text,
      smallText,
      hugeText,
      centerText,
      isGameMascot,
      closeTextOnClick,
      finishTextOnClick
    });
  });
}
function ShaderLocal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    const localShaderManager = createShaderManager({
      errorHandler,
      singleFrameRender: () => get$2(singleFrameRender)
    });
    onDestroy(() => {
      localShaderManager.destroy();
    });
    $$renderer2.push(`<div class="shader-container svelte-19wnnms"><canvas class="shader-canvas svelte-19wnnms"></canvas></div>`);
  });
}
function Tooltip($$renderer, $$props) {
  var $$store_subs;
  let {
    content,
    props = {},
    svg = false,
    allowHTML = false,
    children
  } = $$props;
  Tooltip$1($$renderer, {
    content,
    props,
    svg,
    allowHTML,
    isPhone: store_get($$store_subs ??= {}, "$isPhone", isPhone),
    children: ($$renderer2) => {
      children($$renderer2);
      $$renderer2.push(`<!---->`);
    }
  });
  if ($$store_subs) unsubscribe_stores($$store_subs);
}
function Toasts$1($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { toasts } = $$props;
    if (toasts.length > 0) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="toasts-container svelte-1yu5qxk"><!--[-->`);
      const each_array = ensure_array_like(toasts);
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let toast = each_array[$$index];
        $$renderer2.push(`<div${attr_class(`toast toast-${stringify(toast.type)}`, "svelte-1yu5qxk")}><div class="toast-content svelte-1yu5qxk">${escape_html(toast.message.length > 160 ? toast.message.substring(0, 160) + "..." : toast.message)}</div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
  });
}
function Toasts($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    Toasts$1($$renderer2, { toasts: toastManager.toasts });
  });
}
function Agreement($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let accepted = false;
    let isProcessing = false;
    async function getCountryCodeFromIP() {
      try {
        const response = await fetch("https://www.cloudflare.com/cdn-cgi/trace");
        const text = await response.text();
        const countryLine = text.split("\n").find((line) => line.startsWith("loc="));
        const countryCode = countryLine?.split("=")[1]?.trim();
        if (countryCode && countryCode.length === 2) {
          console.log("[CountryCode] Detected country from IP:", countryCode);
          return countryCode;
        }
        console.warn("[CountryCode] Invalid country code format, using fallback");
        return "US";
      } catch (error2) {
        console.error("[CountryCode] Failed to fetch country from IP:", error2);
        return "US";
      }
    }
    async function sendCountryCode() {
      if (isProcessing) return;
      isProcessing = true;
      try {
        if (!store_get($$store_subs ??= {}, "$userAddress", userAddress)) throw new Error("wallet not connected");
        const auctionParams2 = swapState.data.auctionParams;
        if (!auctionParams2) throw new Error("auction params not initialized");
        const countryCode = await getCountryCodeFromIP();
        const client = await getDrawbridge().getConnectorClient();
        const txHash = await buyLimitSetCountryCode(asWalletClient(client), auctionParams2.token.address, countryCode);
        await asPublicClient(store_get($$store_subs ??= {}, "$publicClientStore", publicClient)).waitForTransactionReceipt({ hash: txHash });
        swapState.data.setSavedCountryCode(countryCode);
        swapState.state.transitionTo(SWAP_STATE.SIGN_AND_SWAP);
      } catch (error2) {
        console.error("[Agreement] Error sending country code:", error2);
        throw error2;
      } finally {
        isProcessing = false;
      }
    }
    $$renderer2.push(`<div class="agreement-container svelte-5xuhpv"><label class="agreement-label svelte-5xuhpv">`);
    Checkbox($$renderer2, { checked: accepted, onchange: () => accepted = !accepted });
    $$renderer2.push(`<!----> <span class="agreement-text svelte-5xuhpv">I accept the <a href="/documents/sale-terms.pdf" target="_blank" rel="noopener noreferrer" class="svelte-5xuhpv">Sale Terms</a>, <a href="/documents/white-paper.pdf" target="_blank" rel="noopener noreferrer" class="svelte-5xuhpv">White Paper</a> and <a href="/documents/privacy-notice.pdf" target="_blank" rel="noopener noreferrer" class="svelte-5xuhpv">Privacy Notice</a>. I understand that $RAT has no profit or governance rights and that RAT.FUN is experimental.</span></label></div> <div class="button-container svelte-5xuhpv">`);
    BigButton($$renderer2, {
      text: isProcessing ? "Processing..." : "Continue",
      disabled: !accepted || isProcessing,
      onclick: () => {
        sendCountryCode();
      }
    });
    $$renderer2.push(`<!----></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function SignAndSwap($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isProcessing = false;
    let processingStep = "";
    let waiveWithdrawal = false;
    function isAmountExceedsBalance() {
      const fromCurrency2 = swapState.data.fromCurrency;
      const amountIn2 = swapState.data.amountIn;
      if (!fromCurrency2 || amountIn2 === void 0) return false;
      const balance = store_get($$store_subs ??= {}, "$tokenBalances", tokenBalances)[fromCurrency2.address];
      if (!balance) return false;
      return amountIn2 > balance.balance;
    }
    function isBelowMinimum() {
      const amountIn2 = swapState.data.amountIn;
      const amountOut2 = swapState.data.amountOut;
      const auctionParams2 = swapState.data.auctionParams;
      if (!auctionParams2) return false;
      if (amountIn2 === 0n) return true;
      if (amountOut2 === void 0) return false;
      const ratAmount = Number(formatUnits(amountOut2, auctionParams2.token.decimals));
      return ratAmount < 1;
    }
    function withSlippage(amount, isOut) {
      const maxSlippageBps = 200n;
      return amount * (10000n + (isOut ? -1n : 1n) * maxSlippageBps) / 10000n;
    }
    async function signAndSwap() {
      if (isProcessing) return;
      isProcessing = true;
      try {
        if (!store_get($$store_subs ??= {}, "$userAddress", userAddress)) throw new Error("wallet not connected");
        const auctionParams2 = swapState.data.auctionParams;
        const amountIn2 = swapState.data.amountIn;
        const amountOut2 = swapState.data.amountOut;
        const isExactOut2 = swapState.data.isExactOut;
        const fromCurrency2 = swapState.data.fromCurrency;
        if (!auctionParams2) throw new Error("auction params not initialized");
        if (amountIn2 === void 0) throw new Error("amountIn is undefined");
        if (amountOut2 === void 0) throw new Error("amountOut is undefined");
        console.log("[SignAndSwap] Starting swap flow for", fromCurrency2.symbol);
        const client = await getDrawbridge().getConnectorClient();
        const adaptedPublicClient = asPublicClient(store_get($$store_subs ??= {}, "$publicClientStore", publicClient));
        if (isPermit2Required(fromCurrency2.address)) {
          const needsPermit2Approval = await isPermit2AllowanceRequired(adaptedPublicClient, store_get($$store_subs ??= {}, "$userAddress", userAddress), fromCurrency2.address, maxUint128);
          if (needsPermit2Approval) {
            console.log("[SignAndSwap] Step 1: Approving Permit2...");
            processingStep = "Approving token access...";
            const { receipt } = await permit2AllowMax(adaptedPublicClient, asWalletClient(client), fromCurrency2.address);
            if (receipt.status !== "success") {
              throw new Error("Permit2 approval failed");
            }
            console.log("[SignAndSwap] Permit2 approved");
          }
          console.log("[SignAndSwap] Step 2: Signing permit...");
          processingStep = "Sign permit";
          const extendedClient = client.extend((client2) => ({ signTypedData: (args) => signTypedData(client2, args) }));
          const amountPadded = isExactOut2 ? withSlippage(amountIn2, false) : amountIn2;
          const result = await signPermit2(adaptedPublicClient, extendedClient, fromCurrency2.address, deltaRouterAddress, amountPadded);
          swapState.data.setPermit(result.permit);
          swapState.data.setPermitSignature(result.permitSignature);
          console.log("[SignAndSwap] Permit signed successfully");
        }
        console.log("[SignAndSwap] Step 3: Re-quoting for fresh price...");
        processingStep = "Getting fresh quote...";
        let freshAmountOut;
        let freshAmountIn;
        if (isExactOut2) {
          const freshQuote = await quoteExactOut(fromCurrency2.address, auctionParams2, amountOut2);
          freshAmountIn = freshQuote.amountInInitial;
          freshAmountOut = amountOut2;
          const quoteDrift = Number(freshAmountIn - amountIn2) / Number(amountIn2);
          console.log(`[SignAndSwap] Fresh quote: ${freshAmountIn} ${fromCurrency2.symbol} (was ${amountIn2}, drift: ${(quoteDrift * 100).toFixed(2)}%)`);
        } else {
          const freshQuote = await quoteExactIn(fromCurrency2.address, auctionParams2, amountIn2);
          freshAmountOut = freshQuote.amountOutFinal;
          freshAmountIn = amountIn2;
          const quoteDrift = Number(freshAmountOut - amountOut2) / Number(amountOut2);
          console.log(`[SignAndSwap] Fresh quote: ${freshAmountOut} RAT (was ${amountOut2}, drift: ${(quoteDrift * 100).toFixed(2)}%)`);
        }
        console.log("[SignAndSwap] Step 4: Executing swap...");
        processingStep = "Confirm transaction";
        console.log("[SignAndSwap] Swap params:", {
          fromCurrency: fromCurrency2.symbol,
          amountIn: freshAmountIn.toString(),
          amountOut: freshAmountOut.toString(),
          isExactOut: isExactOut2,
          permit: swapState.data.permit,
          permitSignature: swapState.data.permitSignature
        });
        let txHash;
        if (isExactOut2) {
          txHash = await swapExactOut(fromCurrency2.address, auctionParams2, freshAmountOut, withSlippage(freshAmountIn, false), swapState.data.permit, swapState.data.permitSignature);
        } else {
          txHash = await swapExactIn(fromCurrency2.address, auctionParams2, freshAmountIn, withSlippage(freshAmountOut, true), swapState.data.permit, swapState.data.permitSignature);
        }
        swapState.data.setSwapTxHash(txHash);
        const swapResult = await waitForDopplerSwapReceipt(adaptedPublicClient, txHash);
        console.log("[SignAndSwap] Swap executed successfully:", swapResult);
        swapState.data.setSwapReceipt(swapResult);
        waiveWithdrawal = false;
        swapState.state.transitionTo(SWAP_STATE.SWAP_COMPLETE);
        for (const { listener, currency } of store_get($$store_subs ??= {}, "$balanceListeners", balanceListeners)) {
          if ([auctionParams2.token.address, fromCurrency2.address].includes(currency.address)) {
            listener.triggerUpdate();
          }
        }
      } catch (error2) {
        console.error("[SignAndSwap] Error during swap:", error2);
        throw error2;
      } finally {
        isProcessing = false;
        processingStep = "";
      }
    }
    $$renderer2.push(`<div class="withdrawal-container svelte-n7mn8x"><label class="withdrawal-label svelte-n7mn8x">`);
    Checkbox($$renderer2, {
      checked: waiveWithdrawal,
      onchange: () => waiveWithdrawal = !waiveWithdrawal
    });
    $$renderer2.push(`<!----> <span class="withdrawal-text svelte-n7mn8x">I want immediate delivery and waive my 14-day withdrawal right for this purchase.</span></label></div> <div class="button-container svelte-n7mn8x">`);
    BigButton($$renderer2, {
      disabled: !swapState.data.amountIn || swapState.data.amountOut === void 0 || isProcessing || !waiveWithdrawal || isAmountExceedsBalance() || isBelowMinimum(),
      text: isProcessing ? processingStep || "Processing..." : "Buy $RAT",
      onclick: () => {
        signAndSwap();
      }
    });
    $$renderer2.push(`<!----></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
async function addRatTokenToWallet(tokenAddress, tokenSymbol, tokenDecimals) {
  const connectorClient = await getDrawbridge().getConnectorClient();
  return watchAsset(connectorClient, {
    type: "ERC20",
    options: {
      address: tokenAddress,
      symbol: tokenSymbol,
      decimals: tokenDecimals
    }
  });
}
function SwapComplete($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function getReceiptData() {
      const receipt = swapState.data.swapReceipt;
      const auctionParams2 = swapState.data.auctionParams;
      const fromCurrency2 = swapState.data.fromCurrency;
      const amountIn2 = swapState.data.amountIn;
      if (!receipt || !auctionParams2) {
        return null;
      }
      const receiptLog = receipt.find((log) => log.eventName === "Receipt");
      if (!receiptLog || receiptLog.eventName !== "Receipt") {
        return null;
      }
      const { buyer, countryCode, tokenAmount } = receiptLog.args;
      const spentAmount2 = amountIn2 !== void 0 ? formatUnits(amountIn2, fromCurrency2.decimals) : null;
      const tokenAmountRaw = Number(formatUnits(tokenAmount, auctionParams2.token.decimals));
      return {
        buyer,
        countryCode,
        tokenAmount: tokenAmountRaw.toFixed(4),
        spentAmount: spentAmount2,
        tokenSymbol: auctionParams2.token.symbol,
        spentSymbol: fromCurrency2.symbol,
        inGameRats: Math.floor(tokenAmountRaw / 100)
      };
    }
    const receiptData = getReceiptData();
    const basescanUrl = swapState.data.swapTxHash ? `https://basescan.org/tx/${swapState.data.swapTxHash}` : null;
    function goToGame() {
      window.open("https://rat.fun", "_blank");
    }
    async function handleAddToken() {
      const auctionParams2 = swapState.data.auctionParams;
      if (!auctionParams2) return;
      try {
        await addRatTokenToWallet(auctionParams2.token.address, auctionParams2.token.symbol, auctionParams2.token.decimals);
      } catch (e) {
        console.error("Failed to add token to wallet:", e);
      }
    }
    $$renderer2.push(`<div class="swap-complete svelte-3ufw3x"><div class="success-header svelte-3ufw3x"><h2 class="svelte-3ufw3x">Success</h2></div> `);
    if (receiptData) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="receipt-details svelte-3ufw3x">`);
      if (receiptData.spentAmount) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="receipt-row svelte-3ufw3x"><span class="label svelte-3ufw3x">You spent:</span> <span class="value svelte-3ufw3x">${escape_html(receiptData.spentAmount)}
            ${escape_html(receiptData.spentSymbol)}</span></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--> <div class="receipt-row svelte-3ufw3x"><span class="label svelte-3ufw3x">You received:</span> <span class="value highlight svelte-3ufw3x">${escape_html(receiptData.tokenAmount)}
          $${escape_html(receiptData.tokenSymbol)}</span></div> `);
      if (basescanUrl) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<a${attr("href", basescanUrl)} target="_blank" rel="noopener noreferrer" class="tx-link svelte-3ufw3x">View transaction on Basescan</a>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
      $$renderer2.push(`<div class="receipt-details svelte-3ufw3x"><div class="receipt-row svelte-3ufw3x"><span class="value svelte-3ufw3x">Swap completed successfully</span></div></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="add-token-container svelte-3ufw3x">`);
    SmallButton($$renderer2, { text: "Add token info to wallet", onclick: handleAddToken });
    $$renderer2.push(`<!----></div> <div class="actions svelte-3ufw3x">`);
    BigButton($$renderer2, { text: "Play Game", onclick: goToGame });
    $$renderer2.push(`<!----></div></div>`);
  });
}
function Swap($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="swap-container svelte-1a0qmq1">`);
    if (swapState.state.current === SWAP_STATE.AGREEMENT) {
      $$renderer2.push("<!--[-->");
      Agreement($$renderer2);
    } else {
      $$renderer2.push("<!--[!-->");
      if (swapState.state.current === SWAP_STATE.SIGN_AND_SWAP) {
        $$renderer2.push("<!--[-->");
        SwapForm($$renderer2);
        $$renderer2.push(`<!----> `);
        SignAndSwap($$renderer2);
        $$renderer2.push(`<!---->`);
      } else {
        $$renderer2.push("<!--[!-->");
        if (swapState.state.current === SWAP_STATE.SWAP_COMPLETE) {
          $$renderer2.push("<!--[-->");
          SwapComplete($$renderer2);
        } else {
          $$renderer2.push("<!--[!-->");
          $$renderer2.push(`LOADING...`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
function WalletSelectModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { show = false, connectors, connecting, onSelect } = $$props;
    if (show) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="wallet-modal svelte-12h5apl"><div class="modal-content svelte-12h5apl"><button class="close-btn svelte-12h5apl">×</button> <h2 class="svelte-12h5apl">Connect Wallet</h2> `);
      if (connectors.length > 0) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="wallet-options svelte-12h5apl"><!--[-->`);
        const each_array = ensure_array_like(connectors);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let connector = each_array[$$index];
          $$renderer2.push(`<div class="button-container svelte-12h5apl">`);
          SmallButton$1($$renderer2, {
            text: connector.name,
            onclick: () => onSelect(connector.id),
            disabled: connecting
          });
          $$renderer2.push(`<!----></div>`);
        }
        $$renderer2.push(`<!--]--></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { show });
  });
}
function NoWalletsModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { show = false } = $$props;
    if (show) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="wallet-modal svelte-32b9zz"><div class="modal-content svelte-32b9zz"><button class="close-btn svelte-32b9zz">×</button> <h2 class="svelte-32b9zz">No wallets found</h2> <p>No wallets found. Please install a wallet app to continue.</p></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { show });
  });
}
function DeepLinkSelectModal($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let { show = false, deeplinks } = $$props;
    function openWalletDeeplink(walletId) {
      const deeplink = deeplinks[walletId];
      if (!deeplink) return;
      const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
      const url = isIOS ? deeplink.ios : deeplink.android;
      window.location.href = url;
    }
    if (show) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="wallet-modal svelte-1y8ct80"><div class="modal-content svelte-1y8ct80"><button class="close-btn svelte-1y8ct80">×</button> <h2 class="svelte-1y8ct80">Open in wallet app</h2> <div class="wallet-options svelte-1y8ct80"><!--[-->`);
      const each_array = ensure_array_like(Object.entries(deeplinks));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        let [walletId, wallet] = each_array[$$index];
        $$renderer2.push(`<div class="button-container svelte-1y8ct80">`);
        SmallButton$1($$renderer2, {
          text: wallet.name,
          onclick: () => openWalletDeeplink(walletId)
        });
        $$renderer2.push(`<!----></div>`);
      }
      $$renderer2.push(`<!--]--></div></div></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    bind_props($$props, { show });
  });
}
function generateWalletDeeplinks(domain) {
  const encodedUrl = encodeURIComponent(`https://${domain}`);
  return {
    coinbase: {
      ios: `https://go.cb-w.com/dapp?cb_url=${encodedUrl}`,
      android: `https://go.cb-w.com/dapp?cb_url=${encodedUrl}`,
      name: "BASE"
    },
    metamask: {
      ios: `https://link.metamask.io/dapp/${domain}`,
      android: `https://link.metamask.io/dapp/${domain}`,
      name: "MetaMask"
    },
    phantom: {
      ios: `https://phantom.app/ul/browse/${encodedUrl}`,
      android: `https://phantom.app/ul/browse/${encodedUrl}`,
      name: "Phantom"
    },
    rabby: {
      ios: `rabby://dapp?url=${encodedUrl}`,
      android: `rabby://dapp?url=${encodedUrl}`,
      name: "Rabby"
    }
  };
}
const PREFERRED_WALLET_ORDER = ["metamask", "phantom", "rabby", "coinbase"];
function getWalletPriority(connector) {
  const searchTerm = `${connector.id} ${connector.name}`.toLowerCase();
  for (let i = 0; i < PREFERRED_WALLET_ORDER.length; i++) {
    if (searchTerm.includes(PREFERRED_WALLET_ORDER[i])) {
      return i;
    }
  }
  return 9999;
}
function detectProviderName() {
  if (typeof window === "undefined" || !window.ethereum) {
    return "Wallet";
  }
  const eth = window.ethereum;
  if (eth.isCoinbaseWallet) return "BASE Wallet";
  if (eth.isMetaMask) return "MetaMask";
  if (eth.isRabby) return "Rabby";
  if (eth.isPhantom) return "Phantom";
  return "Wallet";
}
function isUserRejectionError(error2) {
  if (!error2) return false;
  const errorObj = error2;
  const code = errorObj?.code;
  const message = errorObj?.message?.toLowerCase() ?? "";
  const details = errorObj?.details?.toLowerCase() ?? "";
  if (code === 4001 || code === "ACTION_REJECTED") return true;
  const rejectionPhrases = [
    "user rejected",
    "user denied",
    "rejected by user",
    "user cancelled"
  ];
  return rejectionPhrases.some((phrase) => message.includes(phrase) || details.includes(phrase));
}
function createWalletConnection(options) {
  const { getDrawbridge: getDrawbridge2, isPhone: isPhone2 = false, onSuccess, onError } = options;
  let connecting = false;
  let showWalletSelect = false;
  let showNoWalletsModal = false;
  let showDeepLinkSelect = false;
  let availableConnectors = [];
  function prepareConnectors() {
    const drawbridge = getDrawbridge2();
    const connectors = drawbridge.getAvailableConnectors();
    const hasInjectedProvider = typeof window !== "undefined" && typeof window.ethereum !== "undefined";
    console.log("[WalletConnection] Connector setup:", { connectors: connectors.length, hasInjectedProvider });
    const filteredConnectors = connectors.filter((c) => c.id !== "injected" && c.name !== "Injected");
    if (filteredConnectors.length === 0 && connectors.length > 0 && hasInjectedProvider) {
      console.log("[WalletConnection] No specific wallets but window.ethereum exists - keeping injected");
      const injectedConnector = connectors.find((c) => c.id === "injected");
      if (injectedConnector) {
        availableConnectors = [
          {
            id: injectedConnector.id,
            name: detectProviderName(),
            type: injectedConnector.type
          }
        ];
      } else {
        availableConnectors = connectors;
      }
    } else if (filteredConnectors.length === 0 && !hasInjectedProvider) {
      console.log("[WalletConnection] No wallets detected");
      availableConnectors = [];
    } else {
      availableConnectors = filteredConnectors.sort((a, b) => getWalletPriority(a) - getWalletPriority(b));
    }
    console.log("[WalletConnection] Final connectors:", availableConnectors);
  }
  async function connectWallet(connectorId) {
    console.log("[WalletConnection] Connecting to:", connectorId);
    try {
      connecting = true;
      const drawbridge = getDrawbridge2();
      await drawbridge.connectWallet(connectorId);
      console.log("[WalletConnection] Wallet connected successfully");
      showWalletSelect = false;
      if (onSuccess) {
        await onSuccess();
      }
    } catch (error2) {
      console.error("[WalletConnection] Connection failed:", error2);
      if (onError) {
        const message = isUserRejectionError(error2) ? "Wallet connection rejected by user" : "Failed to connect wallet";
        onError(error2, message);
      }
    } finally {
      connecting = false;
    }
  }
  function handleClick() {
    if (availableConnectors.length === 0) {
      console.log("[WalletConnection] No connectors available");
      if (isPhone2) {
        showDeepLinkSelect = true;
      } else {
        showNoWalletsModal = true;
      }
      return;
    }
    if (availableConnectors.length === 1 && !isPhone2) {
      console.log("[WalletConnection] Only one connector available, auto-connecting");
      connectWallet(availableConnectors[0].id);
      return;
    }
    showWalletSelect = true;
  }
  return {
    // State (reactive via getters)
    get connecting() {
      return connecting;
    },
    get showWalletSelect() {
      return showWalletSelect;
    },
    set showWalletSelect(value) {
      showWalletSelect = value;
    },
    get showNoWalletsModal() {
      return showNoWalletsModal;
    },
    set showNoWalletsModal(value) {
      showNoWalletsModal = value;
    },
    get showDeepLinkSelect() {
      return showDeepLinkSelect;
    },
    set showDeepLinkSelect(value) {
      showDeepLinkSelect = value;
    },
    get availableConnectors() {
      return availableConnectors;
    },
    // Methods
    prepareConnectors,
    connectWallet,
    handleClick
  };
}
function ConnectWalletForm($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    const WALLET_DEEPLINKS = generateWalletDeeplinks("sale.rat.fun");
    function onType() {
      playSound("ratfunUI", "chirp", false, false, randomPitch());
    }
    const mascotText = [
      {
        type: "text",
        content: "BUY $RAT",
        typeSpeed: 40,
        typeMode: "char",
        color: "var(--foreground)",
        backgroundColor: "transparent",
        onType
      }
    ];
    gsap.timeline();
    const wallet = createWalletConnection({
      getDrawbridge,
      isPhone: store_get($$store_subs ??= {}, "$isPhone", isPhone),
      onError: (error2, message) => console.error(message, error2)
    });
    let $$settled = true;
    let $$inner_renderer;
    function $$render_inner($$renderer3) {
      $$renderer3.push(`<div class="outer-container svelte-480lsp"><div class="inner-container svelte-480lsp"><div class="mascot-container svelte-480lsp">`);
      Mascot($$renderer3, {
        headBobOn: true,
        text: mascotText,
        hugeText: true,
        centerText: true,
        bigDanceOn: true
      });
      $$renderer3.push(`<!----></div> <div class="button-container svelte-480lsp">`);
      if (wallet.connecting) {
        $$renderer3.push("<!--[-->");
        BigButton($$renderer3, { text: "Connecting...", disabled: true, onclick: () => {
        } });
      } else {
        $$renderer3.push("<!--[!-->");
        BigButton($$renderer3, { text: "Connect wallet", onclick: wallet.handleClick });
      }
      $$renderer3.push(`<!--]--></div> `);
      NoWalletsModal($$renderer3, {
        get show() {
          return wallet.showNoWalletsModal;
        },
        set show($$value) {
          wallet.showNoWalletsModal = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      WalletSelectModal($$renderer3, {
        connectors: wallet.availableConnectors,
        connecting: wallet.connecting,
        onSelect: wallet.connectWallet,
        get show() {
          return wallet.showWalletSelect;
        },
        set show($$value) {
          wallet.showWalletSelect = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----> `);
      DeepLinkSelectModal($$renderer3, {
        deeplinks: WALLET_DEEPLINKS,
        get show() {
          return wallet.showDeepLinkSelect;
        },
        set show($$value) {
          wallet.showDeepLinkSelect = $$value;
          $$settled = false;
        }
      });
      $$renderer3.push(`<!----></div></div>`);
    }
    do {
      $$settled = true;
      $$inner_renderer = $$renderer2.copy();
      $$render_inner($$inner_renderer);
    } while (!$$settled);
    $$renderer2.subsume($$inner_renderer);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function NotStarted($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function onType() {
      playSound("ratfunUI", "chirp", false, false, randomPitch());
    }
    const mascotText = [
      {
        type: "text",
        content: "STARTING SOON",
        typeSpeed: 200,
        typeMode: "word",
        color: "var(--foreground)",
        backgroundColor: "transparent",
        onType
      }
    ];
    function goToTelegram() {
      window.location.href = "https://t.me/ratfun";
    }
    $$renderer2.push(`<div class="not-started svelte-4r7v0j"><div class="content"><div class="mascot-container svelte-4r7v0j">`);
    Mascot($$renderer2, {
      headBobOn: true,
      text: mascotText,
      hugeText: true,
      centerText: true
    });
    $$renderer2.push(`<!----></div> <div class="button-container svelte-4r7v0j">`);
    BigButton($$renderer2, { text: "Go to telegram", onclick: goToTelegram });
    $$renderer2.push(`<!----></div></div></div>`);
  });
}
function WaitingForEpoch($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    function onType() {
      playSound("ratfunUI", "chirp", false, false, randomPitch());
    }
    const mascotText = [
      {
        type: "text",
        content: "SECOND SALE EPOCH",
        typeSpeed: 200,
        typeMode: "word",
        color: "var(--foreground)",
        backgroundColor: "transparent",
        onType
      },
      {
        type: "text",
        content: "STARTS DEC 27",
        typeSpeed: 200,
        typeMode: "word",
        color: "var(--foreground)",
        backgroundColor: "transparent",
        onType
      }
    ];
    function goToTelegram() {
      window.location.href = "https://t.me/ratfun";
    }
    $$renderer2.push(`<div class="waiting-for-epoch svelte-1v8mp5h"><div class="content"><div class="mascot-container svelte-1v8mp5h">`);
    Mascot($$renderer2, { smallDanceOn: true, text: mascotText, centerText: true });
    $$renderer2.push(`<!----></div> <div class="button-container svelte-1v8mp5h">`);
    BigButton($$renderer2, { text: "Go to telegram", onclick: goToTelegram });
    $$renderer2.push(`<!----></div></div></div>`);
  });
}
function Ended($$renderer) {
  function goToRatFun() {
    window.location.href = "https://matcha.xyz/tokens/base/0xf2dd384662411a21259ab17038574289091f2d41";
  }
  $$renderer.push(`<div class="ended svelte-3h3kud"><div class="content"><div class="title svelte-3h3kud">AUCTION ENDED</div> <div class="button-container svelte-3h3kud">`);
  BigButton($$renderer, { text: "BUY $RAT", onclick: goToRatFun });
  $$renderer.push(`<!----></div></div></div>`);
}
function Error$1($$renderer) {
  $$renderer.push(`<div class="error"><h2>ERROR</h2></div>`);
}
function CountryBlocked($$renderer) {
  $$renderer.push(`<div class="country-blocked svelte-v5yt83"><div class="content svelte-v5yt83"><h2 class="svelte-v5yt83">ACCESS RESTRICTED</h2> <p class="svelte-v5yt83">$RAT is illegal in your country.</p></div></div>`);
}
function shortenAddress(s) {
  return s ? s.slice(0, 5) + "..." + s.slice(-5) : "";
}
function WalletInfo($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let isConnected = !!store_get($$store_subs ??= {}, "$userAddress", userAddress);
    if (isConnected) {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="wallet-info svelte-195r1nf"><button class="wallet-box svelte-195r1nf"><div class="address svelte-195r1nf">${escape_html(shortenAddress(store_get($$store_subs ??= {}, "$userAddress", userAddress)))}</div></button> `);
      {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]--></div>`);
    } else {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]-->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
function Auction($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    onDestroy(() => {
    });
    WalletInfo($$renderer2);
    $$renderer2.push(`<!----> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <div class="auction-container svelte-1mow4pb"><div class="auction-inner svelte-1mow4pb">`);
    if (auctionState.state.current === AUCTION_STATE.COUNTRY_BLOCKED) {
      $$renderer2.push("<!--[-->");
      CountryBlocked($$renderer2);
    } else {
      $$renderer2.push("<!--[!-->");
      if (auctionState.state.current === AUCTION_STATE.CONNECT_WALLET) {
        $$renderer2.push("<!--[-->");
        ConnectWalletForm($$renderer2);
      } else {
        $$renderer2.push("<!--[!-->");
        if (auctionState.state.current === AUCTION_STATE.SWAP) {
          $$renderer2.push("<!--[-->");
          Swap($$renderer2);
        } else {
          $$renderer2.push("<!--[!-->");
          if (auctionState.state.current === AUCTION_STATE.NOT_STARTED) {
            $$renderer2.push("<!--[-->");
            NotStarted($$renderer2);
          } else {
            $$renderer2.push("<!--[!-->");
            if (auctionState.state.current === AUCTION_STATE.WAITING_FOR_EPOCH) {
              $$renderer2.push("<!--[-->");
              WaitingForEpoch($$renderer2);
            } else {
              $$renderer2.push("<!--[!-->");
              if (auctionState.state.current === AUCTION_STATE.ENDED) {
                $$renderer2.push("<!--[-->");
                Ended($$renderer2);
              } else {
                $$renderer2.push("<!--[!-->");
                if (auctionState.state.current === AUCTION_STATE.ERROR) {
                  $$renderer2.push("<!--[-->");
                  Error$1($$renderer2);
                } else {
                  $$renderer2.push("<!--[!-->");
                }
                $$renderer2.push(`<!--]-->`);
              }
              $$renderer2.push(`<!--]-->`);
            }
            $$renderer2.push(`<!--]-->`);
          }
          $$renderer2.push(`<!--]-->`);
        }
        $$renderer2.push(`<!--]-->`);
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--></div></div>`);
  });
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    onDestroy(() => {
      shaderManager.destroy();
    });
    $$renderer2.push(`<div class="bg svelte-12qhfyh">`);
    if (store_get($$store_subs ??= {}, "$UIState", UIState) === UI.LOADING) {
      $$renderer2.push("<!--[-->");
      Loading($$renderer2);
    } else {
      $$renderer2.push("<!--[!-->");
      if (store_get($$store_subs ??= {}, "$UIState", UIState) === UI.READY) {
        $$renderer2.push("<!--[-->");
        $$renderer2.push(`<div class="context-main svelte-12qhfyh">`);
        Auction($$renderer2);
        $$renderer2.push(`<!----></div>`);
      } else {
        $$renderer2.push("<!--[!-->");
      }
      $$renderer2.push(`<!--]-->`);
    }
    $$renderer2.push(`<!--]--> `);
    {
      $$renderer2.push("<!--[!-->");
    }
    $$renderer2.push(`<!--]--> <!--[-->`);
    slot($$renderer2, $$props, "default", {});
    $$renderer2.push(`<!--]--></div> `);
    Toasts($$renderer2);
    $$renderer2.push(`<!---->`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
