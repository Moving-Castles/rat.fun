import { parseAbi, createPublicClient, isHex, http, encodeFunctionData, parseEther, formatEther, formatGwei, zeroAddress, toHex } from 'viem';
import { resourceToHex, hexToResource } from '@latticexyz/common';
import worldConfig, { systemsConfig } from '@latticexyz/world/mud.config';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { smartAccountActions } from 'permissionless';
import { callFrom, sendUserOperationFrom } from '@latticexyz/world/internal';
import { createBundlerClient as createBundlerClient$1, sendUserOperation, waitForUserOperationReceipt } from 'viem/account-abstraction';
import { getRecord } from '@latticexyz/store/internal';
import { getAction } from 'viem/utils';
import { waitForTransactionReceipt, getCode, sendTransaction, writeContract, signTypedData } from 'viem/actions';
import IBaseWorldAbi from '@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json';
import { callWithSignatureTypes } from '@latticexyz/world-module-callwithsignature/internal';
import moduleConfig from '@latticexyz/world-module-callwithsignature/mud.config';
import CallWithSignatureAbi from '@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json';
import { getConnectorClient, createConfig, createStorage, reconnect, getAccount, watchAccount, getConnectors, connect, disconnect } from '@wagmi/core';

// src/Drawbridge.ts

// src/types/state.ts
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
var defaultClientConfig = {
  pollingInterval: 2e3
  // Changed from 250ms to 2000ms to reduce rate limiting
};
var unlimitedDelegationControlId = resourceToHex({
  type: "system",
  namespace: "",
  name: "unlimited"
});
var worldTables = worldConfig.namespaces.world.tables;
var worldAbi = parseAbi([
  "function registerDelegation(address delegatee, bytes32 delegationControlId, bytes initCallData)"
]);

// src/types/config.ts
var DEPLOYMENT_TIMEOUTS = {
  /**
   * Timeout for session account deployment (milliseconds)
   *
   * After this time, we give up waiting for the session account to deploy.
   * Default: 30 seconds
   *
   * Increase for slower chains or congested networks.
   */
  SESSION_DEPLOYMENT: 3e4,
  /**
   * Delay after wallet deployment to allow bundler state synchronization (milliseconds)
   *
   * After deploying a counterfactual wallet, bundlers cache the account state
   * and need time to refresh their internal state before accepting operations.
   *
   * Default: 2 seconds
   *
   * This prevents "AA10" errors on the next user operation.
   * See: https://github.com/eth-infinitism/account-abstraction/discussions
   */
  BUNDLER_STATE_SYNC: 2e3
};

// src/session/core/storage.ts
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
      if (stored) {
        console.log("[drawbridge] Migrating session storage from legacy key");
      }
    }
    if (!stored) {
      return { signers: {} };
    }
    try {
      const parsed = JSON.parse(stored);
      if (!parsed.signers || typeof parsed.signers !== "object") {
        console.warn("[drawbridge] Session storage corrupted - invalid structure, resetting");
        return { signers: {} };
      }
      return parsed;
    } catch (err) {
      console.error(
        "[drawbridge] Failed to parse session storage:",
        err instanceof Error ? err.message : String(err)
      );
      console.warn("[drawbridge] Session storage will be reset");
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
      console.log("[drawbridge] Removed legacy storage key after migration");
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
var sessionStorage = new SessionStorage();

// src/session/core/signer.ts
function getSessionSigner(userAddress) {
  let privateKey = sessionStorage.getSigner(userAddress);
  if (!privateKey) {
    const deprecatedKey = typeof localStorage !== "undefined" ? localStorage.getItem(`mud:appSigner:privateKey:${userAddress.toLowerCase()}`)?.replace(/^"(.*)"$/, "$1") : null;
    privateKey = isHex(deprecatedKey) ? deprecatedKey : generatePrivateKey();
    sessionStorage.setSigner(userAddress, privateKey);
  }
  return privateKeyToAccount(privateKey);
}
async function getSessionAccount({
  publicClient,
  userAddress
}) {
  const signer = getSessionSigner(userAddress);
  console.log("[getSessionAccount] Creating session account:", {
    userAddress,
    signerAddress: signer.address,
    chainId: publicClient.chain?.id,
    chainName: publicClient.chain?.name
  });
  try {
    const account = await toSimpleSmartAccount({
      client: publicClient,
      owner: signer
    });
    console.log("[getSessionAccount] Session account created:", account.address);
    return { account, signer };
  } catch (error) {
    console.error("[getSessionAccount] Failed to create session account:", {
      error: error instanceof Error ? error.message : String(error),
      userAddress,
      signerAddress: signer.address,
      chainId: publicClient.chain?.id
    });
    throw error;
  }
}

// src/bundler/paymaster.ts
function getPaymaster(chain, paymasterOverride) {
  const contracts = chain.contracts ?? {};
  if (paymasterOverride) {
    console.log(
      `[Drawbridge/Paymaster] Using custom paymaster client for chain ${chain.name} (${chain.id})`
    );
    return {
      type: "custom",
      paymasterClient: paymasterOverride
    };
  }
  if ("paymaster" in contracts && contracts.paymaster != null) {
    if ("address" in contracts.paymaster) {
      console.log(
        `[Drawbridge/Paymaster] Using simple paymaster at ${contracts.paymaster.address} for chain ${chain.name} (${chain.id})`
      );
      return {
        type: "simple",
        address: contracts.paymaster.address
      };
    }
  }
  console.log(
    `[Drawbridge/Paymaster] No paymaster configured for chain ${chain.name} (${chain.id}) - user will pay gas`
  );
  return void 0;
}

// src/bundler/client.ts
function createBundlerClient(config) {
  const client = config.client;
  if (!client) throw new Error("No `client` provided to `createBundlerClient`.");
  const chain = config.chain ?? client.chain;
  const paymaster = chain ? getPaymaster(chain, config.paymaster) : void 0;
  if (paymaster) {
    console.log(
      `[Drawbridge/BundlerClient] Bundler client configured with ${paymaster.type} paymaster`
    );
  } else {
    console.log(`[Drawbridge/BundlerClient] Bundler client configured without paymaster`);
  }
  return createBundlerClient$1({
    ...defaultClientConfig,
    // Configure paymaster for gas sponsorship
    paymaster: paymaster ? paymaster.type === "custom" ? paymaster.paymasterClient : {
      // Simple paymaster - just return address with empty data
      getPaymasterData: async () => ({
        paymaster: paymaster.address,
        paymasterData: "0x"
      })
    } : void 0,
    ...config
  });
}
var DEFAULT_ETH_PRICE = 2800;
function logUserOperationCost(userOp, ethPriceUSD) {
  const ETH_PRICE = ethPriceUSD || DEFAULT_ETH_PRICE;
  const callGas = BigInt(userOp.callGasLimit);
  const verificationGas = BigInt(userOp.verificationGasLimit);
  const preVerificationGas = BigInt(userOp.preVerificationGas);
  const paymasterVerificationGas = BigInt(userOp.paymasterVerificationGasLimit || 0);
  const paymasterPostOpGas = BigInt(userOp.paymasterPostOpGasLimit || 0);
  const maxFeePerGas = BigInt(userOp.maxFeePerGas);
  const maxPriorityFeePerGas = BigInt(userOp.maxPriorityFeePerGas);
  const totalGas = callGas + verificationGas + preVerificationGas + paymasterVerificationGas + paymasterPostOpGas;
  const maxCostWei = totalGas * maxFeePerGas;
  const maxCostETH = formatEther(maxCostWei);
  const maxCostUSD = Number(maxCostETH) * ETH_PRICE;
  console.log("\u250C\u2500 User Operation Gas & Cost \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  console.log("\u2502");
  console.log("\u2502 Gas Estimates:");
  console.log("\u2502   callGasLimit:                ", callGas.toString().padStart(7), "gas");
  console.log("\u2502   verificationGasLimit:        ", verificationGas.toString().padStart(7), "gas");
  console.log("\u2502   preVerificationGas:          ", preVerificationGas.toString().padStart(7), "gas");
  if (paymasterVerificationGas > 0n) {
    console.log(
      "\u2502   paymasterVerificationGasLimit:",
      paymasterVerificationGas.toString().padStart(7),
      "gas"
    );
  }
  if (paymasterPostOpGas > 0n) {
    console.log(
      "\u2502   paymasterPostOpGasLimit:     ",
      paymasterPostOpGas.toString().padStart(7),
      "gas"
    );
  }
  console.log("\u2502   \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  console.log("\u2502   Total gas:                   ", totalGas.toString().padStart(7), "gas");
  console.log("\u2502");
  console.log("\u2502 Fee Parameters:");
  console.log("\u2502   maxFeePerGas:                ", formatGwei(maxFeePerGas), "gwei");
  console.log("\u2502   maxPriorityFeePerGas:        ", formatGwei(maxPriorityFeePerGas), "gwei");
  console.log("\u2502");
  console.log("\u2502 Estimated Max Cost:");
  console.log("\u2502   ETH:  ", maxCostETH, "ETH");
  console.log("\u2502   USD:  $" + maxCostUSD.toFixed(2), "(at $" + ETH_PRICE + " ETH)");
  console.log("\u2502");
  console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
}
function logFeeCapApplied(data) {
  const originalCost = Number(data.totalGas) * Number(formatGwei(data.originalMaxFee)) / 1e9;
  const cappedCost = Number(data.totalGas) * Number(formatGwei(data.cappedMaxFee)) / 1e9;
  const originalCostUSD = originalCost * data.ethPrice;
  const cappedCostUSD = cappedCost * data.ethPrice;
  const priorityWasReduced = data.cappedPriorityFee < data.originalPriorityFee;
  console.log("\u250C\u2500 \u26A0\uFE0F  GAS PRICE SPIKE - FEE CAP APPLIED \u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
  console.log("\u2502");
  console.log("\u2502 \u{1F6E1}\uFE0F  Budget Protection: Capping fees to stay under $" + data.maxBudgetUSD);
  console.log("\u2502");
  console.log("\u2502 This operation:");
  console.log("\u2502   Total gas:            ", data.totalGas.toString(), "gas");
  console.log("\u2502");
  console.log("\u2502 Network fees would cost:");
  console.log("\u2502   maxFeePerGas:         ", formatGwei(data.originalMaxFee), "gwei");
  console.log("\u2502   maxPriorityFeePerGas: ", formatGwei(data.originalPriorityFee), "gwei");
  console.log("\u2502   Estimated cost:       ", originalCost.toFixed(8), "ETH");
  console.log("\u2502   USD cost:              $" + originalCostUSD.toFixed(2), "\u2190 OVER BUDGET!");
  console.log("\u2502");
  console.log("\u2502 Capped to:");
  console.log("\u2502   maxFeePerGas:         ", formatGwei(data.cappedMaxFee), "gwei", "\u2190 CAPPED");
  if (priorityWasReduced) {
    console.log(
      "\u2502   maxPriorityFeePerGas: ",
      formatGwei(data.cappedPriorityFee),
      "gwei",
      "\u2190 REDUCED (EIP-1559)"
    );
  } else {
    console.log("\u2502   maxPriorityFeePerGas: ", formatGwei(data.cappedPriorityFee), "gwei");
  }
  console.log("\u2502   Estimated cost:       ", cappedCost.toFixed(8), "ETH");
  console.log("\u2502   USD cost:              $" + cappedCostUSD.toFixed(2), "\u2705");
  console.log("\u2502");
  console.log(
    "\u2502 \u23F3 Transaction will wait in mempool until gas drops below",
    formatGwei(data.cappedMaxFee),
    "gwei"
  );
  console.log("\u2502");
  console.log("\u2514\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500\u2500");
}

// src/bundler/transport.ts
var RETRY_CONFIG = {
  maxRetries: 4,
  // Total of 5 attempts (1 initial + 4 retries)
  baseDelayMs: 1e3,
  // Start with 1 second
  maxDelayMs: 16e3
  // Cap at 16 seconds
};
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
function getRetryDelay(attempt) {
  const delay = RETRY_CONFIG.baseDelayMs * Math.pow(2, attempt);
  return Math.min(delay, RETRY_CONFIG.maxDelayMs);
}
async function isPaymasterCostRejection(response) {
  if (response.status !== 200) return false;
  try {
    const clonedResponse = response.clone();
    const body = await clonedResponse.json();
    if (body?.error?.code === -32002) {
      const details = body.error.details || body.error.message || "";
      return details.toLowerCase().includes("max sponsorship cost");
    }
    return false;
  } catch {
    return false;
  }
}
async function fetchWithRetry(input, init) {
  let lastError = null;
  for (let attempt = 0; attempt <= RETRY_CONFIG.maxRetries; attempt++) {
    try {
      const response = await fetch(input, init);
      if (response.status === 429) {
        const isLastAttempt = attempt === RETRY_CONFIG.maxRetries;
        if (isLastAttempt) {
          let errorMessage = "Rate limit exceeded";
          try {
            const errorBody = await response.json();
            if (errorBody?.errorMessage) {
              errorMessage = errorBody.errorMessage;
            }
          } catch {
          }
          throw new Error(
            `${errorMessage}. All ${RETRY_CONFIG.maxRetries + 1} retry attempts exhausted.`
          );
        }
        const delayMs = getRetryDelay(attempt);
        console.warn(
          `[Drawbridge/Transport] Rate limit hit (429). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`
        );
        await sleep(delayMs);
        continue;
      }
      if (await isPaymasterCostRejection(response)) {
        const isLastAttempt = attempt === RETRY_CONFIG.maxRetries;
        if (isLastAttempt) {
          return response;
        }
        const delayMs = getRetryDelay(attempt);
        console.warn(
          `[Drawbridge/Transport] Paymaster cost limit exceeded. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`
        );
        await sleep(delayMs);
        continue;
      }
      return response;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (attempt === RETRY_CONFIG.maxRetries) {
        throw lastError;
      }
      const delayMs = getRetryDelay(attempt);
      console.warn(
        `[Drawbridge/Transport] Network error. Retrying in ${delayMs}ms (attempt ${attempt + 1}/${RETRY_CONFIG.maxRetries + 1})...`,
        error
      );
      await sleep(delayMs);
    }
  }
  throw lastError || new Error("Unexpected error in fetchWithRetry");
}
function getBundlerTransport(chain, ethPriceUSD) {
  const bundlerHttpUrl = chain.rpcUrls.bundler?.http[0];
  if (bundlerHttpUrl) {
    const shouldApplyFeeCap = chain.id === 8453 || chain.id === 84532;
    return http(bundlerHttpUrl, {
      // Use custom fetch with retry logic
      fetchFn: fetchWithRetry,
      onFetchRequest: async (request) => {
        try {
          if (request.body) {
            const clonedRequest = request.clone();
            const text = await clonedRequest.text();
            const body = JSON.parse(text);
            if (body?.method === "pm_getPaymasterData" || body?.method === "eth_sendUserOperation" || body?.method === "eth_estimateUserOperationGas") {
              const userOp = body?.params?.[0];
              if (userOp && shouldApplyFeeCap) {
                applyFeeCap(userOp, ethPriceUSD);
              }
              if (body?.method === "eth_sendUserOperation" && userOp) {
                logUserOperationCost(userOp, ethPriceUSD);
              }
            }
          }
        } catch (e) {
        }
      }
    });
  }
  throw new Error(`Chain ${chain.id} config did not include a bundler RPC URL.`);
}
function applyFeeCap(userOp, ethPriceUSD) {
  const MAX_COST_USD = 0.9;
  const DEFAULT_ETH_PRICE2 = 3e3;
  const PRICE_MARGIN = 500;
  const ETH_PRICE_USD = (ethPriceUSD || DEFAULT_ETH_PRICE2) + PRICE_MARGIN;
  const totalGas = BigInt(userOp.callGasLimit || 0) + BigInt(userOp.verificationGasLimit || 0) + BigInt(userOp.preVerificationGas || 0) + BigInt(userOp.paymasterVerificationGasLimit || 0) + BigInt(userOp.paymasterPostOpGasLimit || 0);
  const maxBudgetETH = parseEther((MAX_COST_USD / ETH_PRICE_USD).toString());
  const maxFeePerGasCap = maxBudgetETH / totalGas;
  const originalMaxFee = BigInt(userOp.maxFeePerGas);
  const originalPriorityFee = BigInt(userOp.maxPriorityFeePerGas);
  let maxFeeWasCapped = false;
  let cappedMaxFee = originalMaxFee;
  let cappedPriorityFee = originalPriorityFee;
  if (originalMaxFee > maxFeePerGasCap) {
    userOp.maxFeePerGas = "0x" + maxFeePerGasCap.toString(16);
    cappedMaxFee = maxFeePerGasCap;
    maxFeeWasCapped = true;
  }
  const currentMaxFee = BigInt(userOp.maxFeePerGas);
  if (originalPriorityFee > currentMaxFee) {
    userOp.maxPriorityFeePerGas = "0x" + currentMaxFee.toString(16);
    cappedPriorityFee = currentMaxFee;
  }
  if (maxFeeWasCapped || cappedPriorityFee !== originalPriorityFee) {
    logFeeCapApplied({
      totalGas,
      originalMaxFee,
      originalPriorityFee,
      cappedMaxFee,
      cappedPriorityFee,
      maxBudgetUSD: MAX_COST_USD,
      ethPrice: ETH_PRICE_USD
    });
  }
}

// src/session/core/client.ts
async function getSessionClient({
  publicClient,
  userAddress,
  sessionAccount,
  sessionSigner,
  worldAddress,
  paymasterOverride,
  ethPriceUSD
}) {
  const chain = publicClient.chain;
  if (!chain) {
    throw new Error("Public client had no associated chain.");
  }
  if (paymasterOverride) {
    console.log(`[Drawbridge/SessionClient] Creating session client with paymaster override`);
  }
  const bundlerClient = createBundlerClient({
    transport: getBundlerTransport(chain, ethPriceUSD),
    client: publicClient,
    account: sessionAccount,
    paymaster: paymasterOverride
  });
  const sessionClient = bundlerClient.extend(smartAccountActions).extend(
    callFrom({
      worldAddress,
      delegatorAddress: userAddress,
      publicClient
    })
  ).extend(
    sendUserOperationFrom({
      worldAddress,
      delegatorAddress: userAddress,
      publicClient
    })
  ).extend(() => ({ userAddress, worldAddress, internal_signer: sessionSigner }));
  return sessionClient;
}
async function checkDelegation({
  client,
  worldAddress,
  userAddress,
  sessionAddress,
  blockTag = "pending"
}) {
  const record = await getRecord(client, {
    address: worldAddress,
    table: worldTables.UserDelegationControl,
    key: { delegator: userAddress, delegatee: sessionAddress },
    blockTag
  });
  return record.delegationControlId === unlimitedDelegationControlId;
}
function isAlreadyDeployedError(errorMessage) {
  return errorMessage.includes("AA10") || errorMessage.includes("already constructed") || errorMessage.includes("already deployed") || errorMessage.includes("is an existing contract, but initCode is nonempty");
}
async function isWalletDeployed(client, address) {
  const code = await getAction(
    client,
    getCode,
    "getCode"
  )({
    address
  });
  return code !== void 0 && code !== "0x";
}
async function deployWallet(client, factoryAddress, factoryCalldata) {
  if (!client.account) {
    throw new Error("Client must have an account to deploy wallet");
  }
  try {
    const txHash = await getAction(
      client,
      sendTransaction,
      "sendTransaction"
    )({
      account: client.account,
      chain: client.chain,
      to: factoryAddress,
      data: factoryCalldata
    });
    await getAction(
      client,
      waitForTransactionReceipt,
      "waitForTransactionReceipt"
    )({
      hash: txHash
    });
    await new Promise((resolve) => setTimeout(resolve, DEPLOYMENT_TIMEOUTS.BUNDLER_STATE_SYNC));
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isAlreadyDeployedError(errorMessage)) {
      console.log("[drawbridge] Wallet already deployed, continuing");
      return;
    }
    throw new Error(`Failed to deploy smart wallet: ${errorMessage}`);
  }
}
function clearFactoryData(account) {
  try {
    delete account.factory;
    delete account.factoryData;
    account.factory = void 0;
    account.factoryData = void 0;
    console.log("[drawbridge] Factory data cleared:", {
      stillHasFactory: !!account.factory,
      stillHasFactoryData: !!account.factoryData
    });
  } catch (err) {
    console.warn("[drawbridge] Direct deletion failed, trying Object.defineProperty");
    try {
      Object.defineProperty(account, "factory", {
        value: void 0,
        writable: true,
        configurable: true
      });
      Object.defineProperty(account, "factoryData", {
        value: void 0,
        writable: true,
        configurable: true
      });
      console.log("[drawbridge] Factory data cleared via defineProperty");
    } catch (fallbackErr) {
      console.error("[drawbridge] Could not remove factory (readonly property)");
    }
  }
}
async function deploySessionAccount(sessionClient, onStatus) {
  const sessionDeployed = await sessionClient.account.isDeployed?.();
  console.log("[drawbridge] Session account deployed:", sessionDeployed);
  if (sessionDeployed) {
    console.log("[drawbridge] Session account already deployed");
    return;
  }
  onStatus?.({ type: "deploying_session", message: "Finalizing session setup..." });
  try {
    const hash = await getAction(
      sessionClient,
      sendUserOperation,
      "sendUserOperation"
    )({
      calls: [{ to: zeroAddress }]
    });
    console.log("[drawbridge] Session deploy tx:", hash);
    const receiptPromise = getAction(
      sessionClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash });
    const timeoutPromise = new Promise(
      (_, reject) => setTimeout(
        () => reject(
          new Error(
            `Session deployment timeout after ${DEPLOYMENT_TIMEOUTS.SESSION_DEPLOYMENT}ms`
          )
        ),
        DEPLOYMENT_TIMEOUTS.SESSION_DEPLOYMENT
      )
    );
    const receipt = await Promise.race([receiptPromise, timeoutPromise]);
    if (!receipt.success) {
      throw new Error("Failed to deploy session account");
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("[drawbridge] Session deployment error:", errorMsg);
    if (errorMsg.includes("timeout")) {
      const nowDeployed = await sessionClient.account.isDeployed?.();
      if (nowDeployed) {
        console.log("[drawbridge] Session deployed despite timeout");
        onStatus?.({ type: "complete", message: "Session setup complete!" });
        return;
      }
    }
    if (isAlreadyDeployedError(errorMsg)) {
      console.log("[drawbridge] Session account already deployed (bundler confirmed)");
      console.log("[drawbridge] Waiting for RPC cache to update...");
      await new Promise((resolve) => setTimeout(resolve, DEPLOYMENT_TIMEOUTS.BUNDLER_STATE_SYNC));
      const nowDeployed = await sessionClient.account.isDeployed?.();
      if (nowDeployed) {
        console.log("[drawbridge] Session deployment verified after cache update");
        onStatus?.({ type: "complete", message: "Session setup complete!" });
        return;
      }
      console.warn("[drawbridge] Cache still stale after delay - treating as deployed anyway");
      onStatus?.({ type: "complete", message: "Session setup complete!" });
      return;
    }
    onStatus?.({ type: "error", message: "Session deployment failed", error });
    throw error;
  }
}

// src/session/delegation/smart-account.ts
async function setupSessionSmartAccount({
  userClient,
  sessionClient,
  worldAddress,
  onStatus
}) {
  const sessionAddress = sessionClient.account.address;
  const userAddress = userClient.account.address;
  console.log("[drawbridge] Smart Account setup:", { userAddress });
  onStatus?.({ type: "checking_wallet", message: "Checking wallet status..." });
  const account = userClient.account;
  const factoryArgs = await account.getFactoryArgs();
  const hasFactoryData = factoryArgs.factory && factoryArgs.factoryData;
  console.log("[drawbridge] Smart wallet check:", { hasFactoryData, userAddress });
  const alreadyDeployed = await isWalletDeployed(sessionClient, userAddress);
  console.log("[drawbridge] Wallet deployed:", alreadyDeployed);
  if (alreadyDeployed && hasFactoryData) {
    console.log("[drawbridge] CASE 1: Wallet deployed and has factory data");
    console.log("[drawbridge] Removing factory data from deployed wallet");
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" });
    clearFactoryData(account);
  } else if (!alreadyDeployed && hasFactoryData) {
    console.log("[drawbridge] CASE 2: Wallet not deployed and has factory data");
    console.log("[drawbridge] Deploying user wallet...");
    onStatus?.({ type: "deploying_wallet", message: "Deploying wallet (one-time setup)..." });
    await deployWallet(sessionClient, factoryArgs.factory, factoryArgs.factoryData);
    const nowDeployed = await isWalletDeployed(sessionClient, userAddress);
    if (!nowDeployed) {
      throw new Error(
        `Wallet deployment appeared to succeed but contract code not found at ${userAddress}`
      );
    }
    onStatus?.({ type: "wallet_deployed", message: "Wallet deployed successfully!" });
    clearFactoryData(account);
  } else {
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" });
  }
  onStatus?.({ type: "registering_delegation", message: "Setting up session..." });
  const calls = [
    {
      to: worldAddress,
      abi: worldAbi,
      functionName: "registerDelegation",
      args: [sessionAddress, unlimitedDelegationControlId, "0x"]
    }
  ];
  const accountBeforeSend = userClient.account;
  if (accountBeforeSend.factory || accountBeforeSend.factoryData) {
    console.warn("[drawbridge] Factory still present, attempting removal again...");
    clearFactoryData(accountBeforeSend);
  }
  try {
    const hash = await getAction(userClient, sendUserOperation, "sendUserOperation")({ calls });
    console.log("[drawbridge] User operation sent:", hash);
    const receipt = await getAction(
      userClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash });
    if (!receipt.success) {
      throw new Error("User operation failed during session setup");
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[drawbridge] User operation error:", errorMessage);
    if (isAlreadyDeployedError(errorMessage)) {
      const helpfulError = new Error(
        "Smart wallet deployment conflict. Please try again - it should work on the second attempt."
      );
      onStatus?.({ type: "error", message: "Please try again", error: helpfulError });
      throw helpfulError;
    }
    onStatus?.({ type: "error", message: "Session setup failed", error });
    throw error;
  }
  await deploySessionAccount(sessionClient, onStatus);
  console.log("[drawbridge] Smart Account setup complete");
  onStatus?.({ type: "complete", message: "Session setup complete!" });
}
async function signCall({
  userClient,
  worldAddress,
  systemId,
  callData,
  nonce: initialNonce,
  client
}) {
  const nonce = initialNonce ?? (client ? (await getRecord(client, {
    address: worldAddress,
    table: moduleConfig.tables.CallWithSignatureNonces,
    key: { signer: userClient.account.address },
    blockTag: "pending"
  })).nonce : 0n);
  const { namespace: systemNamespace, name: systemName } = hexToResource(systemId);
  return await getAction(
    userClient,
    signTypedData,
    "signTypedData"
  )({
    account: userClient.account,
    // EIP-712 domain bound to World contract and chain
    domain: {
      verifyingContract: worldAddress,
      salt: toHex(userClient.chain.id, { size: 32 })
    },
    // MUD's CallWithSignature type definitions
    types: callWithSignatureTypes,
    primaryType: "Call",
    // Message contains all call details + nonce
    message: {
      signer: userClient.account.address,
      systemNamespace,
      systemName,
      callData,
      nonce
    }
  });
}
async function callWithSignature({
  sessionClient,
  ...opts
}) {
  const signature = await signCall(opts);
  return await getAction(
    sessionClient,
    writeContract,
    "writeContract"
  )({
    address: opts.worldAddress,
    abi: CallWithSignatureAbi,
    functionName: "callWithSignature",
    args: [opts.userClient.account.address, opts.systemId, opts.callData, signature]
  });
}

// src/session/delegation/eoa.ts
async function setupSessionEOA({
  publicClient,
  userClient,
  sessionClient,
  worldAddress,
  onStatus
}) {
  const sessionAddress = sessionClient.account.address;
  const userAddress = userClient.account.address;
  console.log("[drawbridge] EOA setup:", { userAddress });
  onStatus?.({ type: "registering_delegation", message: "Setting up session..." });
  const hash = await callWithSignature({
    client: sessionClient,
    userClient,
    sessionClient,
    worldAddress,
    systemId: systemsConfig.systems.RegistrationSystem.systemId,
    callData: encodeFunctionData({
      abi: IBaseWorldAbi,
      functionName: "registerDelegation",
      args: [sessionAddress, unlimitedDelegationControlId, "0x"]
    })
  });
  const receipt = await getAction(
    publicClient,
    waitForTransactionReceipt,
    "waitForTransactionReceipt"
  )({ hash });
  if (receipt.status === "reverted") {
    throw new Error("Delegation registration transaction reverted");
  }
  await deploySessionAccount(sessionClient, onStatus);
  console.log("[drawbridge] EOA setup complete");
  onStatus?.({ type: "complete", message: "Session setup complete!" });
}

// src/session/delegation/setup.ts
async function setupSession({
  publicClient,
  userClient,
  sessionClient,
  worldAddress,
  onStatus
}) {
  const userAddress = userClient.account.address;
  const sessionAddress = sessionClient.account.address;
  console.log("[drawbridge] Setup session:", {
    userAddress,
    accountType: userClient.account.type
  });
  const hasDelegation = await checkDelegation({
    client: publicClient,
    worldAddress,
    userAddress,
    sessionAddress
  });
  const sessionDeployed = await sessionClient.account.isDeployed?.();
  if (hasDelegation && sessionDeployed) {
    console.log("[drawbridge] Session already fully set up, skipping");
    onStatus?.({ type: "complete", message: "Session already set up!" });
    return;
  }
  console.log("[drawbridge] Session setup required:", { hasDelegation, sessionDeployed });
  if (userClient.account.type === "smart") {
    return setupSessionSmartAccount({
      userClient,
      sessionClient,
      worldAddress,
      onStatus
    });
  } else {
    return setupSessionEOA({
      publicClient,
      userClient,
      sessionClient,
      worldAddress,
      onStatus
    });
  }
}
function createWalletConfig({
  chains,
  transports,
  connectors,
  pollingInterval
}) {
  return createConfig({
    chains,
    transports,
    connectors,
    pollingInterval,
    storage: createStorage({
      storage: typeof window !== "undefined" ? window.localStorage : void 0
    })
  });
}
function setupAccountWatcher(wagmiConfig, onChange) {
  return watchAccount(wagmiConfig, {
    onChange: (account) => {
      console.log("[wallet] Account change:", {
        isConnected: account.isConnected,
        address: account.address
      });
      const result = onChange(account);
      if (result instanceof Promise) {
        result.catch((err) => {
          console.error("[wallet] Account change handler failed:", err);
        });
      }
    }
  });
}
async function attemptReconnect(wagmiConfig) {
  try {
    await reconnect(wagmiConfig);
    const account = getAccount(wagmiConfig);
    if (account.isConnected && account.address) {
      console.log("[wallet] Reconnection successful:", account.address);
      return {
        reconnected: true,
        address: account.address
      };
    }
    console.log("[wallet] Reconnected but no account");
    return { reconnected: false };
  } catch (err) {
    console.log("[wallet] No previous connection to restore");
    return { reconnected: false };
  }
}
async function connectWallet(wagmiConfig, connectorId, chainId) {
  const connectors = getConnectors(wagmiConfig);
  const connector = connectors.find((c) => c.id === connectorId);
  if (!connector) {
    throw new Error(`Connector not found: ${connectorId}`);
  }
  console.log("[wallet] Connecting to wallet:", connectorId);
  await connect(wagmiConfig, {
    connector,
    chainId
  });
  console.log("[wallet] Connection initiated");
}
async function disconnectWallet(wagmiConfig) {
  console.log("[wallet] Disconnecting...");
  try {
    await disconnect(wagmiConfig);
    console.log("[wallet] Disconnected successfully");
  } catch (err) {
    console.error("[wallet] Disconnect error:", err);
    throw err;
  }
}
function getAvailableConnectors(wagmiConfig) {
  return getConnectors(wagmiConfig);
}

// src/Drawbridge.ts
var Drawbridge = class {
  constructor(config) {
    this.listeners = /* @__PURE__ */ new Set();
    this.accountWatcherCleanup = null;
    this.isConnecting = false;
    this.isDisconnecting = false;
    this.validateConfig(config);
    this.config = config;
    this.state = {
      status: "uninitialized" /* UNINITIALIZED */,
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false,
      error: null
    };
    const chain = config.chains.find((c) => c.id === config.chainId);
    if (!chain) {
      throw new Error(`Chain ${config.chainId} not found in provided chains`);
    }
    this._publicClient = createPublicClient({
      chain,
      transport: config.transports[config.chainId],
      pollingInterval: config.pollingInterval ?? 2e3
    });
    console.log("[drawbridge] Public client created for chain:", chain.name);
    this.wagmiConfig = createWalletConfig({
      chains: config.chains,
      transports: config.transports,
      connectors: config.connectors,
      pollingInterval: config.pollingInterval
    });
  }
  /**
   * Validate configuration parameters
   *
   * Throws errors for invalid configuration to help developers catch issues early.
   * @private
   */
  validateConfig(config) {
    if (!config.chains || config.chains.length === 0) {
      throw new Error(
        "Drawbridge configuration error: At least one chain must be configured. Provide chains in the 'chains' parameter."
      );
    }
    if (!config.connectors || config.connectors.length === 0) {
      throw new Error(
        "Drawbridge configuration error: At least one wallet connector must be configured. Add connectors like injected(), coinbaseWallet(), or walletConnect()."
      );
    }
    if (!config.transports || Object.keys(config.transports).length === 0) {
      throw new Error(
        "Drawbridge configuration error: Transports configuration is required. Provide an RPC transport for each chain."
      );
    }
    for (const chain of config.chains) {
      if (!(chain.id in config.transports)) {
        throw new Error(
          `Drawbridge configuration error: No transport configured for chain ${chain.id} (${chain.name}). Add it to the transports parameter: { ${chain.id}: http("https://...") }`
        );
      }
    }
    const chainIdValid = config.chains.some((chain) => chain.id === config.chainId);
    if (!chainIdValid) {
      throw new Error(
        `Drawbridge configuration error: chainId ${config.chainId} is not in the chains array. Provide a chain with id ${config.chainId} in the chains parameter.`
      );
    }
    if (!config.skipSessionSetup && !config.worldAddress) {
      console.warn(
        "[drawbridge] Configuration warning: worldAddress not provided but session setup is enabled. Session creation will work, but delegation checks will fail. Did you forget to pass worldAddress, or did you mean to set skipSessionSetup: true?"
      );
    }
    if (!config.skipSessionSetup && config.worldAddress) {
      if (!/^0x[a-fA-F0-9]{40}$/.test(config.worldAddress)) {
        throw new Error(
          `Drawbridge configuration error: worldAddress "${config.worldAddress}" is not a valid Ethereum address. Expected format: 0x followed by 40 hexadecimal characters.`
        );
      }
    }
  }
  /**
   * Initialize Drawbridge (await reconnection and setup account watcher)
   *
   * This should be called once after construction and awaited.
   * It will attempt to reconnect to a previously connected wallet.
   */
  async initialize() {
    console.log("[drawbridge] Initializing...");
    const result = await attemptReconnect(this.wagmiConfig);
    if (!result.reconnected) {
      this.updateState({ status: "disconnected" /* DISCONNECTED */ });
    }
    this.setupAccountWatcher();
    if (result.reconnected && result.address) {
      console.log("[drawbridge] Processing reconnected wallet:", result.address);
      await this.handleWalletConnection();
    }
    console.log("[drawbridge] Initialization complete");
  }
  // ===== Reactive State Management =====
  /**
   * Subscribe to state changes
   *
   * The listener will be called immediately with the current state,
   * and again whenever the state changes.
   *
   * @param listener Function to call on state changes
   * @returns Unsubscribe function
   *
   * @example
   * ```typescript
   * const unsubscribe = drawbridge.subscribe((state) => {
   *   if (state.sessionClient) {
   *     console.log("Session ready:", state.sessionClient.account.address);
   *   }
   * });
   *
   * // Later, stop listening
   * unsubscribe();
   * ```
   */
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }
  /**
   * Get current state (non-reactive snapshot)
   *
   * For reactive updates, use subscribe() instead.
   */
  getState() {
    return { ...this.state };
  }
  updateState(updates) {
    this.state = { ...this.state, ...updates };
    this.notify();
  }
  notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }
  /**
   * Setup wagmi account watcher to handle connection/disconnection
   * Called automatically by initialize()
   */
  setupAccountWatcher() {
    const unwatch = setupAccountWatcher(this.wagmiConfig, async (account) => {
      if (!account.isConnected) {
        console.log("[drawbridge] Wallet disconnected");
        this.updateState({
          status: "disconnected" /* DISCONNECTED */,
          sessionClient: null,
          userAddress: null,
          sessionAddress: null,
          isReady: false,
          error: null
        });
        this.isConnecting = false;
        return;
      }
      if (this.isDisconnecting) {
        console.log("[drawbridge] Ignoring connection attempt during disconnect");
        return;
      }
      if (this.isConnecting) {
        console.log("[drawbridge] Already processing connection");
        return;
      }
      if (!account.connector || !account.address) {
        return;
      }
      try {
        this.isConnecting = true;
        await this.handleWalletConnection();
      } catch (err) {
        console.error("[drawbridge] Connection handler failed:", {
          error: err,
          errorMessage: err instanceof Error ? err.message : String(err),
          errorName: err instanceof Error ? err.name : "Unknown",
          errorStack: err instanceof Error ? err.stack : void 0,
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        });
        this.updateState({
          status: "error" /* ERROR */,
          error: err instanceof Error ? err : new Error(String(err))
        });
      } finally {
        this.isConnecting = false;
      }
    });
    this.accountWatcherCleanup = unwatch;
  }
  /**
   * Internal handler for wallet connection
   * Called when wagmi detects a connected account
   */
  async handleWalletConnection() {
    let userClient;
    try {
      userClient = await getConnectorClient(this.wagmiConfig);
    } catch (err) {
      console.log("[drawbridge] Could not get connector client");
      return;
    }
    if (!userClient.account || !userClient.chain) {
      console.log("[drawbridge] Wallet client missing account or chain");
      return;
    }
    const userAddress = userClient.account.address;
    console.log("[drawbridge] Wallet connected:", userAddress);
    if (userClient.chain.id !== this.config.chainId) {
      const error = new Error(
        `Chain mismatch: wallet on chain ${userClient.chain.id}, expected ${this.config.chainId}`
      );
      console.error("[drawbridge]", error.message);
      throw error;
    }
    if (this.config.skipSessionSetup) {
      console.log("[drawbridge] Skipping session setup (wallet-only mode)");
      this.updateState({
        status: "ready" /* READY */,
        sessionClient: null,
        userAddress,
        sessionAddress: null,
        isReady: true,
        error: null
      });
      return;
    }
    console.log("[drawbridge] Setting up session for address:", userAddress);
    const signer = getSessionSigner(userAddress);
    console.log("[drawbridge] About to create session account with publicClient:", {
      chainId: this._publicClient.chain?.id,
      chainName: this._publicClient.chain?.name,
      userAddress,
      timestamp: (/* @__PURE__ */ new Date()).toISOString()
    });
    const { account } = await getSessionAccount({
      publicClient: this._publicClient,
      userAddress
    });
    const sessionClient = await getSessionClient({
      publicClient: this._publicClient,
      userAddress,
      sessionAccount: account,
      sessionSigner: signer,
      worldAddress: this.config.worldAddress,
      paymasterOverride: this.config.paymasterClient,
      ethPriceUSD: this.config.ethPriceUSD
    });
    let hasDelegation = false;
    try {
      hasDelegation = await checkDelegation({
        client: this._publicClient,
        worldAddress: this.config.worldAddress,
        userAddress,
        sessionAddress: account.address
      });
    } catch (err) {
      console.error("[drawbridge] Failed to check delegation:", err);
      throw new Error(
        `Failed to check delegation: ${err instanceof Error ? err.message : String(err)}`
      );
    }
    this.updateState({
      status: hasDelegation ? "ready" /* READY */ : "connected" /* CONNECTED */,
      sessionClient,
      userAddress,
      sessionAddress: account.address,
      isReady: hasDelegation,
      error: null
    });
    console.log("[drawbridge] Session connection complete, isReady:", hasDelegation);
  }
  // ===== Public API =====
  /**
   * Get available wallet connectors for UI display
   *
   * @returns Array of connector info (id, name, type)
   */
  getAvailableConnectors() {
    const connectors = getAvailableConnectors(this.wagmiConfig);
    return connectors.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type
    }));
  }
  /**
   * Connect to a wallet by connector ID
   *
   * This will:
   * 1. Connect via wagmi
   * 2. Account watcher will automatically handle drawbridge session creation
   *
   * @param connectorId Connector ID (from getAvailableConnectors())
   * @throws If connector not found or connection fails
   */
  async connectWallet(connectorId) {
    console.log("[drawbridge] Connecting to wallet:", connectorId);
    this.updateState({ status: "connecting" /* CONNECTING */ });
    try {
      await connectWallet(this.wagmiConfig, connectorId, this.config.chainId);
    } catch (err) {
      if (err instanceof Error && err.name === "ConnectorAlreadyConnectedError") {
        console.log("[drawbridge] Already connected");
        return;
      }
      this.updateState({ status: "disconnected" /* DISCONNECTED */ });
      throw err;
    }
  }
  /**
   * Disconnect wallet and clear session
   *
   * This will:
   * 1. Disconnect via wagmi
   * 2. Account watcher will automatically clear drawbridge state
   */
  async disconnectWallet() {
    console.log("[drawbridge] disconnectWallet() called");
    console.log("[drawbridge] Current state:", this.state);
    console.log("[drawbridge] Calling wagmi disconnect()...");
    try {
      this.isDisconnecting = true;
      await disconnectWallet(this.wagmiConfig);
      console.log("[drawbridge] Wallet disconnected");
    } catch (err) {
      console.error("[drawbridge] Disconnect error:", err);
      throw err;
    } finally {
      this.isDisconnecting = false;
    }
    console.log("[drawbridge] Disconnect complete");
  }
  /**
   * Check if session is ready to use
   *
   * Queries the MUD World contract to check if delegation is registered
   * between the user's account and the session account.
   *
   * @returns Delegation status
   */
  async checkPrerequisites() {
    if (!this.state.sessionClient) {
      return { hasDelegation: false, isReady: false };
    }
    const hasDelegation = await checkDelegation({
      client: this._publicClient,
      worldAddress: this.config.worldAddress,
      userAddress: this.state.userAddress,
      sessionAddress: this.state.sessionAddress
    });
    this.updateState({ isReady: hasDelegation });
    return { hasDelegation, isReady: hasDelegation };
  }
  /**
   * Setup session by registering delegation and deploying account
   *
   * This will:
   * 1. Get current wallet client from wagmi
   * 2. Register delegation in MUD World contract (user delegates to session)
   * 3. Deploy session smart account if not already deployed
   *
   * User will need to sign a transaction (EOA) or user operation (smart account).
   *
   * @throws If not connected (call connectWallet() first)
   */
  async setupSession(onStatus) {
    if (this.config.skipSessionSetup) {
      throw new Error(
        "Cannot setup session when skipSessionSetup is true. This drawbridge instance is in wallet-only mode."
      );
    }
    if (!this.state.sessionClient) {
      throw new Error("Not connected. Call connectWallet() first.");
    }
    console.log("[drawbridge] Setting up session (registering delegation)...");
    this.updateState({ status: "setting_up_session" /* SETTING_UP_SESSION */ });
    const userClient = await getConnectorClient(this.wagmiConfig);
    try {
      await setupSession({
        publicClient: this._publicClient,
        userClient,
        sessionClient: this.state.sessionClient,
        worldAddress: this.config.worldAddress,
        onStatus
      });
      this.updateState({ status: "ready" /* READY */, isReady: true, error: null });
      console.log("[drawbridge] Session setup complete");
    } catch (err) {
      this.updateState({ status: "connected" /* CONNECTED */ });
      throw err;
    }
  }
  /**
   * Cleanup and destroy drawbridge instance
   *
   * This will:
   * 1. Unwatch account changes
   * 2. Clear session state (but NOT localStorage keys)
   *
   * Call this when unmounting your app.
   */
  destroy() {
    console.log("[drawbridge] Destroying instance");
    if (this.accountWatcherCleanup) {
      this.accountWatcherCleanup();
      this.accountWatcherCleanup = null;
    }
    this.updateState({
      status: "disconnected" /* DISCONNECTED */,
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false,
      error: null
    });
  }
  /**
   * Clear stored session keys from localStorage
   *
   * This permanently removes the session private key for the current user.
   * Next time connect() is called, a new session account will be created.
   */
  clearStorage() {
    if (this.state.userAddress) {
      sessionStorage.removeSigner(this.state.userAddress);
    }
  }
  // ===== Convenience Getters =====
  /** Get current session client (null if not connected) */
  get sessionClient() {
    return this.state.sessionClient;
  }
  /** Get current user address (null if not connected) */
  get userAddress() {
    return this.state.userAddress;
  }
  /** Get current session account address (null if not connected) */
  get sessionAddress() {
    return this.state.sessionAddress;
  }
  /** Check if session is ready (has delegation) */
  get isReady() {
    return this.state.isReady;
  }
  /** Get wagmi config (for advanced use cases like wallet transactions) */
  getWagmiConfig() {
    return this.wagmiConfig;
  }
  /**
   * Get the public client for read operations.
   *
   * This is the single source of truth for all chain reads.
   * Use this client for:
   * - Reading contract state
   * - Checking balances
   * - Waiting for transaction receipts
   * - Any other read-only operations
   *
   * The client is created once in the constructor with the configured
   * transport (WebSocket + HTTP fallback) and polling interval.
   */
  getPublicClient() {
    return this._publicClient;
  }
};

export { Drawbridge, DrawbridgeStatus };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map