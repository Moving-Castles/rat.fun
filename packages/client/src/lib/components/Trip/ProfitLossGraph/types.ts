import type { Outcome } from "@sanity-types"
export type PlotPoint = {
  time: number
  value: number
  meta:
    | Outcome
    | {
        time: number
        tripValue: number
        tripValueChange?: number
        meta: any // Hack
      }
}
