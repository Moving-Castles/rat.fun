import { useEffect } from "react"
import { useEntryKitConfig, useSessionClient } from "@latticexyz/entrykit/internal"
import { entryKitConnector, entryKitSession } from "$lib/modules/entry-kit/stores"
import { useConnectorClient } from "wagmi"

export default function SessionBridge() {
  const { chainId } = useEntryKitConfig()
  const sessionClient = useSessionClient()

  const connectorClient = useConnectorClient({ chainId })

  // Transfer session updates to svelte store
  useEffect(() => {
    entryKitSession.set(sessionClient.data)
  }, [sessionClient.data])

  // Transfer connector updates to svelte store
  useEffect(() => {
    entryKitConnector.set(connectorClient.data)
  }, [connectorClient.data])

  return null
}
