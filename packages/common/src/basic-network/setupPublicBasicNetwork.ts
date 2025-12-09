import {
  createPublicClient,
  fallback,
  http,
  ClientConfig,
  PublicClient,
  Transport,
  Chain,
  webSocket
} from "viem"
import { transportObserver } from "@latticexyz/common"
import { BasicNetworkConfig, ChainRpcUrls } from "./getBasicNetworkConfig"

// Retry configuration for Alchemy RPC rate limits (429 errors)
const HTTP_RETRY_CONFIG = {
  retryCount: 5,
  retryDelay: 1000 // Base delay in ms, viem uses exponential backoff
} as const

export type SetupPublicBasicNetworkResult = {
  config: BasicNetworkConfig
  transport: Transport
  publicClient: PublicClient<Transport, Chain>
}

export function setupPublicBasicNetwork(
  networkConfig: BasicNetworkConfig,
  devMode: boolean
): SetupPublicBasicNetworkResult {
  console.log("[MUD/PublicNetwork] Setting up RPC transports:")
  console.log("  Environment:", devMode ? "development" : "production")
  console.log("  Chain:", networkConfig.chain.name, `(${networkConfig.chain.id})`)

  const transport = chainTransport(networkConfig.chain.rpcUrls.default, devMode)

  const clientOptions = {
    chain: networkConfig.chain,
    transport: transportObserver(transport),
    pollingInterval: 2000
  } as const satisfies ClientConfig

  const publicClient = createPublicClient(clientOptions)

  return {
    config: networkConfig,
    transport,
    publicClient
  }
}

function chainTransport(rpcUrls: ChainRpcUrls, devMode: boolean): Transport {
  const transports: Transport[] = []

  const webSocketUrl = rpcUrls.webSocket?.[0]
  const httpUrls = rpcUrls.http

  console.log("  WebSocket RPC:", webSocketUrl || "not configured")
  console.log("  HTTP retry config:", HTTP_RETRY_CONFIG)

  // Add WebSocket transport if WebSocket URL is available
  if (webSocketUrl) {
    if (devMode) {
      console.log("  WebSocket disabled in development mode")
    } else {
      transports.push(webSocket(webSocketUrl))
      console.log("  WebSocket transport added (primary)")
    }
  } else {
    console.log("  No WebSocket URL configured, using HTTP only")
  }

  // Always add HTTP transport as fallback
  for (const httpUrl of httpUrls) {
    console.log("  HTTP RPC:", httpUrl)
    transports.push(http(httpUrl, HTTP_RETRY_CONFIG))
    console.log("  HTTP transport added" + (transports.length > 1 ? " (fallback)" : " (primary)"))
  }

  console.log(
    `  📡 Final transport stack: ${transports.length > httpUrls.length ? "WebSocket → HTTP fallback" : "HTTP only"}`
  )

  return fallback(transports)
}
