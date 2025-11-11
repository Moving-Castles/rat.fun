<script lang="ts">
  import { initializeEntryKit, getEntryKit, sessionClient, wagmiConfig } from "$lib/modules/entry-kit"
  import { getConnectorClient, watchAccount } from "@wagmi/core"
  import { get } from "svelte/store"
  import { UIState } from "$lib/modules/ui/state.svelte"
  import { UI } from "$lib/modules/ui/enums"
  import { errorHandler } from "$lib/modules/error-handling"
  import { getNetworkConfig } from "$lib/mud/getNetworkConfig"
  import { environment } from "$lib/modules/network"
  import { page } from "$app/state"

  let lastConnectedAddress = $state("")
  let isConnecting = false

  // Initialize EntryKit with correct network on mount
  $effect(() => {
    const networkConfig = getNetworkConfig($environment, page.url)
    console.log("[EntryKit.svelte] Initializing with network:", networkConfig.chainId)
    initializeEntryKit(networkConfig)
  })

  function _errorHandler(error: unknown) {
    console.error("EntryKit error:", error)
    errorHandler(error)
  }

  // Watch for session changes
  $effect(() => {
    if ($sessionClient) {
      const address = $sessionClient.account.address

      if (lastConnectedAddress && lastConnectedAddress !== address) {
        // Account changed - reset to spawning
        UIState.set(UI.SPAWNING)
      }

      lastConnectedAddress = address
    } else if (lastConnectedAddress) {
      // Disconnected
      UIState.set(UI.SPAWNING)
      lastConnectedAddress = ""
    }
  })

  // Watch for wagmi account changes and setup entrykit
  async function handleAccountChange(account: any) {
    if (isConnecting) return

    try {
      const config = get(wagmiConfig)
      if (!config) return

      if (account.isConnected && account.address && account.chainId) {
        isConnecting = true

        let walletClient
        try {
          walletClient = await getConnectorClient(config)
        } catch (error) {
          // Connector might be disconnecting, ignore
          console.log("Could not get connector client (possibly disconnecting):", error)
          isConnecting = false
          return
        }

        // Ensure client has chain
        if (!walletClient.chain) {
          console.warn("Wallet client has no chain, waiting...")
          isConnecting = false
          return
        }

        try {
          const entrykit = getEntryKit()

          // Connect entrykit
          console.log("Connecting entrykit...")
          console.log("WalletClient:", {
            address: walletClient.account?.address,
            chainId: walletClient.chain?.id,
            type: walletClient.account?.type
          })

          await entrykit.connect(walletClient)
          console.log("EntryKit connected successfully")

          // Check if setup needed
          console.log("Checking prerequisites...")
          const prereqs = await entrykit.checkPrerequisites()
          console.log("Prerequisites:", prereqs)

          if (!prereqs.isReady) {
            console.log("Setting up session (registering delegation)...")
            await entrykit.setupSession(walletClient)

            // Verify setup completed
            console.log("Verifying setup...")
            const verified = await entrykit.checkPrerequisites()
            console.log("Setup verified:", verified)

            if (!verified.isReady) {
              throw new Error("Session setup failed - delegation not registered")
            }
          }

          console.log("EntryKit ready!")
        } catch (error) {
          console.error("EntryKit connection/setup failed:", error)
          throw error
        } finally {
          isConnecting = false
        }
      } else if (!account.isConnected) {
        // Wallet disconnected
        try {
          const entrykit = getEntryKit()
          entrykit.disconnect()
        } catch {
          // EntryKit might not be initialized yet
        }
        isConnecting = false
      }
    } catch (error) {
      isConnecting = false
      _errorHandler(error)
    }
  }

  // Setup wagmi account watcher
  $effect(() => {
    const config = get(wagmiConfig)
    if (!config) return

    const unwatch = watchAccount(config, {
      onChange: handleAccountChange
    })

    return () => unwatch()
  })
</script>
