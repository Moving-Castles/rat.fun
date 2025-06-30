import { Hex, recoverMessageAddress} from "viem"
import { SignedRequest } from "@modules/types"
import { hasDelegation } from "@modules/mud/getOnchainData/hasDelegation";
import { hasNonce, storeNonce } from "@modules/signature/db";
import { addressToId } from "@modules/signature/utils";
import { stringifyRequestForSignature } from "@modules/signature/stringifyRequestForSignature";
import { REQUEST_SIGNATURE_TIMEOUT_MS } from "@config";

/**
 * Verify the request timeout, nonce and signature,
 * optionally substitute the call signer address for `callFrom`,
 * and return the caller address converted to id.
 * @returns callerAddress signer or delegator player id.
 */
export async function verifyRequest<T>(signedRequest: SignedRequest<T>): Promise<Hex> {
  const recoveredAddress = await recoverMessageAddress({
    message: stringifyRequestForSignature(signedRequest),
    signature: signedRequest.signature
  })
  let callerAddress: Hex = recoveredAddress

  // Check timeout
  if (Date.now() - signedRequest.info.timestamp > REQUEST_SIGNATURE_TIMEOUT_MS) {
    throw new Error("Stale request timestamp");
  }

  // Check nonce, and store it to prevent replay attacks during the timeout window
  if (await hasNonce(signedRequest.info.nonce)) {
    throw new Error("Nonce already used");
  }
  await storeNonce(signedRequest.info.nonce)

  // Check delegation and substitute playerAddress if necessary
  if (signedRequest.info.calledFrom) {
    if (!hasDelegation(signedRequest.info.calledFrom, recoveredAddress)) {
      throw new Error("Delegation not found");
    }
    callerAddress = signedRequest.info.calledFrom
  }

  return addressToId(callerAddress) as Hex
}
