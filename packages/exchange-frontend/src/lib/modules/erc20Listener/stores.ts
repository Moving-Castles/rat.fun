import { writable } from "svelte/store"

export const erc20BalanceListenerActive = writable(true)
export const playerERC20Balance = writable(0 as number)
export const previousPlayerERC20Balance = writable(0 as number)
export const playerERC20Allowance = writable(0 as number)

export const playerFakeTokenAllowance = writable(0 as number)
export const playerFakeTokenBalance = writable(0 as number)
