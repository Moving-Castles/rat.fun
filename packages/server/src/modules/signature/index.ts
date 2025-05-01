import { toBuffer, fromRpcSig, ecrecover, pubToAddress, bufferToHex } from "ethereumjs-util";
import jsSha3 from "js-sha3";
import { addressToId } from "@modules/signature/utils";
import { OFFCHAIN_VALIDATION_MESSAGE } from "@config";

export function getSenderId(signature: string) {
    const keccak256 = jsSha3.keccak256;

    // Prefix the message per Ethereum's signing process
    const prefix = `\u0019Ethereum Signed Message:\n${OFFCHAIN_VALIDATION_MESSAGE.length}`;
    const prefixedMessage = prefix + OFFCHAIN_VALIDATION_MESSAGE;

    // Hash the prefixed message and ensure it's a 0x-prefixed hex string
    const messageHashHex = "0x" + keccak256(prefixedMessage);
    const messageHash = toBuffer(messageHashHex);

    // Recover the address from the signature
    const { v, r, s } = fromRpcSig(signature);
    const pub = ecrecover(messageHash, v, r, s);
    const addrBuf = pubToAddress(pub);
    const recoveredAddress = bufferToHex(addrBuf);

    return addressToId(recoveredAddress);
}

