import { useEffect, useState } from "react"
import { useSessionClient } from "@latticexyz/entrykit/internal"
import { wagmiConfigStateful, entryKitSession } from "$lib/modules/entry-kit/stores"
import { useConfig } from "wagmi"

export default function SessionBridge({ onSessionStart, onSessionChange }) {
  let [initialised, setInitialised] = useState(false)
  const sessionClient = useSessionClient()

  const wagmiConfig = useConfig()

  // Transfer session updates to svelte store
  useEffect(() => {
    entryKitSession.set(sessionClient.data)
    if (initialised) {
      console.log("We have synced entrykit's session state", entryKitSession)
      onSessionChange(sessionClient.data)
    } else {
      onSessionStart(sessionClient.data)
    }
    setInitialised(true)
  }, [sessionClient.data])

  // Transfer wagmi config state updates to svelte store
  useEffect(() => {
    wagmiConfigStateful.set(wagmiConfig)
    // console.log("We have synced entrykit's wagmi config state for use by the app", wagmiConfig)
    // callback(wagmiConfig)
  }, [wagmiConfig, wagmiConfig.state])

  return null
}
