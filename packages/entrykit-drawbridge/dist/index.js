import { resourceToHex, hexToResource } from '@latticexyz/common';
import { parseAbi, isHex, http, toHex, parseErc6492Signature, encodeFunctionData, zeroAddress } from 'viem';
import worldConfig, { systemsConfig } from '@latticexyz/world/mud.config';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { smartAccountActions } from 'permissionless';
import { callFrom, sendUserOperationFrom } from '@latticexyz/world/internal';
import { createBundlerClient as createBundlerClient$1, sendUserOperation, waitForUserOperationReceipt } from 'viem/account-abstraction';
import { getRecord } from '@latticexyz/store/internal';
import { signTypedData, writeContract, waitForTransactionReceipt, getCode, sendTransaction } from 'viem/actions';
import { getAction } from 'viem/utils';
import IBaseWorldAbi from '@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json';
import { callWithSignatureTypes } from '@latticexyz/world-module-callwithsignature/internal';
import moduleConfig from '@latticexyz/world-module-callwithsignature/mud.config';
import CallWithSignatureAbi from '@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json';
import { createConfig, createStorage, reconnect, getAccount, watchAccount, getConnectorClient, getConnectors, connect, disconnect } from '@wagmi/core';

// src/core/types.ts
var EntryKitStatus = /* @__PURE__ */ ((EntryKitStatus2) => {
  EntryKitStatus2["UNINITIALIZED"] = "uninitialized";
  EntryKitStatus2["DISCONNECTED"] = "disconnected";
  EntryKitStatus2["CONNECTING"] = "connecting";
  EntryKitStatus2["CONNECTED"] = "connected";
  EntryKitStatus2["SETTING_UP_SESSION"] = "setting_up_session";
  EntryKitStatus2["READY"] = "ready";
  EntryKitStatus2["ERROR"] = "error";
  return EntryKitStatus2;
})(EntryKitStatus || {});
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

// src/session/storage.ts
var SessionStorage = class {
  constructor() {
    this.STORAGE_KEY = "entrykit:session-signers";
    this.cache = this.load();
  }
  /**
   * Load session store from localStorage
   */
  load() {
    if (typeof localStorage === "undefined") {
      return { signers: {} };
    }
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) {
      return { signers: {} };
    }
    try {
      return JSON.parse(stored);
    } catch {
      return { signers: {} };
    }
  }
  /**
   * Save session store to localStorage
   */
  save() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
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

// src/session/getSessionSigner.ts
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

// src/bundler/getPaymaster.ts
function getPaymaster(chain, paymasterOverride) {
  const contracts = chain.contracts ?? {};
  if (paymasterOverride) {
    return {
      type: "custom",
      paymasterClient: paymasterOverride
    };
  }
  if ("paymaster" in contracts && contracts.paymaster != null) {
    if ("address" in contracts.paymaster) {
      return {
        type: "simple",
        address: contracts.paymaster.address
      };
    }
  }
  return void 0;
}

// src/bundler/createBundlerClient.ts
function createBundlerClient(config) {
  const client = config.client;
  if (!client) throw new Error("No `client` provided to `createBundlerClient`.");
  const chain = config.chain ?? client.chain;
  const paymaster = chain ? getPaymaster(chain, config.paymaster) : void 0;
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

// src/session/getSessionClient.ts
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
async function isSmartWalletDeployed(sessionClient, walletAddress) {
  const code = await getAction(
    sessionClient,
    getCode,
    "getCode"
  )({
    address: walletAddress
  });
  if (code !== void 0 && code !== "0x") {
    return true;
  }
  return false;
}
async function deploySmartWallet(sessionClient, walletAddress, factoryAddress, factoryCalldata) {
  try {
    const txHash = await getAction(
      sessionClient,
      sendTransaction,
      "sendTransaction"
    )({
      account: sessionClient.account,
      chain: sessionClient.chain,
      to: factoryAddress,
      data: factoryCalldata
    });
    await getAction(
      sessionClient,
      waitForTransactionReceipt,
      "waitForTransactionReceipt"
    )({
      hash: txHash
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes("AA10") || errorMessage.includes("already constructed") || errorMessage.includes("already deployed")) {
      return;
    }
    throw new Error(
      `Failed to deploy smart wallet at ${walletAddress}: ${errorMessage}`
    );
  }
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
    const isDeployed = await isSmartWalletDeployed(sessionClient, opts.userClient.account.address);
    if (!isDeployed) {
      await deploySmartWallet(
        sessionClient,
        opts.userClient.account.address,
        factoryAddress,
        factoryCalldata
      );
      const isNowDeployed = await isSmartWalletDeployed(sessionClient, opts.userClient.account.address);
      if (!isNowDeployed) {
        throw new Error(
          `Wallet deployment appeared to succeed but contract code not found at ${opts.userClient.account.address}`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 2e3));
    }
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
    if (errorMessage.includes("AA10") || errorMessage.includes("already constructed")) {
      throw new Error(
        `Smart wallet was just deployed. Please try the operation again in a moment. (If you just added a new address in Coinbase Wallet, this is expected on first use.)`
      );
    }
    throw error;
  }
}

// src/utils/defineCall.ts
function defineCall(call) {
  return call;
}

// src/delegation/setupSession.ts
async function setupSession({
  client,
  userClient,
  sessionClient,
  worldAddress,
  registerDelegation = true
}) {
  const sessionAddress = sessionClient.account.address;
  console.log("[entrykit-drawbridge] setting up session", userClient);
  if (userClient.account.type === "smart") {
    const calls = [];
    if (registerDelegation) {
      console.log("[entrykit-drawbridge] registering delegation");
      calls.push(
        defineCall({
          to: worldAddress,
          abi: worldAbi,
          functionName: "registerDelegation",
          args: [sessionAddress, unlimitedDelegationControlId, "0x"]
        })
      );
    }
    if (!calls.length) return;
    console.log("[entrykit-drawbridge] setting up account with", calls, userClient);
    const hash = await getAction(userClient, sendUserOperation, "sendUserOperation")({ calls });
    console.log("[entrykit-drawbridge] got user op hash", hash);
    const receipt = await getAction(
      userClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash });
    console.log("[entrykit-drawbridge] got user op receipt", receipt);
    if (!receipt.success) {
      console.error("[entrykit-drawbridge] not successful?", receipt);
    }
  } else {
    const txs = [];
    if (registerDelegation) {
      console.log("[entrykit-drawbridge] registering delegation");
      const tx = await callWithSignature({
        client,
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
      console.log("[entrykit-drawbridge] got delegation tx", tx);
      txs.push(tx);
    }
    if (!txs.length) return;
    console.log("[entrykit-drawbridge] waiting for", txs.length, "receipts");
    for (const hash of txs) {
      const receipt = await getAction(
        client,
        waitForTransactionReceipt,
        "waitForTransactionReceipt"
      )({ hash });
      console.log("[entrykit-drawbridge] got tx receipt", receipt);
      if (receipt.status === "reverted") {
        console.error("[entrykit-drawbridge] tx reverted?", receipt);
      }
    }
  }
  if (!await sessionClient.account.isDeployed?.()) {
    console.log("[entrykit-drawbridge] creating session account by sending empty user op");
    const hash = await getAction(
      sessionClient,
      sendUserOperation,
      "sendUserOperation"
    )({
      calls: [{ to: zeroAddress }]
    });
    const receipt = await getAction(
      sessionClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash });
    console.log("[entrykit-drawbridge] got user op receipt", receipt);
  }
}
var EntryKit = class {
  constructor(config) {
    this.listeners = /* @__PURE__ */ new Set();
    this.accountWatcherCleanup = null;
    this.isConnecting = false;
    this.isDisconnecting = false;
    this.config = config;
    this.state = {
      status: "uninitialized" /* UNINITIALIZED */,
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false
    };
    this.wagmiConfig = createConfig({
      chains: config.chains,
      transports: config.transports,
      connectors: config.connectors,
      pollingInterval: config.pollingInterval,
      storage: createStorage({
        storage: typeof window !== "undefined" ? window.localStorage : void 0
      })
    });
  }
  /**
   * Initialize EntryKit (await reconnection and setup account watcher)
   *
   * This should be called once after construction and awaited.
   * It will attempt to reconnect to a previously connected wallet.
   */
  async initialize() {
    console.log("[entrykit-drawbridge] Initializing...");
    let reconnected = false;
    try {
      await reconnect(this.wagmiConfig);
      reconnected = true;
      console.log("[entrykit-drawbridge] Reconnection successful");
    } catch (err) {
      console.log("[entrykit-drawbridge] No previous connection to restore");
      this.updateState({ status: "disconnected" /* DISCONNECTED */ });
    }
    this.setupAccountWatcher();
    if (reconnected) {
      const account = getAccount(this.wagmiConfig);
      if (account.isConnected && account.address) {
        console.log("[entrykit-drawbridge] Processing reconnected wallet:", account.address);
        await this.handleWalletConnection();
      }
    }
    console.log("[entrykit-drawbridge] Initialization complete");
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
   * const unsubscribe = entrykit.subscribe((state) => {
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
    const unwatch = watchAccount(this.wagmiConfig, {
      onChange: async (account) => {
        console.log("[entrykit-drawbridge] Account change:", {
          isConnected: account.isConnected,
          address: account.address
        });
        if (!account.isConnected) {
          console.log("[entrykit-drawbridge] Wallet disconnected");
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
          console.log("[entrykit-drawbridge] Ignoring connection attempt during disconnect");
          return;
        }
        if (this.isConnecting) {
          console.log("[entrykit-drawbridge] Already processing connection");
          return;
        }
        if (!account.connector || !account.address) {
          return;
        }
        try {
          this.isConnecting = true;
          await this.handleWalletConnection();
        } catch (err) {
          console.error("[entrykit-drawbridge] Connection handler failed:", err);
        } finally {
          this.isConnecting = false;
        }
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
      console.log("[entrykit-drawbridge] Could not get connector client");
      return;
    }
    if (!userClient.account || !userClient.chain) {
      console.log("[entrykit-drawbridge] Wallet client missing account or chain");
      return;
    }
    const userAddress = userClient.account.address;
    console.log("[entrykit-drawbridge] Wallet connected:", userAddress);
    if (this.config.skipSessionSetup) {
      console.log("[entrykit-drawbridge] Skipping session setup (wallet-only mode)");
      this.updateState({
        status: "ready" /* READY */,
        sessionClient: null,
        userAddress,
        sessionAddress: null,
        isReady: true
      });
      return;
    }
    console.log("[entrykit-drawbridge] Setting up session for address:", userAddress);
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
    console.log("[entrykit-drawbridge] Session connection complete, isReady:", hasDelegation);
  }
  // ===== Public API =====
  /**
   * Get available wallet connectors for UI display
   *
   * @returns Array of connector info (id, name, type)
   */
  getAvailableConnectors() {
    const connectors = getConnectors(this.wagmiConfig);
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
   * 2. Account watcher will automatically handle EntryKit session creation
   *
   * @param connectorId Connector ID (from getAvailableConnectors())
   * @throws If connector not found or connection fails
   */
  async connectWallet(connectorId) {
    const connectors = getConnectors(this.wagmiConfig);
    const connector = connectors.find((c) => c.id === connectorId);
    if (!connector) {
      throw new Error(`Connector not found: ${connectorId}`);
    }
    console.log("[entrykit-drawbridge] Connecting to wallet:", connectorId);
    this.updateState({ status: "connecting" /* CONNECTING */ });
    try {
      await connect(this.wagmiConfig, {
        connector,
        chainId: this.config.chainId
      });
    } catch (err) {
      if (err instanceof Error && err.name === "ConnectorAlreadyConnectedError") {
        console.log("[entrykit-drawbridge] Already connected");
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
   * 2. Account watcher will automatically clear EntryKit state
   */
  async disconnectWallet() {
    console.log("[entrykit-drawbridge] disconnectWallet() called");
    console.log("[entrykit-drawbridge] Current state:", this.state);
    console.log("[entrykit-drawbridge] Calling wagmi disconnect()...");
    try {
      this.isDisconnecting = true;
      await disconnect(this.wagmiConfig);
      console.log("[entrykit-drawbridge] wagmi disconnect() returned");
    } catch (err) {
      console.error("[entrykit-drawbridge] wagmi disconnect() threw error:", err);
      throw err;
    } finally {
      this.isDisconnecting = false;
    }
    console.log("[entrykit-drawbridge] Disconnect complete");
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
  async setupSession() {
    if (this.config.skipSessionSetup) {
      throw new Error(
        "Cannot setup session when skipSessionSetup is true. This EntryKit instance is in wallet-only mode."
      );
    }
    if (!this.state.sessionClient) {
      throw new Error("Not connected. Call connectWallet() first.");
    }
    console.log("[entrykit-drawbridge] Setting up session (registering delegation)...");
    this.updateState({ status: "setting_up_session" /* SETTING_UP_SESSION */ });
    const userClient = await getConnectorClient(this.wagmiConfig);
    try {
      await setupSession({
        client: userClient,
        userClient,
        sessionClient: this.state.sessionClient,
        worldAddress: this.config.worldAddress
      });
      this.updateState({ status: "ready" /* READY */, isReady: true });
      console.log("[entrykit-drawbridge] Session setup complete");
    } catch (err) {
      this.updateState({ status: "connected" /* CONNECTED */ });
      throw err;
    }
  }
  /**
   * Cleanup and destroy EntryKit instance
   *
   * This will:
   * 1. Unwatch account changes
   * 2. Clear session state (but NOT localStorage keys)
   *
   * Call this when unmounting your app.
   */
  destroy() {
    console.log("[entrykit-drawbridge] Destroying instance");
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

export { EntryKit, EntryKitStatus, callWithSignature, checkDelegation, createBundlerClient, defineCall, getBundlerTransport, getPaymaster, getSessionAccount, getSessionClient, getSessionSigner, sessionStorage, setupSession, signCall };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map