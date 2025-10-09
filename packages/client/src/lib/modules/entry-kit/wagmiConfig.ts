import { Chain, http } from "viem"
import { Config, createConfig, CreateConnectorFn } from "wagmi"
import { coinbaseWallet, safe, metaMask, walletConnect } from "wagmi/connectors"
import { getDefaultConfig } from "connectkit"
import { extendedBaseSepolia, extendedMudFoundry } from "$lib/mud/extendedChainConfigs"
import { PUBLIC_WALLET_CONNECT_PROJECT_ID } from "$env/static/public"

export const chains = [extendedMudFoundry, extendedBaseSepolia] as const satisfies Chain[]

export const transports = {
  [extendedBaseSepolia.id]: http(),
  [extendedMudFoundry.id]: http()
} as const

export function wagmiConfig(): Config<typeof chains, typeof transports> {
  const appName = document.title
  const connectors: CreateConnectorFn[] = []

  connectors.push(
    coinbaseWallet({
      appName,
      overrideIsMetaMask: false
    }),
    metaMask(),
    walletConnect({ projectId: PUBLIC_WALLET_CONNECT_PROJECT_ID })
  )

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
    chains,
    transports,
    pollingInterval: {
      [extendedBaseSepolia.id]: 2000
    },
    appName: document.title,
    walletConnectProjectId: PUBLIC_WALLET_CONNECT_PROJECT_ID,
    enableFamily: false,
    connectors
  })

  return createConfig(configParams) as never
}
