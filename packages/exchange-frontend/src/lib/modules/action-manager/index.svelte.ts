import { Tween } from "svelte/motion"
import { cubicOut as easing } from "svelte/easing"

// Import all send functions from actions directory
export { sendApproveMax } from "./actions/sendApproveMax"
export { sendRevokeApproval } from "./actions/sendRevokeApproval"
export { sendApproveFakeToken } from "./actions/sendApproveFakeToken"
export { sendExchangeFakeToken } from "./actions/sendExchangeFakeToken"

const DEFAULT_TIMINGS = {
  ApproveMax: 4000,
  RevokeApproval: 4000,
  ApproveFakeToken: 4000,
  ExchangeFakeToken: 4000
}

export const busy = $state({
  ApproveMax: new Tween(0, { duration: DEFAULT_TIMINGS.ApproveMax, easing }),
  RevokeApproval: new Tween(0, { duration: DEFAULT_TIMINGS.RevokeApproval, easing }),
  ApproveFakeToken: new Tween(0, { duration: DEFAULT_TIMINGS.ApproveFakeToken, easing }),
  ExchangeFakeToken: new Tween(0, { duration: DEFAULT_TIMINGS.ExchangeFakeToken, easing })
})
