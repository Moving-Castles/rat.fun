import { ENVIRONMENT } from "$lib/mud/enums"
import { Address } from "viem/accounts"
import { mount } from "@latticexyz/account-kit/bundle"
import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
import { wagmiConfig } from "$lib/components/Spawn/EntryKit/wagmiConfig"

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

  mount(resolvedConfig)
}
