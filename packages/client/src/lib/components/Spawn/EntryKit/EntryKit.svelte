<script lang="ts">
  import type { Hex } from "viem"
  import { WagmiProvider } from "wagmi"
  import { createElement } from "react"
  import { createRoot } from "react-dom/client"
  import { wagmiConfig } from "./wagmiConfig"
  import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
  import { defineConfig, AccountButton } from "@latticexyz/entrykit/internal"
  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
  import { getEnvironment } from "$lib/modules/network"
  import SessionBridge from "./SessionBridge"
  import { entryKitSession } from "$lib/mud/stores"
  let rootEl: HTMLElement

  const environment = getEnvironment(new URL(window.location.href))
  const networkConfig = getNetworkConfig(environment)
  const queryClient = new QueryClient()

  $inspect($entryKitSession)

  $effect(() => {
    const root = createRoot(rootEl)
    const config = wagmiConfig(networkConfig.chainId)

    console.log("Resolved config", config)

    import("@latticexyz/entrykit/internal").then(({ EntryKitProvider }) => {
      const entrykit = createElement(
        EntryKitProvider,
        {
          config: defineConfig({
            chainId: networkConfig.chainId,
            worldAddress: networkConfig.worldAddress as Hex
          })
        },
        [
          // The button
          createElement(AccountButton),
          // State sync
          createElement(SessionBridge)
        ]
      )

      const providers = createElement(
        WagmiProvider,
        { config },
        //
        createElement(
          QueryClientProvider,
          { client: queryClient },
          //
          entrykit
        )
      )
      root.render(providers)
    })

    return () => root.unmount()
  })
</script>

<div bind:this={rootEl} class="root"></div>

<style>
  .root {
    display: flex;
    justify-content: center;
    align-items: center;
  }
</style>
