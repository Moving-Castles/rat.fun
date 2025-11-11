// Main EntryKit class
export { EntryKit } from "./EntryKit";
export type { EntryKitConfig, EntryKitState, PrerequisiteStatus } from "./EntryKit";

// Types
export type { SessionClient, ConnectedClient } from "./common";
export type { Address, Hex, Client } from "viem";

// Session management
export { getSessionClient } from "./session/getSessionClient";
export { getSessionAccount } from "./session/getSessionAccount";
export { getSessionSigner } from "./session/getSessionSigner";
export { sessionStorage } from "./session/storage";

// Delegation
export { checkDelegation } from "./delegation/checkDelegation";
export { setupSession } from "./delegation/setupSession";

// Bundler
export { createBundlerClient } from "./createBundlerClient";
export { getBundlerTransport } from "./getBundlerTransport";

// Paymaster
export { getPaymaster } from "./getPaymaster";
export type { Paymaster } from "./getPaymaster";

// Utils
export { defineCall } from "./utils/defineCall";
export { callWithSignature } from "./utils/callWithSignature";
export { signCall } from "./utils/signCall";
export { internal_validateSigner } from "./validateSigner";

// Other utilities
export { formatBalance } from "./formatBalance";
export { debug } from "./debug";
