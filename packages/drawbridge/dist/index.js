import { resourceToHex, hexToResource } from '@latticexyz/common';
import { parseAbi, isHex, http, encodeFunctionData, zeroAddress, parseErc6492Signature, toHex } from 'viem';
import worldConfig, { systemsConfig } from '@latticexyz/world/mud.config';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { smartAccountActions } from 'permissionless';
import { callFrom, sendUserOperationFrom } from '@latticexyz/world/internal';
import { createBundlerClient as createBundlerClient$1, sendUserOperation, waitForUserOperationReceipt } from 'viem/account-abstraction';
import { getRecord } from '@latticexyz/store/internal';
import { getAction } from 'viem/utils';
import { waitForTransactionReceipt, getCode, writeContract, sendTransaction, signTypedData } from 'viem/actions';
import IBaseWorldAbi from '@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json';
import { callWithSignatureTypes } from '@latticexyz/world-module-callwithsignature/internal';
import moduleConfig from '@latticexyz/world-module-callwithsignature/mud.config';
import CallWithSignatureAbi from '@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json';
import { getConnectorClient, createConfig, createStorage, reconnect, getAccount, watchAccount, getConnectors, connect, disconnect } from '@wagmi/core';

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
  pollingInterval: 250
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
  client,
  userAddress
}) {
  const signer = getSessionSigner(userAddress);
  const account = await toSimpleSmartAccount({ client, owner: signer });
  return { account, signer };
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
    // Custom fee estimation for certain chains
    userOperation: {
      estimateFeesPerGas: createFeeEstimator(client)
    },
    ...config
  });
}
function createFeeEstimator(client) {
  if (!client.chain) return;
  if (client.chain.id === 31337) {
    return async () => ({ maxFeePerGas: 100000n, maxPriorityFeePerGas: 0n });
  }
  return void 0;
}
function getBundlerTransport(chain) {
  const bundlerHttpUrl = chain.rpcUrls.bundler?.http[0];
  if (bundlerHttpUrl) {
    return http(bundlerHttpUrl);
  }
  throw new Error(`Chain ${chain.id} config did not include a bundler RPC URL.`);
}

// src/session/core/client.ts
async function getSessionClient({
  userAddress,
  sessionAccount,
  sessionSigner,
  worldAddress,
  paymasterOverride
}) {
  const client = sessionAccount.client;
  if (!clientHasChain(client)) {
    throw new Error("Session account client had no associated chain.");
  }
  if (paymasterOverride) {
    console.log(`[Drawbridge/SessionClient] Creating session client with paymaster override`);
  }
  const bundlerClient = createBundlerClient({
    transport: getBundlerTransport(client.chain),
    client,
    account: sessionAccount,
    paymaster: paymasterOverride
  });
  const sessionClient = bundlerClient.extend(smartAccountActions).extend(
    callFrom({
      worldAddress,
      delegatorAddress: userAddress,
      publicClient: client
    })
  ).extend(
    sendUserOperationFrom({
      worldAddress,
      delegatorAddress: userAddress,
      publicClient: client
    })
  ).extend(() => ({ userAddress, worldAddress, internal_signer: sessionSigner }));
  return sessionClient;
}
function clientHasChain(client) {
  return client.chain != null;
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
  return errorMessage.includes("AA10") || errorMessage.includes("already constructed") || errorMessage.includes("already deployed");
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
async function deployWallet(client, userAddress, factoryAddress, factoryCalldata) {
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
async function deployWalletIfNeeded(client, userAddress, factoryAddress, factoryCalldata) {
  const deployed = await isWalletDeployed(client, userAddress);
  if (deployed) {
    return false;
  }
  await deployWallet(client, userAddress, factoryAddress, factoryCalldata);
  const nowDeployed = await isWalletDeployed(client, userAddress);
  if (!nowDeployed) {
    throw new Error(
      `Wallet deployment appeared to succeed but contract code not found at ${userAddress}`
    );
  }
  return true;
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
    onStatus?.({ type: "error", message: "Session deployment failed", error });
    throw error;
  }
}

// src/session/delegation/smart-account.ts
async function setupSessionSmartAccount({
  userClient,
  sessionClient,
  worldAddress,
  registerDelegation = true,
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
  if (alreadyDeployed && hasFactoryData) {
    console.log("[drawbridge] Removing factory data from deployed wallet");
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" });
    clearFactoryData(account);
  } else if (!alreadyDeployed && hasFactoryData) {
    console.log("[drawbridge] Deploying user wallet...");
    onStatus?.({ type: "deploying_wallet", message: "Deploying wallet (one-time setup)..." });
    await deployWalletIfNeeded(
      sessionClient,
      userAddress,
      factoryArgs.factory,
      factoryArgs.factoryData
    );
    onStatus?.({ type: "wallet_deployed", message: "Wallet deployed successfully!" });
    clearFactoryData(account);
  } else {
    onStatus?.({ type: "wallet_deployed", message: "Wallet ready" });
  }
  const calls = [];
  if (registerDelegation) {
    calls.push({
      to: worldAddress,
      abi: worldAbi,
      functionName: "registerDelegation",
      args: [sessionAddress, unlimitedDelegationControlId, "0x"]
    });
  }
  if (!calls.length) {
    await deploySessionAccount(sessionClient, onStatus);
    onStatus?.({ type: "complete", message: "Session setup complete!" });
    return;
  }
  onStatus?.({ type: "registering_delegation", message: "Setting up session..." });
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
  const rawSignature = await signCall(opts);
  const {
    address: factoryAddress,
    data: factoryCalldata,
    signature
  } = parseErc6492Signature(rawSignature);
  let finalSignature = signature ?? rawSignature;
  if (factoryAddress != null) {
    console.log("[callWithSignature] ERC-6492 signature detected");
    await deployWalletIfNeeded(
      sessionClient,
      opts.userClient.account.address,
      factoryAddress,
      factoryCalldata
    );
    finalSignature = signature;
  }
  try {
    return await getAction(
      sessionClient,
      writeContract,
      "writeContract"
    )({
      address: opts.worldAddress,
      abi: CallWithSignatureAbi,
      functionName: "callWithSignature",
      args: [opts.userClient.account.address, opts.systemId, opts.callData, finalSignature]
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (isAlreadyDeployedError(errorMessage)) {
      throw new Error("Smart wallet was just deployed. Please try again.");
    }
    throw error;
  }
}

// src/session/delegation/eoa.ts
async function setupSessionEOA({
  client,
  userClient,
  sessionClient,
  worldAddress,
  registerDelegation = true,
  onStatus
}) {
  const sessionAddress = sessionClient.account.address;
  const userAddress = userClient.account.address;
  console.log("[drawbridge] EOA setup:", { userAddress });
  const txs = [];
  if (registerDelegation) {
    const tx = await callWithSignature({
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
    txs.push(tx);
  }
  if (!txs.length) {
    await deploySessionAccount(sessionClient, onStatus);
    onStatus?.({ type: "complete", message: "Session setup complete!" });
    return;
  }
  onStatus?.({ type: "registering_delegation", message: "Setting up session..." });
  for (const hash of txs) {
    const receipt = await getAction(
      client,
      waitForTransactionReceipt,
      "waitForTransactionReceipt"
    )({ hash });
    if (receipt.status === "reverted") {
      throw new Error("Delegation registration transaction reverted");
    }
  }
  await deploySessionAccount(sessionClient, onStatus);
  console.log("[drawbridge] EOA setup complete");
  onStatus?.({ type: "complete", message: "Session setup complete!" });
}

// src/session/delegation/setup.ts
async function setupSession({
  client,
  userClient,
  sessionClient,
  worldAddress,
  registerDelegation = true,
  onStatus
}) {
  console.log("[drawbridge] Setup session:", {
    userAddress: userClient.account.address,
    accountType: userClient.account.type
  });
  if (userClient.account.type === "smart") {
    return setupSessionSmartAccount({
      userClient,
      sessionClient,
      worldAddress,
      registerDelegation,
      onStatus
    });
  } else {
    return setupSessionEOA({
      client,
      userClient,
      sessionClient,
      worldAddress,
      registerDelegation,
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
      isReady: false
    };
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
          isReady: false
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
        console.error("[drawbridge] Connection handler failed:", err);
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
    if (this.config.skipSessionSetup) {
      console.log("[drawbridge] Skipping session setup (wallet-only mode)");
      this.updateState({
        status: "ready" /* READY */,
        sessionClient: null,
        userAddress,
        sessionAddress: null,
        isReady: true
      });
      return;
    }
    console.log("[drawbridge] Setting up session for address:", userAddress);
    const signer = getSessionSigner(userAddress);
    const { account } = await getSessionAccount({
      client: userClient,
      userAddress
    });
    const sessionClient = await getSessionClient({
      userAddress,
      sessionAccount: account,
      sessionSigner: signer,
      worldAddress: this.config.worldAddress,
      paymasterOverride: this.config.paymasterClient
    });
    const hasDelegation = await checkDelegation({
      client: sessionClient,
      worldAddress: this.config.worldAddress,
      userAddress,
      sessionAddress: account.address
    });
    this.updateState({
      status: hasDelegation ? "ready" /* READY */ : "connected" /* CONNECTED */,
      sessionClient,
      userAddress,
      sessionAddress: account.address,
      isReady: hasDelegation
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
      client: this.state.sessionClient,
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
        client: userClient,
        userClient,
        sessionClient: this.state.sessionClient,
        worldAddress: this.config.worldAddress,
        onStatus
      });
      this.updateState({ status: "ready" /* READY */, isReady: true });
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
      isReady: false
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
  /** Get wagmi config (for advanced use cases like transactions) */
  getWagmiConfig() {
    return this.wagmiConfig;
  }
};

export { Drawbridge, DrawbridgeStatus };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map