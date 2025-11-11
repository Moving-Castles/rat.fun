import { Chain, http } from "viem"
import { Config, createConfig, CreateConnectorFn } from "wagmi"
import { coinbaseWallet, injected, safe, metaMask, walletConnect } from "wagmi/connectors"
import { getDefaultConfig } from "connectkit"
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

export function wagmiConfig(chainId: number): Config<typeof chains, typeof transports> {
  const appName = "RAT.FUN"
  const chain = chains.find(chain => chain.id === chainId) as (typeof chains)[number]

  // If browser supports extensions, leave connectors empty to allow auto-detection
  const connectors: CreateConnectorFn[] = []
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

  const configParams = getDefaultConfig({
    appName,
    chains: [chain],
    transports,
    pollingInterval: {
      [extendedBaseSepolia.id]: 2000
    },
    walletConnectProjectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
    enableFamily: false,
    connectors
  })

  return createConfig(configParams) as never
}
