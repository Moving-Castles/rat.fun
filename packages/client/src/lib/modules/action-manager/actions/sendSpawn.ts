import { spawn } from "$lib/modules/on-chain-transactions"
import { busy } from "../index.svelte"
import { SpawnError } from "$lib/modules/error-handling/errors"

const DEFAULT_TIMING = 4000

/**
 * Spawn
 * @param name The name of the player
 */
export async function sendSpawn(name: string) {
  if (busy.Spawn.current !== 0 || !name) return

  busy.Spawn.set(0.99, { duration: DEFAULT_TIMING }) // we never get to 1

  try {
    await spawn(name)
  } catch (e) {
    throw new SpawnError(`Failed to spawn player "${name}"`, e)
  } finally {
    busy.Spawn.set(0, { duration: 0 })
  }
}
