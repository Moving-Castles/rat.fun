import { dopplerLensAbi, getAddresses, Quoter } from "@whetstone-research/doppler-sdk"
import { formatUnits, PublicClient } from "viem"
import { AuctionParams } from "./types"
import { getPoolKey } from "./getPoolKey"

export class CustomQuoter {
  public quoter: Quoter
  public auctionParams: AuctionParams

  public get publicClient(): PublicClient {
    return this.quoter["publicClient"]
  }

  public get chainId(): number {
    return this.quoter["chainId"]
  }

  public get poolKey() {
    return getPoolKey(this.auctionParams)
  }

  public get isToken0() {
    return this.auctionParams.isToken0
  }

  public get currency0() {
    return this.isToken0 ? this.auctionParams.token : this.auctionParams.numeraire
  }

  public get currency1() {
    return this.isToken0 ? this.auctionParams.numeraire : this.auctionParams.token
  }

  public zeroForOne(numeraireForToken: boolean) {
    return this.isToken0 ? !numeraireForToken : numeraireForToken
  }

  public inputDecimals(zeroForOne: boolean) {
    return zeroForOne ? this.currency0.decimals : this.currency1.decimals
  }

  public outputDecimals(zeroForOne: boolean) {
    return zeroForOne ? this.currency1.decimals : this.currency0.decimals
  }

  constructor(publicClient: PublicClient, chainId: number, auctionParams: AuctionParams) {
    this.quoter = new Quoter(publicClient, chainId)
    this.auctionParams = auctionParams
  }

  async quoteExactInputV4(exactAmount: bigint, numeraireForToken: boolean) {
    const zeroForOne = this.zeroForOne(numeraireForToken)

    const result = await this.quoter.quoteExactInputV4Quoter({
      poolKey: this.poolKey,
      zeroForOne,
      exactAmount,
      hookData: "0x"
    })

    return {
      ...result,
      formattedAmount: formatUnits(result.amountOut, this.outputDecimals(zeroForOne))
    }
  }

  async quoteExactOutputV4(exactAmount: bigint, numeraireForToken: boolean) {
    const zeroForOne = this.zeroForOne(numeraireForToken)

    const result = await this.quoter.quoteExactOutputV4Quoter({
      poolKey: this.poolKey,
      zeroForOne,
      exactAmount,
      hookData: "0x"
    })

    return {
      ...result,
      formattedAmount: formatUnits(result.amountIn, this.inputDecimals(zeroForOne))
    }
  }

  async quoteExactInputV4Lens(exactAmount: bigint, numeraireForToken: boolean) {
    const zeroForOne = this.zeroForOne(numeraireForToken)

    const { result } = await this.publicClient.simulateContract({
      address: getAddresses(this.chainId).dopplerLens,
      abi: dopplerLensAbi,
      functionName: "quoteDopplerLensData",
      args: [
        {
          poolKey: this.poolKey,
          zeroForOne,
          exactAmount,
          hookData: "0x"
        }
      ]
    })

    return {
      ...result,
      isToken0: this.isToken0,
      formattedAmount0: formatUnits(result.amount0, this.currency0.decimals),
      formattedAmount1: formatUnits(result.amount1, this.currency1.decimals)
    }
  }
}
