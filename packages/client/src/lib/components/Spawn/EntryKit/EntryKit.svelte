<script lang="ts">
  import type { Hex } from "viem"
  import { WagmiProvider } from "wagmi"
  import { get } from "svelte/store"

  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
  import { getEnvironment } from "$lib/modules/network"

  import { page } from "$app/state"
  import { createElement, useSyncExternalStore } from "react"
  import { createPortal } from "react-dom"
  import { createRoot } from "react-dom/client"
  import { QueryClientProvider, QueryClient } from "@tanstack/react-query"
  import { defineConfig, AccountButton } from "@latticexyz/entrykit/internal"

  import { paymasters } from "$lib/modules/entry-kit/paymasters"
  import { wagmiConfig } from "$lib/modules/entry-kit/wagmiConfig"
  import SessionBridge from "$lib/modules/entry-kit/SessionBridge"
  import { entryKitButton } from "$lib/modules/entry-kit/stores"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"

  let rootEl: HTMLElement

  const environment = getEnvironment()
  const networkConfig = getNetworkConfig(environment, page.url)
  const queryClient = new QueryClient()

  let lastConnectedAddress = $state("")

  function AccountButtonPortal() {
    const syncedEntryKitButton = useSyncExternalStore(entryKitButton.subscribe, () =>
      get(entryKitButton)
    )
    if (!syncedEntryKitButton) {
      return null
    } else {
      return createPortal(createElement(AccountButton), syncedEntryKitButton)
    }
  }

  $effect(() => {
    const root = createRoot(rootEl)
    const config = wagmiConfig()

    import("@latticexyz/entrykit/internal").then(({ EntryKitProvider }) => {
      const entrykit = createElement(
        EntryKitProvider,
        {
          config: defineConfig({
            chainId: networkConfig.chainId,
            worldAddress: networkConfig.worldAddress as Hex,
            paymasterOverride: paymasters[networkConfig.chainId]
          })
        },
        [
          // The button (rendered via portal to the element bound to entryKitButton, so it can be inside svelte, not react tree)
          createElement(AccountButtonPortal, { key: "account-button" }),
          // State sync
          createElement(SessionBridge, {
            key: "session-bridge",
            onSessionStart: (e: any) => {
              if (e?.account) {
                lastConnectedAddress = e.account.address
              }
            },
            onSessionChange: (e: any) => {
              if (!e) {
                // The user has now disconnected or changed account
                UIState.set(UI.SPAWNING)
              } else if (e.account) {
                if (lastConnectedAddress !== "" && lastConnectedAddress !== e.account.address) {
                  UIState.set(UI.SPAWNING)
                }
                lastConnectedAddress = e.account.address
              }
            }
          })
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
    display: none;
  }
</style>
