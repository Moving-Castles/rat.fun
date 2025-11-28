import {
  Account,
  Chain,
  formatUnits,
  Hex,
  maxUint128,
  parseUnits,
  PublicClient,
  Transport,
  WalletClient,
  zeroAddress
} from "viem"
import { getAddresses } from "@whetstone-research/doppler-sdk"
import {
  AuctionParams,
  balanceOf,
  CustomQuoter,
  getPoolKey,
  isPermit2AllowanceRequired,
  permit2AllowMax,
  Permit2PermitData,
  signPermit2,
  swapExactSingle
} from "../../src"

export async function swapWithLogs(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  auctionParams: AuctionParams,
  amount: number,
  isOut: boolean
) {
  const parsedAmount = parseUnits(
    amount.toString(),
    isOut ? auctionParams.token.decimals : auctionParams.numeraire.decimals
  )

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
    const isAllowedMaxRequired = await isPermit2AllowanceRequired(
      publicClient,
      walletClient.account.address,
      auctionParams.numeraire.address,
      maxUint128
    )
    if (isAllowedMaxRequired) {
      await permit2AllowMax(publicClient, walletClient, auctionParams.numeraire.address)
    }
    let amountIn: bigint
    if (isOut) {
      const quoter = new CustomQuoter(publicClient, publicClient.chain.id, auctionParams)
      const input = await quoter.quoteExactOutputV4(parsedAmount, true)
  
      amountIn = input.amountIn
    } else {
      amountIn = parsedAmount
    }
    const addresses = getAddresses(publicClient.chain.id)
    const result = await signPermit2(
      publicClient,
      walletClient,
      auctionParams.numeraire.address,
      addresses.universalRouter,
      amountIn
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

function isPermitRequired(auctionParams: AuctionParams) {
  const poolKey = getPoolKey(auctionParams)
  const zeroForOne = !auctionParams.isToken0
  const swapFromNative = zeroForOne && poolKey.currency0 === zeroAddress
  return !swapFromNative
}
