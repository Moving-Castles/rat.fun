import { Tween } from "svelte/motion"
import { cubicOut as easing } from "svelte/easing"

// Import all send functions from actions directory
export { sendSpawn } from "./actions/sendSpawn"
export { sendApprove } from "./actions/sendApprove"
export { sendGiveCallerTokens } from "./actions/sendGiveCallerTokens"
export { sendCreateRat } from "./actions/sendCreateRat"
export { sendEnterTrip } from "./actions/sendEnterTrip"
export { sendCreateTrip } from "./actions/sendCreateTrip"
export { sendLiquidateRat } from "./actions/sendLiquidateRat"
export { sendLiquidateTrip } from "./actions/sendLiquidateTrip"
export { sendAddTripBalance } from "./actions/sendAddTripBalance"
export { sendBuyWithEth } from "./actions/sendBuyWithEth"
export { sendUnlockAdmin } from "./actions/sendUnlockAdmin"

const DEFAULT_TIMINGS = {
  Spawn: 4000,
  Approve: 4000,
  GiveCallerTokens: 4000,
  CreateTrip: 4000,
  EnterTrip: 4000,
  CloseTrip: 4000,
  AddTripBalance: 4000,
  CreateRat: 4000,
  LiquidateRat: 4000,
  LiquidateTrip: 4000,
  BuyWithEth: 60000,
  UnlockAdmin: 4000
}

export const busy = $state({
  Spawn: new Tween(0, { duration: DEFAULT_TIMINGS.Spawn, easing }),
  Approve: new Tween(0, { duration: DEFAULT_TIMINGS.Approve, easing }),
  GiveCallerTokens: new Tween(0, { duration: DEFAULT_TIMINGS.GiveCallerTokens, easing }),
  CreateTrip: new Tween(0, { duration: DEFAULT_TIMINGS.CreateTrip, easing }),
  EnterTrip: new Tween(0, { duration: DEFAULT_TIMINGS.EnterTrip, easing }),
  CloseTrip: new Tween(0, { duration: DEFAULT_TIMINGS.CloseTrip, easing }),
  AddTripBalance: new Tween(0, { duration: DEFAULT_TIMINGS.AddTripBalance, easing }),
  CreateRat: new Tween(0, { duration: DEFAULT_TIMINGS.CreateRat, easing }),
  LiquidateRat: new Tween(0, { duration: DEFAULT_TIMINGS.LiquidateRat, easing }),
  LiquidateTrip: new Tween(0, { duration: DEFAULT_TIMINGS.LiquidateTrip, easing }),
  BuyWithEth: new Tween(0, { duration: DEFAULT_TIMINGS.BuyWithEth, easing }),
  UnlockAdmin: new Tween(0, { duration: DEFAULT_TIMINGS.UnlockAdmin, easing })
})
