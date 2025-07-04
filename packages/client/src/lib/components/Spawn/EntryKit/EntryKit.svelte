<script lang="ts">
  import { WagmiProvider } from "wagmi"
  import { createElement } from "react"
  import { createRoot } from "react-dom/client"
  import { wagmiConfig } from "./wagmiConfig"
  import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
  import { defineConfig, AccountButton } from "@latticexyz/entrykit/internal"
  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
  import { getEnvironment } from "$lib/modules/network"

  let { onComplete } = $props()

  let rootEl: HTMLElement

  const environment = getEnvironment(new URL(window.location.href))
  const networkConfig = getNetworkConfig(environment)

  const queryClient = new QueryClient()

  $effect(() => {
    const root = createRoot(rootEl)

    import("@latticexyz/entrykit/internal").then(({ EntryKitProvider }) => {
      const entrykit = createElement(
        EntryKitProvider,
        {
          config: defineConfig({
            chainId: networkConfig.chainId,
            worldAddress: networkConfig.worldAddress
          })
        },
        createElement(AccountButton)
      )

      console.log(networkConfig)

      const providers = createElement(
        WagmiProvider,
        { config: wagmiConfig },
        createElement(QueryClientProvider, { client: queryClient }, entrykit)
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
