import dotenv from "dotenv"
import { fallback, http } from "viem"
import { setupNetwork } from "server/internal"
import { chain, rpcHttpUrl } from "./constants"

dotenv.config({ path: "../../packages/server/.env" })

const PRIVATE_KEY = process.env.PRIVATE_KEY as string

// Initialize MUD
export async function initMud() {
  const transport = fallback([http(rpcHttpUrl)])
  const network = await setupNetwork(PRIVATE_KEY, chain.id, transport)

  // Wait for sync to complete
  await new Promise<void>(resolve => {
    const subscription = network.components.SyncProgress.update$.subscribe(({ value }) => {
      const syncStep = value[0]?.step
      if (syncStep === "live") {
        subscription.unsubscribe()
        resolve()
      }
    })
  })

  return network
}
