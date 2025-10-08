/*
 * This file sets up all the definitions required for a MUD client.
 */

import { createSystemCalls } from "./createSystemCalls"
import { setupNetwork } from "./setupNetwork"

export type SetupResult = Awaited<ReturnType<typeof setup>>

export async function setup(
  privateKey: string,
  chainId: number
): Promise<{
  network: Awaited<ReturnType<typeof setupNetwork>>
  systemCalls: ReturnType<typeof createSystemCalls>
}> {
  const network = await setupNetwork(privateKey, chainId)
  const systemCalls = createSystemCalls(network)

  return {
    network,
    systemCalls
  }
}
