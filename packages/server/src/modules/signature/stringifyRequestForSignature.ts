import { SignedRequestInfo } from "@modules/types"

/**
 * Helps ensure uniformity across signing and verification - accidentally swapping data/info order would be bad.
 */
export function stringifyRequestForSignature({
  data,
  info
}: {
  data: unknown
  info: SignedRequestInfo
}) {
  return JSON.stringify({ data, info })
}
