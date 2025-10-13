import type { Outcome } from "@sanity-types"

export type PendingTrip = { prompt: string; cost: number } | null

export type PlotPoint = {
  time: number
  value: number
  valueChange?: number
  index: number
  tripId: string
  tripCreationCost: number
  eventType?: string
  meta:
    | Outcome
    | Trip
    | {
        time?: number
        tripValue?: number
        tripValueChange?: number
        eventType?: string
        [key: string]: any
      }
}
