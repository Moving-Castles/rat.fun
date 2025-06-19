import type { Outcome } from "@sanity-types"
export type PlotPoint = {
    time: number
    value: number
    meta:
      | Outcome
      | {
          time: number
          roomValue: number
          meta: any // Hack
        }
  }