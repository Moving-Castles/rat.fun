import { Account, Chain, erc20Abi, Hex, PublicClient, Transport, WalletClient } from "viem"
import { derc20BuyLimitAbi } from "./abis"

export async function getDecimals(publicClient: PublicClient, address: Hex) {
  return await publicClient.readContract({
    address,
    abi: erc20Abi,
    functionName: "decimals",
    args: []
  })
}

export async function getName(publicClient: PublicClient, address: Hex) {
  return await publicClient.readContract({
    address,
    abi: erc20Abi,
    functionName: "name",
    args: []
  })
}

export async function getSymbol(publicClient: PublicClient, address: Hex) {
  return await publicClient.readContract({
    address,
    abi: erc20Abi,
    functionName: "symbol",
    args: []
  })
}

export async function balanceOf(publicClient: PublicClient, address: Hex, holderAddress: Hex) {
  return await publicClient.readContract({
    address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [holderAddress]
  })
}

export async function buyLimitSpendLimitAmount(publicClient: PublicClient, address: Hex) {
  return await publicClient.readContract({
    address,
    abi: derc20BuyLimitAbi,
    functionName: "spendLimitAmount",
    args: []
  })
}

export async function buyLimitSpentAmount(publicClient: PublicClient, address: Hex, holderAddress: Hex) {
  return await publicClient.readContract({
    address,
    abi: derc20BuyLimitAbi,
    functionName: "getSpentAmounts",
    args: [holderAddress]
  })
}

export async function buyLimitGetCountryCode(publicClient: PublicClient, address: Hex, holderAddress: Hex) {
  return await publicClient.readContract({
    address,
    abi: derc20BuyLimitAbi,
    functionName: "getCountryCode",
    args: [holderAddress]
  })
}

export async function buyLimitSetCountryCode(walletClient: WalletClient<Transport, Chain, Account>, address: Hex, countryCode: string) {
  return await walletClient.writeContract({
    address,
    abi: derc20BuyLimitAbi,
    functionName: "setCountryCode",
    args: [countryCode]
  })
}
