import {
  Address,
  encodeAbiParameters,
  encodePacked,
  Hash,
  Hex,
  keccak256,
  PublicClient
} from "viem"
import {
  CHAIN_IDS,
  computeOptimalGamma,
  CreateDynamicAuctionParams,
  CreateParams,
  DEFAULT_PD_SLUGS,
  DEFAULT_V4_YEARLY_MINT_RATE,
  DERC20Bytecode,
  DopplerBytecode,
  DopplerFactory,
  FLAG_MASK,
  getAddresses,
  isToken0Expected,
  SupportedChainId,
  ZERO_ADDRESS
} from "@whetstone-research/doppler-sdk"
import { DERC20BuyLimitBytecode, DopplerBytecodeBaseMainnet } from "./bytecodes"

// Core configuration types
// Token configuration (discriminated union)
interface StandardTokenConfig {
  type?: "standard" // default behavior (backwards compatible)
  name: string
  symbol: string
  tokenURI: string
  yearlyMintRate?: bigint // Optional yearly mint rate (in WAD, default: 2% = 0.02e18)
}

interface Doppler404TokenConfig {
  type: "doppler404"
  name: string
  symbol: string
  baseURI: string
  // Optional unit for DN404 factory (uint256). Defaults to 1000 when omitted.
  unit?: bigint
}

export interface CustomTokenConfig extends StandardTokenConfig {
  spendLimitAmount: bigint
}

export interface CustomCreateDynamicAuctionParams<C extends SupportedChainId = SupportedChainId>
  extends CreateDynamicAuctionParams<C> {
  token: CustomTokenConfig
}

// Custom data for governance and token factories
export class CustomDopplerFactory<
  C extends SupportedChainId = SupportedChainId
> extends DopplerFactory<C> {
  async createDynamicAuction(params: CustomCreateDynamicAuctionParams<C>) {
    return super.createDynamicAuction(params)
  }

  async encodeCreateDynamicAuctionParams(params: CustomCreateDynamicAuctionParams<C>): Promise<{
    createParams: CreateParams
    hookAddress: Address
    tokenAddress: Address
  }> {
    if (!params.token.spendLimitAmount) {
      throw new Error("token spendLimitAmount not specified")
    }

    // Validate parameters
    this.validateDynamicAuctionParams(params)

    const addresses = getAddresses(this.chainId)

    // 1. Calculate gamma if not provided
    const gamma =
      params.auction.gamma ??
      computeOptimalGamma(
        params.auction.startTick,
        params.auction.endTick,
        params.auction.duration,
        params.auction.epochLength,
        params.pool.tickSpacing
      )

    // 2. Prepare time parameters
    // Use provided block timestamp or fetch the latest
    let blockTimestamp: number
    if (params.blockTimestamp !== undefined) {
      blockTimestamp = params.blockTimestamp
    } else {
      const latestBlock = await (this.publicClient as PublicClient).getBlock({ blockTag: "latest" })
      blockTimestamp = Number((latestBlock as { timestamp: bigint | number }).timestamp)
    }

    // Use startTimeOffset if provided, otherwise default to 30 seconds
    const startTimeOffset = params.startTimeOffset ?? 30
    const startTime = blockTimestamp + startTimeOffset
    const endTime = blockTimestamp + params.auction.duration + startTimeOffset

    // 3. Prepare hook initialization data
    const dopplerData = {
      minimumProceeds: params.auction.minProceeds,
      maximumProceeds: params.auction.maxProceeds,
      startingTime: BigInt(startTime),
      endingTime: BigInt(endTime),
      startingTick: params.auction.startTick,
      endingTick: params.auction.endTick,
      epochLength: BigInt(params.auction.epochLength),
      gamma,
      isToken0: false, // Will be determined during mining
      numPDSlugs: BigInt(params.auction.numPdSlugs ?? DEFAULT_PD_SLUGS),
      fee: params.pool.fee,
      tickSpacing: params.pool.tickSpacing
    }

    // 4. Prepare token parameters (standard vs Doppler404)
    if (this.isDoppler404Token(params.token)) {
      if (!addresses.doppler404Factory || addresses.doppler404Factory === ZERO_ADDRESS) {
        throw new Error("Doppler404 factory address not configured for this chain")
      }
    }

    const vestingDuration = params.vesting?.duration ?? BigInt(0)
    const tokenFactoryData = this.isDoppler404Token(params.token)
      ? (() => {
          const t = params.token as Doppler404TokenConfig
          return {
            name: t.name,
            symbol: t.symbol,
            baseURI: t.baseURI,
            unit: t.unit !== undefined ? BigInt(t.unit) : 1000n
          }
        })()
      : (() => {
          const t = params.token as StandardTokenConfig

          // Handle vesting recipients and amounts
          let vestingRecipients: Address[] = []
          let vestingAmounts: bigint[] = []

          if (params.vesting) {
            if (params.vesting.recipients && params.vesting.amounts) {
              // Use provided recipients and amounts
              vestingRecipients = params.vesting.recipients
              vestingAmounts = params.vesting.amounts
            } else {
              // Default: vest all non-sold tokens to userAddress
              vestingRecipients = [params.userAddress]
              vestingAmounts = [params.sale.initialSupply - params.sale.numTokensToSell]
            }
          }

          return {
            name: t.name,
            symbol: t.symbol,
            initialSupply: params.sale.initialSupply,
            airlock: addresses.airlock,
            yearlyMintRate: t.yearlyMintRate ?? DEFAULT_V4_YEARLY_MINT_RATE,
            vestingDuration: BigInt(vestingDuration),
            recipients: vestingRecipients,
            amounts: vestingAmounts,
            tokenURI: t.tokenURI,
            buyLimitedPoolManager: addresses.poolManager,
            buyLimitEnd: BigInt(endTime),
            spendLimitAmount: params.token.spendLimitAmount
          }
        })()

    // 5. Mine hook address with appropriate flags
    // Resolve token factory with override priority (works for both standard and doppler404 variants)
    const resolvedTokenFactoryDyn: Address | undefined =
      params.modules?.tokenFactory ??
      (this.isDoppler404Token(params.token)
        ? (addresses.doppler404Factory as Address | undefined)
        : addresses.tokenFactory)

    if (!resolvedTokenFactoryDyn || resolvedTokenFactoryDyn === ZERO_ADDRESS) {
      throw new Error(
        "Token factory address not configured. Provide an explicit address via builder.withTokenFactory(...) or ensure chain config includes a valid factory."
      )
    }

    const [salt, hookAddress, tokenAddress, poolInitializerData, encodedTokenFactoryData] =
      this.mineHookAddress({
        airlock: params.modules?.airlock ?? addresses.airlock,
        poolManager: params.modules?.poolManager ?? addresses.poolManager,
        deployer: params.modules?.dopplerDeployer ?? addresses.dopplerDeployer,
        initialSupply: params.sale.initialSupply,
        numTokensToSell: params.sale.numTokensToSell,
        numeraire: params.sale.numeraire,
        tokenFactory: resolvedTokenFactoryDyn,
        tokenFactoryData: tokenFactoryData,
        poolInitializer: params.modules?.v4Initializer ?? addresses.v4Initializer,
        poolInitializerData: dopplerData,
        tokenVariant: this.isDoppler404Token(params.token) ? "doppler404" : "standard",
        customDerc20Bytecode: DERC20BuyLimitBytecode
      })

    // 6. Encode migration data
    const liquidityMigratorData = this.encodeMigrationData(params.migration)

    // 7. Encode governance factory data
    const governanceFactoryData = encodeAbiParameters([{ type: "address" }], [params.userAddress])

    // 7.1 Choose governance factory
    const useNoOpGovernance = params.governance.type === "noOp"

    const governanceFactoryAddress: Address = (() => {
      if (useNoOpGovernance) {
        // Prefer unified override; otherwise require chain's no-op governance factory
        const resolved =
          params.modules?.governanceFactory ?? addresses.noOpGovernanceFactory ?? ZERO_ADDRESS
        if (!resolved || resolved === ZERO_ADDRESS) {
          throw new Error(
            "No-op governance requested, but no-op governanceFactory is not configured on this chain. Provide a governanceFactory override or use a supported chain."
          )
        }
        return resolved
      }
      const resolved = params.modules?.governanceFactory ?? addresses.governanceFactory
      if (!resolved || resolved === ZERO_ADDRESS) {
        throw new Error(
          "Standard governance requested but governanceFactory is not deployed on this chain."
        )
      }
      return resolved
    })()

    // 8. Build the complete CreateParams for the V4-style ABI
    const createParams = {
      initialSupply: params.sale.initialSupply,
      numTokensToSell: params.sale.numTokensToSell,
      numeraire: params.sale.numeraire,
      tokenFactory: resolvedTokenFactoryDyn,
      tokenFactoryData: encodedTokenFactoryData,
      governanceFactory: governanceFactoryAddress,
      governanceFactoryData: governanceFactoryData,
      poolInitializer: params.modules?.v4Initializer ?? addresses.v4Initializer,
      poolInitializerData: poolInitializerData,
      liquidityMigrator: this.getMigratorAddress(params.migration, params.modules),
      liquidityMigratorData: liquidityMigratorData,
      integrator: params.integrator ?? ZERO_ADDRESS,
      salt: salt
    }

    return { createParams, hookAddress, tokenAddress }
  }

  /**
   * Mines a salt and hook address with the appropriate flags
   *
   * This method iterates through possible salt values to find a combination that:
   * - Produces a hook address with required Doppler flags
   * - Maintains proper token ordering relative to numeraire
   * - Ensures deterministic deployment addresses
   *
   * @param params - Parameters for hook address mining
   * @returns Tuple of [salt, hook address, token address, pool data, token data]
   * @throws {Error} If no valid salt can be found within the search limit
   * @protected
   */
  protected mineHookAddress(params: {
    airlock: Address
    poolManager: Address
    deployer: Address
    initialSupply: bigint
    numTokensToSell: bigint
    numeraire: Address
    tokenFactory: Address
    tokenFactoryData:
      | {
          name: string
          symbol: string
          baseURI: string
          unit?: bigint
        }
      | {
          name: string
          symbol: string
          initialSupply: bigint
          airlock: Address
          yearlyMintRate: bigint
          vestingDuration: bigint
          recipients: Address[]
          amounts: bigint[]
          tokenURI: string
          buyLimitedPoolManager: Address
          buyLimitEnd: bigint
          spendLimitAmount: bigint
        }
    poolInitializer: Address
    poolInitializerData: {
      minimumProceeds: bigint
      maximumProceeds: bigint
      startingTime: bigint
      endingTime: bigint
      startingTick: number
      endingTick: number
      epochLength: bigint
      gamma: number
      numPDSlugs: bigint
      fee: number
      tickSpacing: number
    }
    customDerc20Bytecode?: `0x${string}`
    tokenVariant?: "standard" | "doppler404"
  }): [Hash, Address, Address, Hex, Hex] {
    const isToken0 = isToken0Expected(params.numeraire)

    const {
      minimumProceeds,
      maximumProceeds,
      startingTime,
      endingTime,
      startingTick,
      endingTick,
      epochLength,
      gamma,
      numPDSlugs,
      fee,
      tickSpacing
    } = params.poolInitializerData

    const poolInitializerData = encodeAbiParameters(
      [
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "int24" },
        { type: "int24" },
        { type: "uint256" },
        { type: "int24" },
        { type: "bool" },
        { type: "uint256" },
        { type: "uint24" },
        { type: "int24" }
      ],
      [
        minimumProceeds,
        maximumProceeds,
        startingTime,
        endingTime,
        startingTick,
        endingTick,
        epochLength,
        gamma,
        isToken0,
        numPDSlugs,
        fee,
        tickSpacing
      ]
    )

    const isBase = this.chainId === CHAIN_IDS.BASE

    const { poolManager, numTokensToSell, poolInitializer } = params

    const hookInitHashData = encodeAbiParameters(
      [
        { type: "address" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "uint256" },
        { type: "int24" },
        { type: "int24" },
        { type: "uint256" },
        { type: "int24" },
        { type: "bool" },
        { type: "uint256" },
        { type: "address" },
        { type: "uint24" }
      ],
      [
        poolManager,
        numTokensToSell,
        minimumProceeds,
        maximumProceeds,
        startingTime,
        endingTime,
        startingTick,
        endingTick,
        epochLength,
        gamma,
        isToken0,
        numPDSlugs,
        poolInitializer,
        fee
      ]
    )

    const hookInitHash = keccak256(
      encodePacked(["bytes", "bytes"], [isBase ? DopplerBytecodeBaseMainnet as Hex : DopplerBytecode as Hex, hookInitHashData])
    )

    const tokenFactoryData = (() => {
      const {
        name,
        symbol,
        yearlyMintRate,
        vestingDuration,
        recipients,
        amounts,
        tokenURI,
        buyLimitedPoolManager,
        buyLimitEnd,
        spendLimitAmount
      } = params.tokenFactoryData as {
        name: string
        symbol: string
        initialSupply: bigint
        airlock: Address
        yearlyMintRate: bigint
        vestingDuration: bigint
        recipients: Address[]
        amounts: bigint[]
        tokenURI: string
        buyLimitedPoolManager: Address
        buyLimitEnd: bigint
        spendLimitAmount: bigint
      }
      return encodeAbiParameters(
        [
          { type: "string" },
          { type: "string" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "address[]" },
          { type: "uint256[]" },
          { type: "string" },
          { type: "address" },
          { type: "uint256" },
          { type: "uint256" }
        ],
        [
          name,
          symbol,
          yearlyMintRate,
          vestingDuration,
          recipients,
          amounts,
          tokenURI,
          buyLimitedPoolManager,
          buyLimitEnd,
          spendLimitAmount
        ]
      )
    })()

    // Compute token init hash; use DN404 bytecode if tokenVariant is doppler404
    let tokenInitHash: Hash | undefined
    {
      const {
        name,
        symbol,
        yearlyMintRate,
        vestingDuration,
        recipients,
        amounts,
        tokenURI,
        buyLimitedPoolManager,
        buyLimitEnd,
        spendLimitAmount
      } = params.tokenFactoryData as {
        name: string
        symbol: string
        initialSupply: bigint
        airlock: Address
        yearlyMintRate: bigint
        vestingDuration: bigint
        recipients: Address[]
        amounts: bigint[]
        tokenURI: string
        buyLimitedPoolManager: Address
        buyLimitEnd: bigint
        spendLimitAmount: bigint
      }
      const { airlock, initialSupply } = params
      const initHashData = encodeAbiParameters(
        [
          { type: "string" },
          { type: "string" },
          { type: "uint256" },
          { type: "address" },
          { type: "address" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "address[]" },
          { type: "uint256[]" },
          { type: "string" },
          { type: "address" },
          { type: "uint256" },
          { type: "uint256" },
          { type: "address" }
        ],
        [
          name,
          symbol,
          initialSupply,
          airlock,
          airlock,
          yearlyMintRate,
          vestingDuration,
          recipients,
          amounts,
          tokenURI,
          buyLimitedPoolManager,
          buyLimitEnd,
          spendLimitAmount,
          airlock
        ]
      )
      tokenInitHash = keccak256(
        encodePacked(
          ["bytes", "bytes"],
          [(params.customDerc20Bytecode as Hex) ?? (DERC20Bytecode as Hex), initHashData]
        )
      )
    }

    // Use the exact flags from V4 SDK
    const flags = BigInt(
      (1 << 13) | // BEFORE_INITIALIZE_FLAG
        (1 << 12) | // AFTER_INITIALIZE_FLAG
        (1 << 11) | // BEFORE_ADD_LIQUIDITY_FLAG
        (1 << 7) | // BEFORE_SWAP_FLAG
        (1 << 6) | // AFTER_SWAP_FLAG
        (1 << 5) // BEFORE_DONATE_FLAG
    )

    for (let salt = BigInt(0); salt < BigInt(1_000_000); salt++) {
      const saltBytes = `0x${salt.toString(16).padStart(64, "0")}` as Hash
      const hook = this.computeCreate2Address(saltBytes, hookInitHash, params.deployer)
      const hookBigInt = BigInt(hook)
      if (tokenInitHash) {
        const token = this.computeCreate2Address(saltBytes, tokenInitHash, params.tokenFactory)
        const tokenBigInt = BigInt(token)
        const numeraireBigInt = BigInt(params.numeraire)
        if (
          (hookBigInt & FLAG_MASK) === flags &&
          ((isToken0 && tokenBigInt < numeraireBigInt) ||
            (!isToken0 && tokenBigInt > numeraireBigInt))
        ) {
          return [saltBytes, hook, token, poolInitializerData, tokenFactoryData]
        }
      }
    }

    throw new Error("AirlockMiner: could not find salt")
  }
}
