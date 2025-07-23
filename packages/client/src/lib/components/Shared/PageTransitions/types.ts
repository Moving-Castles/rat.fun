import type { TransitionFunction } from "./transitionFunctions"

export type LayoutRouteId =
  | "/"
  | "/(rooms)/(game)"
  | "/(rooms)/(game)/[roomId]"
  | "/(rooms)/(game)/[roomId]/enter"
  | "/(rooms)/admin"
  | "/(rooms)/admin/[roomId]"
  | "/outcome/[id]"
  | null

export type TransitionConfig = {
  from: LayoutRouteId | "*"
  to: LayoutRouteId | "*"
  in?: {
    transition: TransitionFunction
    params?: Record<string, string | number | ((t: number) => number)>
  }
  out?: {
    transition: TransitionFunction
    params?: Record<string, string | number | ((t: number) => number)>
  }
}
