import { Address, Hex } from "viem";

type SessionStore = {
  signers: Record<string, string>; // lowercase address → private key
};

export class SessionStorage {
  private cache: SessionStore;
  private readonly STORAGE_KEY = "entrykit:session-signers";

  constructor() {
    this.cache = this.load();
  }

  private load(): SessionStore {
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

  private save(): void {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.cache));
  }

  getSigner(address: Address): Hex | undefined {
    const key = address.toLowerCase();
    return this.cache.signers[key] as Hex | undefined;
  }

  setSigner(address: Address, privateKey: Hex): void {
    const key = address.toLowerCase();
    this.cache.signers[key] = privateKey;
    this.save();
  }

  removeSigner(address: Address): void {
    const key = address.toLowerCase();
    delete this.cache.signers[key];
    this.save();
  }

  clear(): void {
    this.cache = { signers: {} };
    this.save();
  }
}

export const sessionStorage = new SessionStorage();
