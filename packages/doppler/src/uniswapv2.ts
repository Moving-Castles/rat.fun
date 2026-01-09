import { getAddresses } from "@whetstone-research/doppler-sdk"
import {
  Account,
  Chain,
  Hex,
  parseAbiParameters,
  parseSignature,
  PublicClient,
  Transport,
  WalletClient
} from "viem"
import { v2lockerAbi, v2migratorAbi, v2pairAbi, v2router02Abi } from "./abis"

export async function univ2getPairReserves(publicClient: PublicClient, pair: Hex) {
  const [reserve0, reserve1, blockTimestampLast] = await publicClient.readContract({
    address: pair,
    abi: v2pairAbi,
    functionName: "getReserves",
    args: []
  })

  return {
    reserve0,
    reserve1,
    blockTimestampLast
  }
}

export async function univ2getPairInfo(publicClient: PublicClient, pair: Hex) {
  const token0 = await publicClient.readContract({
    address: pair,
    abi: v2pairAbi,
    functionName: "token0",
    args: []
  })

  const token1 = await publicClient.readContract({
    address: pair,
    abi: v2pairAbi,
    functionName: "token1",
    args: []
  })

  const totalSupply = await publicClient.readContract({
    address: pair,
    abi: v2pairAbi,
    functionName: "totalSupply",
    args: []
  })

  const decimals = await publicClient.readContract({
    address: pair,
    abi: v2pairAbi,
    functionName: "decimals",
    args: []
  })

  return {
    token0,
    token1,
    totalSupply,
    decimals
  }
}

export async function univ2signPermit(
  walletClient: WalletClient<Transport, Chain, Account>,
  pair: Hex,
  owner: Hex,
  spender: Hex,
  value: bigint,
  nonce: bigint,
  deadline: bigint
) {
  // https://docs.uniswap.org/contracts/v2/guides/smart-contract-integration/supporting-meta-transactions
  const domain = {
    name: "Uniswap V2",
    version: "1",
    chainId: walletClient.chain.id,
    verifyingContract: pair
  }
  return await walletClient.signTypedData({
    domain,
    types: {
      Permit: parseAbiParameters(
        "address owner,address spender,uint256 value,uint256 nonce,uint256 deadline"
      )
    },
    primaryType: "Permit",
    message: {
      owner,
      spender,
      value,
      nonce,
      deadline
    }
  })
}

export async function univ2removeLiquidity(
  publicClient: PublicClient,
  walletClient: WalletClient<Transport, Chain, Account>,
  pair: Hex,
  tokenA: Hex,
  tokenB: Hex,
  liquidity: bigint,
  receiver: Hex
) {
  const address = getAddresses(walletClient.chain.id).univ2Router02
  if (!address) throw new Error("No univ2Router02 address for chain")

  // 10 seconds
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 10)
  // get nonce
  const nonce = await publicClient.readContract({
    address: pair,
    abi: v2pairAbi,
    functionName: "nonces",
    args: [walletClient.account.address]
  })
  // sign typed data
  const signature = await univ2signPermit(
    walletClient,
    pair,
    walletClient.account.address,
    address,
    liquidity,
    nonce,
    deadline
  )
  const parsedSignature = parseSignature(signature)

  return await walletClient.writeContract({
    address,
    abi: v2router02Abi,
    functionName: "removeLiquidityWithPermit",
    args: [
      tokenA,
      tokenB,
      liquidity,
      0n,
      0n,
      receiver,
      deadline,
      false,
      Number(parsedSignature.v),
      parsedSignature.r,
      parsedSignature.s
    ]
  })
}

export async function univ2simulateRemoveLiquidity(
  publicClient: PublicClient,
  walletClient: WalletClient<Transport, Chain, Account>,
  pair: Hex,
  tokenA: Hex,
  tokenB: Hex,
  liquidity: bigint,
  receiver: Hex
) {
  const address = getAddresses(walletClient.chain.id).univ2Router02
  if (!address) throw new Error("No univ2Router02 address for chain")

  // 10 seconds
  const deadline = BigInt(Math.floor(Date.now() / 1000) + 10)
  // get nonce
  const nonce = await publicClient.readContract({
    address: pair,
    abi: v2pairAbi,
    functionName: "nonces",
    args: [walletClient.account.address]
  })
  // sign typed data (local operation)
  const signature = await univ2signPermit(
    walletClient,
    pair,
    walletClient.account.address,
    address,
    liquidity,
    nonce,
    deadline
  )
  const parsedSignature = parseSignature(signature)

  return await publicClient.simulateContract({
    address,
    abi: v2router02Abi,
    functionName: "removeLiquidityWithPermit",
    args: [
      tokenA,
      tokenB,
      liquidity,
      0n,
      0n,
      receiver,
      deadline,
      false,
      Number(parsedSignature.v),
      parsedSignature.r,
      parsedSignature.s
    ],
    account: walletClient.account
  })
}

export async function v2LockerGetAddress(publicClient: PublicClient<Transport, Chain>) {
  return await publicClient.readContract({
    address: getAddresses(publicClient.chain.id).v2Migrator,
    abi: v2migratorAbi,
    functionName: "locker",
    args: []
  })
}

export async function v2LockerGetPoolState(
  publicClient: PublicClient<Transport, Chain>,
  locker: Hex,
  pool: Hex
) {
  const [amount0, amount1, minUnlockDate, recipient] = await publicClient.readContract({
    address: locker,
    abi: v2lockerAbi,
    functionName: "getState",
    args: [pool]
  })

  return {
    amount0,
    amount1,
    minUnlockDate,
    recipient
  }
}

export async function v2LockerClaimFeesAndExit(
  walletClient: WalletClient<Transport, Chain, Account>,
  locker: Hex,
  pool: Hex
) {
  return await walletClient.writeContract({
    address: locker,
    abi: v2lockerAbi,
    functionName: "claimFeesAndExit",
    args: [pool]
  })
}
