import { useEffect } from "react"
import { useSessionClient } from "@latticexyz/entrykit/internal"
import { entryKitSession } from "$lib/mud/stores"

export default function SessionBridge() {
  const sessionClient = useSessionClient()

  useEffect(() => {
    entryKitSession.set(sessionClient.data)
  }, [sessionClient.data, sessionClient])

  return null
}
