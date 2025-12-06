import { AbiParametersToPrimitiveTypes } from "abitype"
import { AbiParameter, encodeAbiParameters, Hex, maxUint128, parseAbiParameters } from "viem"

export enum V4ActionType {
  INCREASE_LIQUIDITY = 0x00,
  DECREASE_LIQUIDITY = 0x01,
  MINT_POSITION = 0x02,
  BURN_POSITION = 0x03,
  INCREASE_LIQUIDITY_FROM_DELTAS = 0x04,
  MINT_POSITION_FROM_DELTAS = 0x05,
  SWAP_EXACT_IN_SINGLE = 0x06,
  SWAP_EXACT_IN = 0x07,
  SWAP_EXACT_OUT_SINGLE = 0x08,
  SWAP_EXACT_OUT = 0x09,
  SETTLE = 0x0b,
  SETTLE_ALL = 0x0c,
  TAKE = 0x0e,
  TAKE_ALL = 0x0f,
  TAKE_PORTION = 0x10,
  CLOSE_CURRENCY = 0x12,
  SWEEP = 0x14,
  WRAP = 0x15,
  UNWRAP = 0x16,
  // extended actions
  PERMIT2_PERMIT = 0x19,
  PERMIT2_TRANSFER_FROM = 0x1b,
  AERODROME_SWAP_EXACT_IN = 0x1c,
  AERODROME_SWAP_EXACT_OUT = 0x1d
}

export const ActionConstants = {
  OPEN_DELTA: 0n,
  CONTRACT_BALANCE: 0x8000000000000000000000000000000000000000000000000000000000000000n,
  MSG_SENDER: "0x0000000000000000000000000000000000000001",
  ADDRESS_THIS: "0x0000000000000000000000000000000000000002",
  // CONTRACT_BALANCE variant only for native uniswap v4 swaps, which aren't uint256 compatible
  SWAP_CONTRACT_BALANCE: maxUint128
} as const

const POOL_KEY_STRUCT = {
  name: "poolKey",
  type: "tuple",
  components: [
    { name: "currency0", type: "address" },
    { name: "currency1", type: "address" },
    { name: "fee", type: "uint24" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" }
  ]
} as const

const PATH_KEY_STRUCT = {
  name: "pathKey",
  type: "tuple",
  components: [
    { name: "intermediateCurrency", type: "address" },
    { name: "fee", type: "uint256" },
    { name: "tickSpacing", type: "int24" },
    { name: "hooks", type: "address" },
    { name: "hookData", type: "bytes" }
  ]
} as const

const ABI_DEFINITION = {
  [V4ActionType.INCREASE_LIQUIDITY]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType.DECREASE_LIQUIDITY]: [
    { type: "uint256" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType.MINT_POSITION]: [
    POOL_KEY_STRUCT,
    { type: "int24" },
    { type: "int24" },
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" }
  ],
  [V4ActionType.BURN_POSITION]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType.INCREASE_LIQUIDITY_FROM_DELTAS]: [
    { type: "uint256" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "bytes" }
  ],
  [V4ActionType.MINT_POSITION_FROM_DELTAS]: [
    POOL_KEY_STRUCT,
    { type: "int24" },
    { type: "int24" },
    { type: "uint128" },
    { type: "uint128" },
    { type: "address" },
    { type: "bytes" }
  ],
  [V4ActionType.SWAP_EXACT_IN_SINGLE]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        POOL_KEY_STRUCT,
        { name: "zeroForOne", type: "bool" },
        { name: "amountIn", type: "uint128" },
        { name: "amountOutMinimum", type: "uint128" },
        { name: "hookData", type: "bytes" }
      ]
    }
  ],
  [V4ActionType.SWAP_EXACT_IN]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        { name: "currencyIn", type: "address" },
        {
          name: "path",
          type: "tuple[]",
          components: PATH_KEY_STRUCT.components
        },
        { name: "amountIn", type: "uint128" },
        { name: "amountOutMinimum", type: "uint128" }
      ]
    }
  ],
  [V4ActionType.SWAP_EXACT_OUT_SINGLE]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        POOL_KEY_STRUCT,
        { name: "zeroForOne", type: "bool" },
        { name: "amountOut", type: "uint128" },
        { name: "amountInMaximum", type: "uint128" },
        { name: "hookData", type: "bytes" }
      ]
    }
  ],
  [V4ActionType.SWAP_EXACT_OUT]: [
    {
      name: "swapParams",
      type: "tuple",
      components: [
        { name: "currencyOut", type: "address" },
        {
          name: "path",
          type: "tuple[]",
          components: PATH_KEY_STRUCT.components
        },
        { name: "amountOut", type: "uint128" },
        { name: "amountInMaximum", type: "uint128" }
      ]
    }
  ],
  [V4ActionType.SETTLE]: [{ type: "address" }, { type: "uint256" }, { type: "bool" }],
  [V4ActionType.SETTLE_ALL]: [{ type: "address" }, { type: "uint256" }],
  [V4ActionType.TAKE]: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
  [V4ActionType.TAKE_ALL]: [{ type: "address" }, { type: "uint256" }],
  [V4ActionType.TAKE_PORTION]: [{ type: "address" }, { type: "address" }, { type: "uint256" }],
  [V4ActionType.CLOSE_CURRENCY]: [{ type: "address" }],
  [V4ActionType.SWEEP]: [{ type: "address" }, { type: "address" }],
  [V4ActionType.WRAP]: [{ type: "uint256" }],
  [V4ActionType.UNWRAP]: [{ type: "uint256" }],
  [V4ActionType.PERMIT2_PERMIT]: parseAbiParameters([
    "PermitSingle",
    "bytes",
    "struct PermitSingle { PermitDetails details; address spender; uint256 sigDeadline; }",
    "struct PermitDetails { address token; uint160 amount; uint48 expiration; uint48 nonce; }"
  ]),
  [V4ActionType.PERMIT2_TRANSFER_FROM]: parseAbiParameters([
    "address token",
    "address recipient",
    "uint160 amount"
  ]),
  [V4ActionType.AERODROME_SWAP_EXACT_IN]: parseAbiParameters([
    "V3ExactInputParams params",
    "struct V3ExactInputParams { bytes path; uint256 amountIn; uint256 amountOutMinimum; }"
  ]),
  [V4ActionType.AERODROME_SWAP_EXACT_OUT]: parseAbiParameters([
    "V3ExactOutputParams params",
    "struct V3ExactOutputParams { bytes path; uint256 amountOut; uint256 amountInMaximum; }"
  ])
} as const satisfies Record<V4ActionType, AbiParameter[] | readonly AbiParameter[]>

export class V4DeltaActionBuilder {
  actions: Hex = "0x"
  inputs: Hex[] = []

  addAction<T extends V4ActionType>(
    type: T,
    parameters: AbiParametersToPrimitiveTypes<(typeof ABI_DEFINITION)[T]>
  ): this {
    const encoded = encodeAbiParameters(ABI_DEFINITION[type], parameters as never)
    this.actions += type.toString(16).padStart(2, "0")
    this.inputs.push(encoded)
    return this
  }

  buildExecuteArgs(): [Hex] {
    const encodedArgs = encodeAbiParameters(
      [{ type: "bytes" }, { type: "bytes[]" }],
      [this.actions, this.inputs]
    )
    return [encodedArgs]
  }
}
