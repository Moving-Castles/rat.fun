import { Account, Chain, formatUnits, Hex, parseUnits, PublicClient, Transport, WalletClient } from "viem"
import {
  AuctionParams,
  balanceOf,
  isPermit2AllowedMaxRequired,
  isPermitRequired,
  permit2AllowMax,
  Permit2PermitData,
  signPermit2ForUniversalRouter,
  swapExactSingle
} from "../../src"

export async function swapWithLogs(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  auctionParams: AuctionParams,
  amount: number,
  isOut: boolean
) {
  const parsedAmount = parseUnits(amount.toString(), isOut ? auctionParams.token.decimals : auctionParams.numeraire.decimals)

  console.log("before swap")
  const tokenBalanceBefore = formatUnits(
    await balanceOf(publicClient, auctionParams.token.address, walletClient.account.address),
    auctionParams.token.decimals
  )
  const numeraireBalanceBefore = formatUnits(
    await balanceOf(publicClient, auctionParams.numeraire.address, walletClient.account.address),
    auctionParams.numeraire.decimals
  )
  console.log("token:", tokenBalanceBefore)
  console.log("numeraire:", numeraireBalanceBefore)

  let permit: Permit2PermitData | undefined = undefined
  let permitSignature: Hex | undefined = undefined
  if (isPermitRequired(auctionParams)) {
    const isAllowedMaxRequired = await isPermit2AllowedMaxRequired(
      publicClient,
      walletClient.account.address,
      auctionParams.numeraire.address
    )
    if (isAllowedMaxRequired) {
      await permit2AllowMax(publicClient, walletClient, auctionParams.numeraire.address)
    }
    const result = await signPermit2ForUniversalRouter(
      publicClient,
      walletClient,
      auctionParams,
      parsedAmount,
      { isOut }
    )
    permit = result.permit
    permitSignature = result.permitSignature
  }

  await swapExactSingle(publicClient, walletClient, auctionParams, parsedAmount, {
    isOut,
    permit,
    permitSignature
  })
  await new Promise(resolve => setTimeout(resolve, 1000))

  console.log("after swap")
  const tokenBalanceAfter = formatUnits(
    await balanceOf(publicClient, auctionParams.token.address, walletClient.account.address),
    auctionParams.token.decimals
  )
  const numeraireBalanceAfter = formatUnits(
    await balanceOf(publicClient, auctionParams.numeraire.address, walletClient.account.address),
    auctionParams.numeraire.decimals
  )
  console.log("token:", tokenBalanceAfter)
  console.log("numeraire:", numeraireBalanceAfter)

  const tokenDiff = parseFloat(tokenBalanceAfter) - parseFloat(tokenBalanceBefore)
  const numeraireDiff = parseFloat(numeraireBalanceBefore) - parseFloat(numeraireBalanceAfter)
  console.log("token diff:", tokenDiff)
  console.log("numeraire diff:", numeraireDiff)
  const effectivePrice = numeraireDiff / tokenDiff
  console.log("effective price:", effectivePrice)

  return {
    tokenBalanceBefore,
    tokenBalanceAfter,
    numeraireBalanceBefore,
    numeraireBalanceAfter,
    tokenDiff,
    numeraireDiff,
    effectivePrice
  }
}
