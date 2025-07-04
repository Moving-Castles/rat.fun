import { Tween } from "svelte/motion"
import { cubicOut as easing } from "svelte/easing"

// Import all send functions from actions directory
export { sendSpawn } from "./actions/sendSpawn"
export { sendApproveMax } from "./actions/sendApproveMax"
export { sendGiveCallerTokens } from "./actions/sendGiveCallerTokens"
export { sendCreateRat } from "./actions/sendCreateRat"
export { sendEnterRoom } from "./actions/sendEnterRoom"
export { sendCreateRoom } from "./actions/sendCreateRoom"
export { sendLiquidateRat } from "./actions/sendLiquidateRat"
export { sendLiquidateRoom } from "./actions/sendLiquidateRoom"
export { sendDropItem } from "./actions/sendDropItem"

const DEFAULT_TIMINGS = {
  Spawn: 4000,
  ApproveMax: 4000,
  GiveCallerTokens: 4000,
  CreateRoom: 4000,
  EnterRoom: 4000,
  CloseRoom: 4000,
  CreateRat: 4000,
  LiquidateRat: 4000,
  LiquidateRoom: 4000,
  DropItem: 4000
}

export const busy = $state({
  Spawn: new Tween(0, { duration: DEFAULT_TIMINGS.Spawn, easing }),
  ApproveMax: new Tween(0, { duration: DEFAULT_TIMINGS.ApproveMax, easing }),
  GiveCallerTokens: new Tween(0, { duration: DEFAULT_TIMINGS.GiveCallerTokens, easing }),
  CreateRoom: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRoom, easing }),
  EnterRoom: new Tween(0, { duration: DEFAULT_TIMINGS.EnterRoom, easing }),
  CloseRoom: new Tween(0, { duration: DEFAULT_TIMINGS.CloseRoom, easing }),
  CreateRat: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRat, easing }),
  LiquidateRat: new Tween(0, { duration: DEFAULT_TIMINGS.LiquidateRat, easing }),
  LiquidateRoom: new Tween(0, { duration: DEFAULT_TIMINGS.LiquidateRoom, easing }),
  DropItem: new Tween(0, { duration: DEFAULT_TIMINGS.DropItem, easing })
})
