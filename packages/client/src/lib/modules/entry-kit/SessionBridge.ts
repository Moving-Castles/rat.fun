import { useEffect } from "react"
import { useSessionClient } from "@latticexyz/entrykit/internal"
import { entryKitSession } from "$lib/modules/entry-kit/stores"

export default function SessionBridge() {
  const sessionClient = useSessionClient()

  // Transfer session updates to svelte store
  useEffect(() => {
    entryKitSession.set(sessionClient.data)
  }, [sessionClient.data, sessionClient])

  return null
}
