import { Chain, http } from "viem"

export function getBundlerTransport(chain: Chain) {
  // TODO: bundler websocket
  const bundlerHttpUrl = chain.rpcUrls.bundler?.http[0]
  if (bundlerHttpUrl) {
    return http(bundlerHttpUrl)
  }

  throw new Error(`Chain ${chain.id} config did not include a bundler RPC URL.`)
}
