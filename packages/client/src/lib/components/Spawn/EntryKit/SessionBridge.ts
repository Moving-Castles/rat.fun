import { useEffect } from "react"
import { useSessionClient } from "@latticexyz/entrykit/internal"
import { entryKitSession } from "./stores"

export default function SessionBridge({ userAddress }: { userAddress: string }) {
  const sessionClient = useSessionClient(userAddress)

  useEffect(() => {
    console.log("sessionClient", sessionClient)
    entryKitSession.set(sessionClient)
  }, [sessionClient.data, sessionClient])

  return null
}
