import { Address, Hex } from "viem"

export interface AuctionParams {
  poolId: Hex
  transactionHash: Hex
  hookAddress: Address
  token: {
    address: Address
    decimals: number
    name: string
    symbol: string
  }
  numeraire: {
    address: Address
    decimals: number
    name: string
    symbol: string
  }
  startingTime: number
  endingTime: number
  isToken0: boolean
  startingTick: number
  endingTick: number
  pool: {
    fee: number
    tickSpacing: number
  }
  userAddress: Address
  spendLimitAmount: string
}
