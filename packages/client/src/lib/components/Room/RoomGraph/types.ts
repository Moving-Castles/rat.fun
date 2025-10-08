import type { Outcome } from "@sanity-types"
export type PlotPoint = {
  time: number
  value: number
  valueChange?: number
  index: number
  tripId: string
  roomCreationCost: number
  eventType?: string
  meta:
    | Outcome
    | {
        time?: number
        roomValue?: number
        roomValueChange?: number
        eventType?: string
        [key: string]: any
      }
}
