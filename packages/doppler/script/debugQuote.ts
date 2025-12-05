import { createPublicClient, http, encodePacked, parseUnits, decodeErrorResult, Hex } from "viem"
import { base } from "viem/chains"

// RatRouter on Base mainnet
const ratRouterAddress = "0x0dAC1415e9DB2917E4Db14b27961378b7DDfD19B" as const

// Test auction params (from the error)
const poolKey = {
  currency0: "0x60a3E35Cc302bFA44Cb288Bc5a4F316Fdb1adb42" as Hex,
  currency1: "0x7898b13819Fb5240333A96bD012900E21dbC3b5D" as Hex,
  fee: 8388608,
  tickSpacing: 30,
  hooks: "0x3e5962721Fd0a81cA4b05ff96859bE427c3538e0" as Hex
}

// WETH -> EURC path (tickSpacing 100)
const wethAddress = "0x4200000000000000000000000000000000000006" as Hex
const eurcAddress = "0x60a3e35cc302bfa44cb288bc5a4f316fdb1adb42" as Hex

const aerodromePath = encodePacked(["address", "int24", "address"], [wethAddress, 100, eurcAddress])

const amountIn = parseUnits("0.001", 18) // 0.001 ETH

// Known error signatures
const errorAbis = [
  { type: "error", name: "UnexpectedRevertBytes", inputs: [{ name: "revertData", type: "bytes" }] },
  { type: "error", name: "BuyLimitExceeded", inputs: [] },
  { type: "error", name: "MintingNotStartedYet", inputs: [] },
  { type: "error", name: "NoCountryCode", inputs: [] },
  { type: "error", name: "PoolLocked", inputs: [] },
  { type: "error", name: "OnlyMintAllowed", inputs: [] },
  { type: "error", name: "InsufficientBalance", inputs: [] },
  { type: "error", name: "NotPoolManager", inputs: [] },
  { type: "error", name: "InvalidCaller", inputs: [] },
  { type: "error", name: "NotEnoughLiquidity", inputs: [{ name: "poolId", type: "bytes32" }] }
] as const

const RatRouterAbi = [
  {
    type: "function",
    name: "quoteExactIn",
    inputs: [
      { name: "amountIn", type: "uint256" },
      { name: "aerodromePath", type: "bytes" },
      {
        name: "uniswapPoolKey",
        type: "tuple",
        components: [
          { name: "currency0", type: "address" },
          { name: "currency1", type: "address" },
          { name: "fee", type: "uint24" },
          { name: "tickSpacing", type: "int24" },
          { name: "hooks", type: "address" }
        ]
      },
      { name: "uniswapZeroForOne", type: "bool" }
    ],
    outputs: [
      { name: "amountOutFinal", type: "uint256" },
      { name: "amountInUniswap", type: "uint256" }
    ],
    stateMutability: "nonpayable"
  }
] as const

async function main() {
  const publicClient = createPublicClient({
    chain: base,
    transport: http()
  })

  console.log("=== Debug Quote ===")
  console.log("RatRouter:", ratRouterAddress)
  console.log("Amount in:", amountIn.toString(), "(0.001 ETH)")
  console.log("Aerodrome path:", aerodromePath)
  console.log("Pool key:", poolKey)
  console.log("zeroForOne:", true)
  console.log("")

  try {
    const result = await publicClient.simulateContract({
      address: ratRouterAddress,
      abi: RatRouterAbi,
      functionName: "quoteExactIn",
      args: [amountIn, aerodromePath, poolKey, true]
    })
    console.log("SUCCESS:", result)
  } catch (error: any) {
    console.log("=== ERROR ===")
    console.log("Error type:", error.constructor.name)
    console.log("Error name:", error.name)
    console.log("")

    // Log all error properties
    console.log("Error properties:")
    for (const key of Object.keys(error)) {
      const value = error[key]
      if (typeof value === "string" && value.length > 200) {
        console.log(`  ${key}: [${value.length} chars]`, value.slice(0, 100) + "...")
      } else {
        console.log(`  ${key}:`, value)
      }
    }
    console.log("")

    // viem stores raw revert data in cause.raw
    const rawData: Hex | undefined = error.cause?.raw
    console.log("Raw data from error.cause.raw:", rawData)

    // Try to decode if we found raw data
    if (rawData) {
      console.log("\n=== Decoding raw data ===")
      console.log("Raw data:", rawData)

      try {
        const decoded = decodeErrorResult({
          abi: errorAbis,
          data: rawData
        })
        console.log("Decoded error:", decoded.errorName)
        console.log("Args:", decoded.args)

        // If it's UnexpectedRevertBytes, decode nested
        if (decoded.errorName === "UnexpectedRevertBytes" && decoded.args?.[0]) {
          const nested = decoded.args[0] as Hex
          console.log("\nNested revert data:", nested)
          try {
            const nestedDecoded = decodeErrorResult({
              abi: errorAbis,
              data: nested
            })
            console.log("Nested error:", nestedDecoded.errorName)
            console.log("Nested args:", nestedDecoded.args)
          } catch (e) {
            console.log("Could not decode nested error")
            // Print selector
            console.log("Nested selector:", nested.slice(0, 10))
          }
        }
      } catch (e) {
        console.log("Could not decode error")
        console.log("Selector:", rawData.slice(0, 10))
      }
    }
  }
}

main().catch(console.error)
