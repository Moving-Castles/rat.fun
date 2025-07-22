<script lang="ts">
  import type { Hex } from "viem"
  import { WagmiProvider } from "wagmi"

  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
  import { getEnvironment } from "$lib/modules/network"

  import { createElement } from "react"
  import { createRoot } from "react-dom/client"
  import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
  import { defineConfig, AccountButton } from "@latticexyz/entrykit/internal"

  import { wagmiConfig } from "$lib/modules/entry-kit/wagmiConfig"
  import SessionBridge from "$lib/modules/entry-kit/SessionBridge"

  let rootEl: HTMLElement

  const environment = getEnvironment(new URL(window.location.href))
  const networkConfig = getNetworkConfig(environment)
  const queryClient = new QueryClient()

  $effect(() => {
    const root = createRoot(rootEl)
    const config = wagmiConfig()

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
          createElement(AccountButton, { key: "account-button" }),
          // State sync
          createElement(SessionBridge, { key: "session-bridge" })
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
