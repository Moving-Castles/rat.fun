import { useEffect, useState } from "react"
import { useSessionClient } from "@latticexyz/entrykit/internal"
import { wagmiConfigStateful, entryKitSession } from "$lib/modules/entry-kit/stores"
import { useConfig } from "wagmi"

export default function SessionBridge({
  onSessionStart,
  onSessionChange
}: {
  onSessionStart: (data: any) => void
  onSessionChange: (data: any) => void
}) {
  const [initialised, setInitialised] = useState(false)
  const sessionClient = useSessionClient()

  const wagmiConfig = useConfig()

  // Transfer session updates to svelte store
  useEffect(() => {
    entryKitSession.set(sessionClient.data)
    if (initialised) {
      onSessionChange(sessionClient.data)
    } else {
      onSessionStart(sessionClient.data)
    }
    setInitialised(true)
  }, [sessionClient.data])

  // Transfer wagmi config state updates to svelte store
  useEffect(() => {
    wagmiConfigStateful.set(wagmiConfig)
    // callback(wagmiConfig)
  }, [wagmiConfig, wagmiConfig.state])

  return null
}
