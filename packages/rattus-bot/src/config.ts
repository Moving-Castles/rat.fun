import type { Hex } from "viem"
import type { Config } from "./types"

export function getServerUrl(chainId: number): string {
  switch (chainId) {
    case 8453:
      return "https://base.rat-fun-server.com"
    case 84532:
      return "https://base-sepolia.rat-fun-server.com"
    default:
      return "http://localhost:3131"
  }
}

export function loadConfig(opts: {
  chain?: string
  selector?: string
  autoRespawn?: boolean
  name?: string
  liquidateAt?: string
  liquidateBelow?: string
}): Config {
  const chainId = Number(opts.chain || process.env.CHAIN_ID || "84532")

  let privateKey = process.env.PRIVATE_KEY
  if (!privateKey) {
    throw new Error("PRIVATE_KEY environment variable is required")
  }

  // Ensure private key has 0x prefix
  if (!privateKey.startsWith("0x")) {
    privateKey = `0x${privateKey}`
  }

  // Validate private key format (should be 0x + 64 hex chars)
  if (!/^0x[0-9a-fA-F]{64}$/.test(privateKey)) {
    throw new Error(
      "Invalid PRIVATE_KEY format. Expected 32 bytes hex string (64 hex chars, optionally prefixed with 0x)"
    )
  }

  const anthropicApiKey = process.env.ANTHROPIC_API_KEY
  if (!anthropicApiKey) {
    throw new Error("ANTHROPIC_API_KEY environment variable is required")
  }

  // Parse liquidation thresholds
  const liquidateAtEnv = process.env.LIQUIDATE_AT_VALUE
  const liquidateAtOpt = opts.liquidateAt
  const liquidateAtValue = liquidateAtOpt
    ? Number(liquidateAtOpt)
    : liquidateAtEnv
      ? Number(liquidateAtEnv)
      : undefined

  const liquidateBelowEnv = process.env.LIQUIDATE_BELOW_VALUE
  const liquidateBelowOpt = opts.liquidateBelow
  const liquidateBelowValue = liquidateBelowOpt
    ? Number(liquidateBelowOpt)
    : liquidateBelowEnv
      ? Number(liquidateBelowEnv)
      : undefined

  return {
    privateKey: privateKey as Hex,
    anthropicApiKey,
    chainId,
    serverUrl: process.env.SERVER_URL || getServerUrl(chainId),
    tripSelector: (opts.selector || process.env.TRIP_SELECTOR || "claude") as
      | "claude"
      | "heuristic",
    autoRespawn: opts.autoRespawn ?? process.env.AUTO_RESPAWN === "true",
    ratName: opts.name || process.env.RAT_NAME || "RattusBot",
    worldAddress: process.env.WORLD_ADDRESS,
    rpcHttpUrl: process.env.RPC_HTTP_URL,
    liquidateAtValue,
    liquidateBelowValue
  }
}
