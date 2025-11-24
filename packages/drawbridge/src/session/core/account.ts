import { Address, Chain, Client, LocalAccount, Transport } from "viem"
import { SmartAccount } from "viem/account-abstraction"
import { toSimpleSmartAccount } from "permissionless/accounts"
import { getSessionSigner } from "./signer"

export type GetSessionAccountReturnType = {
  readonly account: SmartAccount
  readonly signer: LocalAccount
}

export async function getSessionAccount<chain extends Chain>({
  client,
  userAddress
}: {
  client: Client<Transport, chain>
  userAddress: Address
}): Promise<GetSessionAccountReturnType> {
  const signer = getSessionSigner(userAddress)

  // DEBUG: Log client details before creating session account
  console.log("[getSessionAccount] Creating session account:", {
    userAddress,
    signerAddress: signer.address,
    chainId: client.chain?.id,
    chainName: client.chain?.name,
    transportType: (client.transport as any)?.type || "unknown",
    hasBundlerRpc: client.chain?.rpcUrls?.bundler?.http?.[0] || "none",
    timestamp: new Date().toISOString()
  })

  // Wrap the client to intercept and log all RPC calls
  const originalTransport = client.transport
  const loggingTransport = (args: any) => {
    const transport = originalTransport(args)
    const originalRequest = transport.request

    return {
      ...transport,
      request: async (requestArgs: any) => {
        const requestId = Math.random().toString(36).substring(7)
        console.log(`[getSessionAccount:RPC:${requestId}] Request:`, {
          method: requestArgs.method,
          params: requestArgs.params,
          timestamp: new Date().toISOString()
        })

        try {
          const result = await originalRequest(requestArgs)
          console.log(`[getSessionAccount:RPC:${requestId}] Success:`, {
            method: requestArgs.method,
            resultType: typeof result,
            timestamp: new Date().toISOString()
          })
          return result
        } catch (error) {
          console.error(`[getSessionAccount:RPC:${requestId}] Failed:`, {
            method: requestArgs.method,
            error: error instanceof Error ? error.message : String(error),
            errorName: error instanceof Error ? error.name : "Unknown",
            errorStack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
          })
          throw error
        }
      }
    }
  }

  const wrappedClient = { ...client, transport: loggingTransport as any }

  try {
    console.log("[getSessionAccount] Calling toSimpleSmartAccount...")
    const account = await toSimpleSmartAccount({
      client: wrappedClient as Client<Transport, chain>,
      owner: signer
    })
    console.log("[getSessionAccount] Session account created successfully:", {
      accountAddress: account.address,
      accountType: account.type,
      timestamp: new Date().toISOString()
    })
    return { account, signer }
  } catch (error) {
    console.error("[getSessionAccount] Failed to create session account:", {
      error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : "Unknown",
      errorStack: error instanceof Error ? error.stack : undefined,
      userAddress,
      signerAddress: signer.address,
      chainId: client.chain?.id,
      timestamp: new Date().toISOString()
    })
    throw error
  }
}
