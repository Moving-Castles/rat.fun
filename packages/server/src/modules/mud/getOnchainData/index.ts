import { getComponentValue, Entity } from "@latticexyz/recs"
import { components, network } from "@modules/mud/initMud"
import { firstValueFrom, timeout, catchError, of } from "rxjs"

export function getRatId(playerId: string) {
  const { CurrentRat } = components
  return (getComponentValue(CurrentRat, playerId as Entity)?.value ?? "unknown rat") as string
}

export function getPlayerMasterKey(playerId: string) {
  const { MasterKey } = components
  return (getComponentValue(MasterKey, playerId as Entity)?.value ?? false) as boolean
}

export function getEntityIndex(id: string) {
  const { Index } = components
  return (getComponentValue(Index, id as Entity)?.value ?? 0) as number
}

export function getEntityLevel(id: string) {
  const { Level } = components
  return (getComponentValue(Level, id as Entity)?.value ?? "unknown level") as string
}

export function getEntityName(id: string) {
  const { Name } = components
  return (getComponentValue(Name, id as Entity)?.value ?? "unknown entity") as string
}

export function getRoomIndex(roomId: string) {
  const { Index } = components
  return (getComponentValue(Index, roomId as Entity)?.value ?? 0) as number
}

export async function getLatestBlockNumber() {
  const { latestBlock$ } = network
  return firstValueFrom(
    latestBlock$.pipe(
      timeout(10000), // 10 second timeout
      catchError(error => {
        // If timeout or other error occurs, return BigInt(0)
        console.warn("Failed to get latest block number:", error)
        return of({ number: BigInt(0) })
      })
    )
  ).then((block: unknown) => {
    return ((block as any).number as bigint) ?? BigInt(0)
  })
}
