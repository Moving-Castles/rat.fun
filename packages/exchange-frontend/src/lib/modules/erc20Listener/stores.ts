import { writable } from "svelte/store"

export const balanceListenerActive = writable(true)

// RAT token (real token - what user receives)
export const ratTokenBalance = writable(0 as number)

// FakeRAT token (what user exchanges from)
export const fakeRatTokenBalance = writable(0 as number)
export const fakeRatTokenAllowance = writable(0 as number)

// RAT balance held by the exchange contract (available for exchange)
export const exchangeRatBalance = writable(0 as number)
