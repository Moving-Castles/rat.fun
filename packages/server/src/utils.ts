import { Message, Outcome } from './types'
import { toBuffer, fromRpcSig, ecrecover, pubToAddress, bufferToHex } from "ethereumjs-util";
import jsSha3 from "js-sha3";

export function recoverAddress(signature: string, message: string) {
    const keccak256 = jsSha3.keccak256;

    // Prefix the message per Ethereum's signing process
    const prefix = `\u0019Ethereum Signed Message:\n${message.length}`;
    const prefixedMessage = prefix + message;

    // Hash the prefixed message and ensure it's a 0x-prefixed hex string
    const messageHashHex = "0x" + keccak256(prefixedMessage);
    const messageHash = toBuffer(messageHashHex);

    // Recover the address from the signature
    const { v, r, s } = fromRpcSig(signature);
    const pub = ecrecover(messageHash, v, r, s);
    const addrBuf = pubToAddress(pub);
    const recoveredAddress = bufferToHex(addrBuf);

    return recoveredAddress;
}

// Unpadded to padded
export function addressToId(address: string): string {
    if (!address) return "0x0"
    // remove '0x' prefix, pad the address with leading zeros up to 64 characters, then add '0x' prefix back
    return "0x" + address.slice(2).padStart(64, "0").toLowerCase()
}

// Function to construct messages
export function constructMessages(
    roomPrompt: string,
    ratPrompt: string,
    ratStats: string
): Message[] {
    const messages: Message[] = [];
    messages.push({ role: "user", content: `Room: ${roomPrompt}` });
    messages.push({ role: "user", content: `Rat: ${ratPrompt}` });
    messages.push({ role: "user", content: `RatStats: ${ratStats}` });
    return messages;
}

// Function to construct messages
export function constructOutcomeMessages(
    outcome: Outcome,
    ratStats: string
): Message[] {
    const messages: Message[] = [];
    messages.push({ role: "user", content: `Outcome: ${JSON.stringify(outcome.eventLog)}` });
    messages.push({ role: "user", content: `RatStats: ${ratStats}` });
    return messages;
}

export function isNegative(value: number): boolean {
    return value < 0;
}