import { Chain, http } from "viem"
import { createConfig, createStorage, CreateConnectorFn } from "wagmi"
import { coinbaseWallet, injected, safe, metaMask, walletConnect } from "wagmi/connectors"
import {
  extendedBase,
  extendedBaseSepolia,
  extendedMudFoundry
} from "$lib/mud/extendedChainConfigs"
import { PUBLIC_WALLET_CONNECT_PROJECT_ID } from "$env/static/public"
import { hasExtensionSupport } from "$lib/modules/utils"

export const chains = [
  extendedBase,
  extendedBaseSepolia,
  extendedMudFoundry
] as const satisfies Chain[]

export const transports = {
  [extendedBase.id]: http(),
  [extendedBaseSepolia.id]: http(),
  [extendedMudFoundry.id]: http()
} as const

export function wagmiConfig(chainId: number) {
  const appName = "RAT.FUN"
  const chain = chains.find(chain => chain.id === chainId) as (typeof chains)[number]

  // Build connectors list
  const connectors: CreateConnectorFn[] = []

  console.log("hasExtensionSupport()", hasExtensionSupport())

  // If browser supports extensions, leave connectors empty to allow auto-detection
  // If browser does not seem to support extensions (mobile), add specific connectors
  if (!hasExtensionSupport()) {
    connectors.push(
      coinbaseWallet({
        appName,
        overrideIsMetaMask: false
      }),
      metaMask(),
      walletConnect({ projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID }),
      injected()
    )
  }

  // If we're in an iframe, include the SafeConnector
  const shouldUseSafeConnector = !(typeof window === "undefined") && window?.parent !== window
  if (shouldUseSafeConnector) {
    connectors.push(
      safe({
        allowedDomains: [/gnosis-safe.io$/, /app.safe.global$/]
      })
    )
  }

  console.log("connectors", connectors)

  return createConfig({
    chains: [chain],
    transports,
    connectors,
    pollingInterval: extendedBaseSepolia.id === chainId ? 2000 : undefined,
    storage: createStorage({
      storage: typeof window !== "undefined" ? window.localStorage : undefined
    })
  })
}
