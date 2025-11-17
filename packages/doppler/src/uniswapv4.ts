import { Chain, Hex, PublicClient, Transport } from "viem"
import { base, baseSepolia } from "viem/chains"
import { v4stateViewAbi } from "./abis"

const v4addresses = {
  [base.id]: {
    stateView: "0xa3c0c9b65bad0b08107aa264b0f3db444b867a71"
  },
  [baseSepolia.id]: {
    stateView: "0x571291b572ed32ce6751a2cb2486ebee8defb9b4"
  }
} as const

function univ4getAddresses(chainId: number) {
  if (!(chainId in v4addresses)) {
    throw new Error("Invalid chain id")
  }
  return v4addresses[chainId as keyof typeof v4addresses]
}

export async function univ4getSlot0(publicClient: PublicClient<Transport, Chain>, poolId: Hex) {
  const [sqrtPriceX96, tick, protocolFee, lpFee] = await publicClient.readContract({
    address: univ4getAddresses(publicClient.chain.id).stateView,
    abi: v4stateViewAbi,
    functionName: "getSlot0",
    args: [poolId]
  })
  return {
    sqrtPriceX96,
    tick,
    protocolFee,
    lpFee
  }
}
