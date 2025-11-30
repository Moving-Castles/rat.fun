import { Tween } from "svelte/motion"
import { cubicOut as easing } from "svelte/easing"

// Import all send functions from actions directory
export { sendApproveFakeToken } from "./actions/sendApproveFakeToken"
export { sendExchangeFakeToken } from "./actions/sendExchangeFakeToken"

const DEFAULT_TIMINGS = {
  ApproveFakeToken: 4000,
  ExchangeFakeToken: 4000
}

export const busy = $state({
  ApproveFakeToken: new Tween(0, { duration: DEFAULT_TIMINGS.ApproveFakeToken, easing }),
  ExchangeFakeToken: new Tween(0, { duration: DEFAULT_TIMINGS.ExchangeFakeToken, easing })
})
