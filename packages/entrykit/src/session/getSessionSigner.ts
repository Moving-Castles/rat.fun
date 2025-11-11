import { Address, Hex, isHex } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { sessionStorage } from "./storage";

export function getSessionSigner(userAddress: Address) {
  let privateKey = sessionStorage.getSigner(userAddress);

  if (!privateKey) {
    // Attempt to migrate from old storage keys
    const deprecatedKey = typeof localStorage !== "undefined"
      ? localStorage.getItem(`mud:appSigner:privateKey:${userAddress.toLowerCase()}`)?.replace(/^"(.*)"$/, "$1")
      : null;

    privateKey = (isHex(deprecatedKey) ? deprecatedKey : generatePrivateKey()) as Hex;
    sessionStorage.setSigner(userAddress, privateKey);
  }

  return privateKeyToAccount(privateKey);
}
