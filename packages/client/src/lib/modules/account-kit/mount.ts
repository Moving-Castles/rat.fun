import type { Chain } from "viem"
import { fallback } from "viem"
import { ENVIRONMENT } from "$lib/mud/enums"
import { Address } from "viem/accounts"
import { mount } from "@latticexyz/account-kit/bundle"
import { createConfig, http, webSocket } from "@wagmi/core"
import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
import { supportedChains } from "$lib/mud/supportedChains"
import { transportObserver } from "@latticexyz/common"
// import { webSocket } from "viem"

export function mountAccountKit(environment: ENVIRONMENT) {
  // Hack to fix:  "Failed to mount MUD Account Kit. ReferenceError: process is not defined"
  window.process = {
    ...window.process,
    //
    env: {
      RAINBOW_PROVIDER_API_KEY: ""
    }
  }

  const networkConfig = getNetworkConfig(environment)

  console.log("resolved networkConfig", networkConfig)

  // Only include foundry chain in development
  const chains =
    environment === ENVIRONMENT.DEVELOPMENT
      ? supportedChains
      : supportedChains.filter(c => c.id !== 31337)

  console.log("resolved chains", chains)

  const chainTransports = chains.map(chain => {
    const transports = []

    if (chain.rpcUrls.default.webSocket) {
      transports.push(webSocket(chain.rpcUrls.default.webSocket))
    } else if (chain.rpcUrls.default.http) {
      transports.push(http(chain.rpcUrls.default.http))
    }

    const transport = transportObserver(fallback(transports))

    return [chain.id, transport]
  })

  console.log("resolved chainTransports", chainTransports)

  const transports = Object.fromEntries(chainTransports)

  console.log("resolved transports", transports)

  const wagmiConfig = createConfig({
    chains: chains as readonly [Chain, ...Chain[]],
    pollingInterval: 1_000,
    transports
  })

  console.log("resolved wagmiConfig", wagmiConfig)

  const resolvedConfig = {
    rootContainer: document.getElementById("account-kit"),
    wagmiConfig,
    accountKitConfig: {
      theme: "dark" as string,
      worldAddress: networkConfig.worldAddress as Address,
      erc4337: false,
      chainId: networkConfig.chainId as number,
      appInfo: {
        name: "RAT.FUN"
      }
    }
  }

  console.log("final configuration")
  console.log(resolvedConfig)

  mount(resolvedConfig)
}
