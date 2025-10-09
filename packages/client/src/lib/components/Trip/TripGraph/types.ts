import type { Outcome } from "@sanity-types"

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
    | {
        time?: number
        tripValue?: number
        tripValueChange?: number
        eventType?: string
        [key: string]: any
      }
}
