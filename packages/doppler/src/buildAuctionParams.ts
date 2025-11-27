import { Account, parseEther, parseUnits, PublicClient } from "viem"
import {
  DAY_SECONDS,
  DynamicAuctionBuilder,
  isToken0Expected,
  SupportedChainId
} from "@whetstone-research/doppler-sdk"
import { getNumeraire } from "./getNumeraire"
import { getDecimals } from "./erc20"
import { calculateTickRange } from "./tickMath"
import { CustomCreateDynamicAuctionParams, CustomTokenConfig } from "./CustomDopplerFactory"

function computeOptimalGamma(
  startTick: number,
  endTick: number,
  duration: number,
  epochLength: number,
  tickSpacing: number
): number {
  // Calculate total number of epochs
  const totalEpochs = duration / epochLength
  const tickDelta = Math.abs(endTick - startTick)
  // Base per-epoch movement in ticks
  let perEpochTicks = Math.ceil(tickDelta / totalEpochs)
  // Quantize up to the nearest multiple of tickSpacing
  const multiples = Math.ceil(perEpochTicks / tickSpacing)
  let gamma = multiples * tickSpacing
  // Ensure minimum of one tickSpacing
  gamma = Math.max(tickSpacing, gamma)
  if (gamma % tickSpacing !== 0) {
    throw new Error("Computed gamma must be divisible by tick spacing")
  }
  return gamma
}

export async function buildAuctionParams(
  publicClient: PublicClient,
  userAccount: Account,
  chainId: SupportedChainId
) {
  const numeraire = getNumeraire(chainId)
  const isToken0 = isToken0Expected(numeraire)
  const tickSpacing = 30

  const tokenDecimals = 18
  const numeraireDecimals = await getDecimals(publicClient, numeraire)

  //const spendLimitAmount = parseUnits("950", numeraireDecimals)
  const spendLimitAmount = parseUnits((950 / 1000000).toString(), numeraireDecimals)

  // const startPrice = 0.005
  // const endPrice = 0.014
  const startPrice = 0.005 / 1000000
  const endPrice = 0.014 / 1000000
  const { startTick, endTick } = calculateTickRange(
    isToken0,
    startPrice,
    endPrice,
    tickSpacing,
    tokenDecimals,
    numeraireDecimals
  )
  console.log("Tick range:", startTick, endTick)

  //const duration = 30 * DAY_SECONDS
  //const epochLength = 0.5 * DAY_SECONDS
  const duration = ((30 * DAY_SECONDS) / 30) * 14
  const epochLength = ((0.5 * DAY_SECONDS) / 30) * 14

  const gamma = 7 * computeOptimalGamma(startTick, endTick, duration, epochLength, tickSpacing)

  const builder = new DynamicAuctionBuilder(chainId)
    .tokenConfig({ name: "TEST", symbol: "TEST", tokenURI: "", yearlyMintRate: 0n })
    .saleConfig({
      initialSupply: parseEther("90000000"),
      numTokensToSell: parseEther("64000000"),
      numeraire: getNumeraire(chainId)
    })
    .poolConfig({ fee: 3000, tickSpacing })
    .auctionByTicks({
      startTick,
      endTick,
      minProceeds: parseUnits("0", numeraireDecimals),
      maxProceeds: parseUnits("800000", numeraireDecimals),
      duration,
      epochLength,
      numPdSlugs: 15,
      gamma
    })
    .withMigration({
      type: "uniswapV2"
    })
    .withUserAddress(userAccount.address)
    .withIntegrator(userAccount.address)
    .withTime({ startTimeOffset: 300 })

  builder.withGovernance({ type: "default" })
  // Custom factories: LaunchpadGovernanceFactory, TokenFactoryBuyLimit
  if (chainId === 84532) {
    builder.withGovernanceFactory("0x8af3001ed75f86f4dd910577eca9c5db7cea765c")
    builder.withTokenFactory("0xB222e95c77E85414696bbB2673BA619D0415b505")
  } else if (chainId === 8453) {
    builder.withGovernanceFactory("0x40bcb4dda3bcf7dba30c5d10c31ee2791ed9ddca")
    builder.withTokenFactory("0x93a4162B3c119Ef478B670c499FE83869A28d86C")
  } else {
    throw new Error("Unsupported chainId for custom factories")
  }

  // Build the config
  const result = builder.build()

  // Augment the config with a custom token parameter
  // (it's not part of the standard builder pipeline, only used by CustomDopplerFactory)
  const customResult: CustomCreateDynamicAuctionParams<typeof chainId> = {
    ...result,
    token: {
      ...result.token,
      spendLimitAmount
    } as CustomTokenConfig
  }

  return customResult
}
