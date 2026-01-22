import { errorHandler } from "$lib/modules/error-handling"
import { InvalidStateTransitionError } from "@ratfun/common/error-handling"
import { wethCurrency, type CurrencyData } from "$lib/modules/swap-router"
import type { AuctionParams, CustomQuoter, Permit2PermitData, SwapReceipt } from "doppler"
import type { Hex } from "viem"

/**
 * ========================================
 *  Swap/state.svelte.ts
 * ========================================
 * This module keeps track of the state of the swap flow.
 * It also holds all shared data needed across swap components.
 */

export enum SWAP_STATE {
  INIT = "INIT",
  AGREEMENT = "AGREEMENT",
  SIGN_AND_SWAP = "SIGN_AND_SWAP", // User signs permit then executes swap in one step
  SWAP_COMPLETE = "SWAP_COMPLETE",
  WALLET_LIMIT_REACHED = "WALLET_LIMIT_REACHED",
  ERROR = "ERROR"
}

// Local state
let swapStateValue = $state<SWAP_STATE>(SWAP_STATE.INIT)

// Shared data state
let auctionParams = $state<AuctionParams | null>(null)
let quoter = $state<CustomQuoter | null>(null)
let amountIn = $state<bigint | undefined>(undefined)
let amountOut = $state<bigint | undefined>(undefined)
let isExactOut = $state(false)
let permit = $state<Permit2PermitData | undefined>(undefined)
let permitSignature = $state<Hex | undefined>(undefined)
let spentAmount = $state<bigint | undefined>(undefined)
let savedCountryCode = $state<string | undefined>(undefined)
let fromCurrency = $state<CurrencyData>(wethCurrency)
let numeraireBalance = $state<number | undefined>(undefined)
let tokenBalance = $state<number | undefined>(undefined)
let swapReceipt = $state<SwapReceipt | null>(null)
let swapTxHash = $state<Hex | undefined>(undefined)
let eurcToUsdcRate = $state<number | undefined>(undefined)
let eurcToEthRate = $state<number | undefined>(undefined)
let currentPriceUsdc = $state<number | undefined>(undefined)

/**
 * Defines valid state transitions between swap states
 * Maps each state to an array of valid states it can transition to
 */
const VALID_TRANSITIONS: Record<SWAP_STATE, SWAP_STATE[]> = {
  [SWAP_STATE.INIT]: [
    SWAP_STATE.AGREEMENT,
    SWAP_STATE.SIGN_AND_SWAP,
    SWAP_STATE.WALLET_LIMIT_REACHED,
    SWAP_STATE.ERROR
  ],
  [SWAP_STATE.AGREEMENT]: [SWAP_STATE.SIGN_AND_SWAP, SWAP_STATE.ERROR],
  [SWAP_STATE.SIGN_AND_SWAP]: [SWAP_STATE.SWAP_COMPLETE, SWAP_STATE.ERROR],
  [SWAP_STATE.SWAP_COMPLETE]: [SWAP_STATE.SIGN_AND_SWAP, SWAP_STATE.ERROR],
  [SWAP_STATE.WALLET_LIMIT_REACHED]: [],
  [SWAP_STATE.ERROR]: []
}

const setState = (state: SWAP_STATE) => {
  swapStateValue = state
}

const resetState = () => {
  swapStateValue = SWAP_STATE.INIT
}

const resetData = () => {
  auctionParams = null
  quoter = null
  amountIn = undefined
  amountOut = undefined
  isExactOut = false
  permit = undefined
  permitSignature = undefined
  spentAmount = undefined
  savedCountryCode = undefined
  fromCurrency = wethCurrency
  numeraireBalance = undefined
  tokenBalance = undefined
  swapReceipt = null
  swapTxHash = undefined
  eurcToUsdcRate = undefined
  eurcToEthRate = undefined
  currentPriceUsdc = undefined
}

const transitionTo = (newState: SWAP_STATE) => {
  if (newState === swapStateValue) return
  const validTransitions = VALID_TRANSITIONS[swapStateValue]
  if (!validTransitions.includes(newState)) {
    const err = new InvalidStateTransitionError(
      undefined,
      undefined,
      `Invalid state transition from ${swapStateValue} to ${newState}`
    )
    errorHandler(err)
    return
  }
  setState(newState)
}

// Export singleton instance
export const swapState = {
  state: {
    reset: resetState,
    set: setState,
    transitionTo,
    get current() {
      return swapStateValue
    }
  },
  data: {
    // Getters
    get auctionParams() {
      return auctionParams
    },
    get quoter() {
      return quoter
    },
    get amountIn() {
      return amountIn
    },
    get amountOut() {
      return amountOut
    },
    get isExactOut() {
      return isExactOut
    },
    get fromCurrency() {
      return fromCurrency
    },
    get permit() {
      return permit
    },
    get permitSignature() {
      return permitSignature
    },
    get spentAmount() {
      return spentAmount
    },
    get savedCountryCode() {
      return savedCountryCode
    },
    get numeraireBalance() {
      return numeraireBalance
    },
    get tokenBalance() {
      return tokenBalance
    },
    get swapReceipt() {
      return swapReceipt
    },
    get swapTxHash() {
      return swapTxHash
    },
    get eurcToUsdcRate() {
      return eurcToUsdcRate
    },
    get eurcToEthRate() {
      return eurcToEthRate
    },
    get currentPriceUsdc() {
      return currentPriceUsdc
    },

    // Setters
    setAuctionParams: (params: AuctionParams) => {
      auctionParams = params
    },
    setQuoter: (q: CustomQuoter) => {
      quoter = q
    },
    setAmountIn: (amount: bigint | undefined) => {
      amountIn = amount
    },
    setAmountOut: (amount: bigint | undefined) => {
      amountOut = amount
    },
    setIsExactOut: (value: boolean) => {
      isExactOut = value
    },
    setPermit: (p: Permit2PermitData | undefined) => {
      permit = p
    },
    setPermitSignature: (sig: Hex | undefined) => {
      permitSignature = sig
    },
    setSpentAmount: (amount: bigint | undefined) => {
      spentAmount = amount
    },
    setSavedCountryCode: (code: string | undefined) => {
      savedCountryCode = code
    },
    setFromCurrency: (currency: CurrencyData) => {
      fromCurrency = currency
    },
    setNumeraireBalance: (balance: number | undefined) => {
      numeraireBalance = balance
    },
    setTokenBalance: (balance: number | undefined) => {
      tokenBalance = balance
    },
    setSwapReceipt: (receipt: SwapReceipt | null) => {
      swapReceipt = receipt
    },
    setSwapTxHash: (hash: Hex | undefined) => {
      swapTxHash = hash
    },
    setEurcToUsdcRate: (rate: number | undefined) => {
      eurcToUsdcRate = rate
    },
    setEurcToEthRate: (rate: number | undefined) => {
      eurcToEthRate = rate
    },
    setCurrentPriceUsdc: (price: number | undefined) => {
      currentPriceUsdc = price
    },

    // Helper methods
    clearPermit: () => {
      permit = undefined
      permitSignature = undefined
    },
    reset: resetData
  }
}
