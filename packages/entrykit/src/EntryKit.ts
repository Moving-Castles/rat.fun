import { Address, Client } from "viem";
import type { PaymasterClient } from "viem/account-abstraction";
import { SessionClient } from "./common";
import { getSessionSigner } from "./session/getSessionSigner";
import { getSessionAccount } from "./session/getSessionAccount";
import { getSessionClient } from "./session/getSessionClient";
import { checkDelegation } from "./delegation/checkDelegation";
import { setupSession } from "./delegation/setupSession";
import { sessionStorage } from "./session/storage";

export type EntryKitConfig = {
  chainId: number;
  worldAddress: Address;
  paymasterClient?: PaymasterClient;
};

export type EntryKitState = {
  sessionClient: SessionClient | null;
  userAddress: Address | null;
  sessionAddress: Address | null;
  isReady: boolean;
};

export type PrerequisiteStatus = {
  hasDelegation: boolean;
  isReady: boolean;
};

type StateListener = (state: EntryKitState) => void;
type Unsubscribe = () => void;

export class EntryKit {
  private config: EntryKitConfig;
  private state: EntryKitState;
  private listeners = new Set<StateListener>();

  constructor(config: EntryKitConfig) {
    this.config = config;
    this.state = {
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false,
    };
  }

  // ===== Reactive State Management =====

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(listener: StateListener): Unsubscribe {
    this.listeners.add(listener);
    listener(this.state); // Immediate callback with current state
    return () => this.listeners.delete(listener);
  }

  /**
   * Get current state (non-reactive)
   */
  getState(): EntryKitState {
    return { ...this.state };
  }

  private updateState(updates: Partial<EntryKitState>): void {
    this.state = { ...this.state, ...updates };
    this.notify();
  }

  private notify(): void {
    this.listeners.forEach((listener) => listener(this.state));
  }

  // ===== Core API =====

  /**
   * Connect with user's wallet client
   * Creates session account and session client
   */
  async connect(userClient: Client): Promise<void> {
    if (!userClient.account) {
      throw new Error("Wallet client must have an account.");
    }
    if (!userClient.chain) {
      throw new Error("Wallet client must have a chain.");
    }

    const userAddress = userClient.account.address;

    // Get or create session signer
    const signer = getSessionSigner(userAddress);

    // Create session smart account
    const { account } = await getSessionAccount({
      client: userClient as any,
      userAddress,
    });

    // Create session client with MUD extensions
    const sessionClient = await getSessionClient({
      userAddress,
      sessionAccount: account,
      sessionSigner: signer,
      worldAddress: this.config.worldAddress,
      paymasterOverride: this.config.paymasterClient,
    });

    this.updateState({
      sessionClient,
      userAddress,
      sessionAddress: account.address,
    });

    // Check if delegation already exists
    await this.checkPrerequisites();
  }

  /**
   * Check if session is ready to use
   * Returns delegation status
   */
  async checkPrerequisites(): Promise<PrerequisiteStatus> {
    if (!this.state.sessionClient) {
      return { hasDelegation: false, isReady: false };
    }

    const hasDelegation = await checkDelegation({
      client: this.state.sessionClient,
      worldAddress: this.config.worldAddress,
      userAddress: this.state.userAddress!,
      sessionAddress: this.state.sessionAddress!,
    });

    this.updateState({ isReady: hasDelegation });

    return { hasDelegation, isReady: hasDelegation };
  }

  /**
   * Setup session (register delegation, deploy account)
   */
  async setupSession(userClient: Client): Promise<void> {
    if (!this.state.sessionClient) {
      throw new Error("Not connected. Call connect() first.");
    }

    await setupSession({
      client: userClient,
      userClient,
      sessionClient: this.state.sessionClient,
      worldAddress: this.config.worldAddress,
    });

    this.updateState({ isReady: true });
  }

  /**
   * Disconnect and clear session
   */
  disconnect(): void {
    this.updateState({
      sessionClient: null,
      userAddress: null,
      sessionAddress: null,
      isReady: false,
    });
  }

  /**
   * Clear stored session keys
   */
  clearStorage(): void {
    if (this.state.userAddress) {
      sessionStorage.removeSigner(this.state.userAddress);
    }
  }

  // ===== Convenience Getters =====

  get sessionClient(): SessionClient | null {
    return this.state.sessionClient;
  }

  get userAddress(): Address | null {
    return this.state.userAddress;
  }

  get sessionAddress(): Address | null {
    return this.state.sessionAddress;
  }

  get isReady(): boolean {
    return this.state.isReady;
  }
}
