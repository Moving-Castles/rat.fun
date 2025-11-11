import { parseAbi, isHex, http, toHex, parseErc6492Signature, encodeFunctionData, zeroAddress, formatEther } from 'viem';
import { generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { toSimpleSmartAccount } from 'permissionless/accounts';
import { smartAccountActions } from 'permissionless';
import { callFrom, sendUserOperationFrom } from '@latticexyz/world/internal';
import { createBundlerClient as createBundlerClient$1, sendUserOperation, waitForUserOperationReceipt } from 'viem/account-abstraction';
import { resourceToHex, hexToResource } from '@latticexyz/common';
import worldConfig, { systemsConfig } from '@latticexyz/world/mud.config';
import { getRecord } from '@latticexyz/store/internal';
import { signTypedData, writeContract, waitForTransactionReceipt, readContract } from 'viem/actions';
import { getAction } from 'viem/utils';
import IBaseWorldAbi from '@latticexyz/world/out/IBaseWorld.sol/IBaseWorld.abi.json';
import { callWithSignatureTypes } from '@latticexyz/world-module-callwithsignature/internal';
import moduleConfig from '@latticexyz/world-module-callwithsignature/mud.config';
import CallWithSignatureAbi from '@latticexyz/world-module-callwithsignature/out/CallWithSignatureSystem.sol/CallWithSignatureSystem.abi.json';
import createDebug from 'debug';

// src/session/getSessionSigner.ts

// src/session/storage.ts
var SessionStorage = class {
  constructor() {
    this.STORAGE_KEY = "entrykit:session-signers";
    this.cache = this.load();
  }
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
  save() {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
  }
  getSigner(address) {
    const key = address.toLowerCase();
    return this.cache.signers[key];
  }
  setSigner(address, privateKey) {
    const key = address.toLowerCase();
    this.cache.signers[key] = privateKey;
    this.save();
  }
  removeSigner(address) {
    const key = address.toLowerCase();
    delete this.cache.signers[key];
    this.save();
  }
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

// src/getPaymaster.ts
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
}

// src/createBundlerClient.ts
function createBundlerClient(config) {
  const client = config.client;
  if (!client) throw new Error("No `client` provided to `createBundlerClient`.");
  const chain = config.chain ?? client.chain;
  const paymaster = chain ? getPaymaster(chain, config.paymaster) : void 0;
  return createBundlerClient$1({
    ...defaultClientConfig,
    paymaster: paymaster ? paymaster.type === "custom" ? paymaster.paymasterClient : {
      getPaymasterData: async () => ({
        paymaster: paymaster.address,
        paymasterData: "0x"
      })
    } : void 0,
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
    domain: {
      verifyingContract: worldAddress,
      salt: toHex(userClient.chain.id, { size: 32 })
    },
    types: callWithSignatureTypes,
    primaryType: "Call",
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
  const { address, signature } = parseErc6492Signature(rawSignature);
  if (address != null) {
    throw new Error(
      "ERC-6492 signatures, like from Coinbase Smart Wallet, are not yet supported. Try using a different wallet?"
    );
  }
  return getAction(
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
  console.log("setting up session", userClient);
  if (userClient.account.type === "smart") {
    const calls = [];
    if (registerDelegation) {
      console.log("registering delegation");
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
    console.log("setting up account with", calls, userClient);
    const hash = await getAction(userClient, sendUserOperation, "sendUserOperation")({ calls });
    console.log("got user op hash", hash);
    const receipt = await getAction(
      userClient,
      waitForUserOperationReceipt,
      "waitForUserOperationReceipt"
    )({ hash });
    console.log("got user op receipt", receipt);
    if (!receipt.success) {
      console.error("not successful?", receipt);
    }
  } else {
    const txs = [];
    if (registerDelegation) {
      console.log("registering delegation");
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
      console.log("got delegation tx", tx);
      txs.push(tx);
    }
    if (!txs.length) return;
    console.log("waiting for", txs.length, "receipts");
    for (const hash of txs) {
      const receipt = await getAction(
        client,
        waitForTransactionReceipt,
        "waitForTransactionReceipt"
      )({ hash });
      console.log("got tx receipt", receipt);
      if (receipt.status === "reverted") {
        console.error("tx reverted?", receipt);
      }
    }
  }
  if (!await sessionClient.account.isDeployed?.()) {
    console.log("creating session account by sending empty user op");
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
    console.log("got user op receipt", receipt);
  }
}

// src/EntryKit.ts
var EntryKit = class {
  constructor(config) {
    this.listeners = /* @__PURE__ */ new Set();
    this.config = config;
    this.state = {
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false
    };
  }
  // ===== Reactive State Management =====
  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener) {
    this.listeners.add(listener);
    listener(this.state);
    return () => this.listeners.delete(listener);
  }
  /**
   * Get current state (non-reactive)
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
  // ===== Core API =====
  /**
   * Connect with user's wallet client
   * Creates session account and session client
   */
  async connect(userClient) {
    if (!userClient.account) {
      throw new Error("Wallet client must have an account.");
    }
    if (!userClient.chain) {
      throw new Error("Wallet client must have a chain.");
    }
    const userAddress = userClient.account.address;
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
    this.updateState({
      sessionClient,
      userAddress,
      sessionAddress: account.address
    });
    await this.checkPrerequisites();
  }
  /**
   * Check if session is ready to use
   * Returns delegation status
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
   * Setup session (register delegation, deploy account)
   */
  async setupSession(userClient) {
    if (!this.state.sessionClient) {
      throw new Error("Not connected. Call connect() first.");
    }
    await setupSession({
      client: userClient,
      userClient,
      sessionClient: this.state.sessionClient,
      worldAddress: this.config.worldAddress
    });
    this.updateState({ isReady: true });
  }
  /**
   * Disconnect and clear session
   */
  disconnect() {
    this.updateState({
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false
    });
  }
  /**
   * Clear stored session keys
   */
  clearStorage() {
    if (this.state.userAddress) {
      sessionStorage.removeSigner(this.state.userAddress);
    }
  }
  // ===== Convenience Getters =====
  get sessionClient() {
    return this.state.sessionClient;
  }
  get userAddress() {
    return this.state.userAddress;
  }
  get sessionAddress() {
    return this.state.sessionAddress;
  }
  get isReady() {
    return this.state.isReady;
  }
};
async function internal_validateSigner({
  client,
  worldAddress,
  userAddress,
  sessionAddress,
  signerAddress
}) {
  const ownerAddress = await readContract(client, {
    address: sessionAddress,
    abi: simpleAccountAbi,
    functionName: "owner"
  });
  if (ownerAddress.toLowerCase() !== signerAddress.toLowerCase()) {
    throw new Error(
      `Session account owner (${ownerAddress}) does not match message signer (${signerAddress}).`
    );
  }
  const hasDelegation = await checkDelegation({
    client,
    worldAddress,
    sessionAddress,
    userAddress,
    blockTag: "latest"
  });
  if (!hasDelegation) {
    throw new Error(
      `Session account (${sessionAddress}) does not have delegation for user account (${userAddress}).`
    );
  }
}
var simpleAccountAbi = [
  {
    inputs: [],
    name: "owner",
    outputs: [
      {
        internalType: "address",
        name: "",
        type: "address"
      }
    ],
    stateMutability: "view",
    type: "function"
  }
];
function formatBalance(wei) {
  const formatted = formatEther(wei);
  const parsed = parseFloat(formatted);
  if (parsed > 0 && parsed < 1e-5) {
    return "<0.00001";
  }
  const magnitude = Math.floor(parsed).toString().length;
  return parsed.toLocaleString("en-US", { maximumFractionDigits: Math.max(0, 6 - magnitude) });
}
var debug = createDebug("mud:entrykit");
var error = createDebug("mud:entrykit");
debug.log = console.debug.bind(console);
error.log = console.error.bind(console);

export { EntryKit, callWithSignature, checkDelegation, createBundlerClient, debug, defineCall, formatBalance, getBundlerTransport, getPaymaster, getSessionAccount, getSessionClient, getSessionSigner, internal_validateSigner, sessionStorage, setupSession, signCall };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map