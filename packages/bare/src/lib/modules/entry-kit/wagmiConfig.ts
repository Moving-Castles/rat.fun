import { Chain, http } from "viem"
import { Config, createConfig, CreateConnectorFn } from "wagmi"
import { injected, coinbaseWallet, safe } from "wagmi/connectors"
import { getDefaultConfig } from "connectkit"
import { extendedBaseSepolia, extendedMudFoundry } from "$lib/mud/extendedChainConfigs"

export const chains = [extendedMudFoundry, extendedBaseSepolia] as const satisfies Chain[]

export const transports = {
  [extendedBaseSepolia.id]: http(),
  [extendedMudFoundry.id]: http()
} as const

// Based on entrykit's createWagmiConfig but with a different connector order
export function wagmiConfig(): Config<typeof chains, typeof transports> {
  const appName = document.title
  // TODO: remove connectors and use ConnectKit's default once https://github.com/wevm/wagmi/pull/4691 lands
  // (this is a TODO from entrykit's createWagmiConfig and is mostly here for context)
  const connectors: CreateConnectorFn[] = []

  connectors.push(
    coinbaseWallet({
      appName,
      overrideIsMetaMask: false
    }),
    injected({ target: "metaMask" })
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
    walletConnectProjectId: "",
    enableFamily: false,
    connectors
  })

  return createConfig(configParams) as never
}
