import { getAddresses } from "@whetstone-research/doppler-sdk"
import {
  Account,
  Chain,
  erc20Abi,
  Hex,
  maxUint256,
  parseAbi,
  PublicClient,
  Transport,
  TypedData,
  WalletClient
} from "viem"

const permit2Abi = parseAbi([
  "function allowance(address user, address token, address spender) external view returns (uint160 amount, uint48 expiration, uint48 nonce)"
])

const PERMIT2_PERMIT_TYPE: TypedData = {
  PermitDetails: [
    { name: "token", type: "address" },
    { name: "amount", type: "uint160" },
    { name: "expiration", type: "uint48" },
    { name: "nonce", type: "uint48" }
  ],
  PermitSingle: [
    { name: "details", type: "PermitDetails" },
    { name: "spender", type: "address" },
    { name: "sigDeadline", type: "uint256" }
  ]
}

export interface Permit2PermitData {
  details: {
    token: Hex
    amount: bigint
    expiration: bigint
    nonce: bigint
  }
  spender: Hex
  sigDeadline: bigint
}

/**
 * Check if token has sufficient allowance for permit2
 * This could be always present due to the wallet using uniswap itself, since permit2 is a global contract
 */
export async function isPermit2AllowanceRequired(
  publicClient: PublicClient<Transport, Chain>,
  walletAddress: Hex,
  tokenAddress: Hex,
  requiredAllowance: bigint
) {
  const permit2Address = getAddresses(publicClient.chain.id).permit2
  const allowance = await publicClient.readContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: [walletAddress, permit2Address]
  })
  return allowance < requiredAllowance
}

/**
 * Set token max allowance for permit2 contract
 */
export async function permit2AllowMax(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  tokenAddress: Hex
) {
  const permit2Address = getAddresses(publicClient.chain.id).permit2
  const txHash = await walletClient.writeContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: "approve",
    args: [permit2Address, maxUint256]
  })
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash })
  return {
    txHash,
    receipt
  }
}

/**
 * Prepare permit2 data and its signature (requested via walletClient)
 */
export async function signPermit2(
  publicClient: PublicClient<Transport, Chain>,
  walletClient: WalletClient<Transport, Chain, Account>,
  tokenAddress: Hex,
  spender: Hex,
  amount: bigint
) {
  if (publicClient.chain.id !== walletClient.chain.id) {
    throw new Error("public and wallet client chains mismatch")
  }

  const permit2Address = getAddresses(publicClient.chain.id).permit2

  // Get account's current permit2 nonce, as stored in the permit2 contract (not related to transaction nonce)
  const permit2Allowance = await publicClient.readContract({
    address: permit2Address,
    abi: permit2Abi,
    functionName: "allowance",
    args: [walletClient.account.address, tokenAddress, spender]
  })
  const nonce = BigInt(permit2Allowance[2])

  // Permit router to spend tokens
  const nowSec = BigInt(Math.floor(Date.now() / 1000))
  const permit = {
    details: {
      token: tokenAddress,
      amount,
      expiration: nowSec + 3600n,
      nonce
    },
    spender,
    sigDeadline: nowSec + 3600n
  } as const satisfies Permit2PermitData

  const permitSignature = await walletClient.signTypedData({
    account: walletClient.account,
    domain: {
      name: "Permit2",
      chainId: publicClient.chain.id,
      verifyingContract: permit2Address
    },
    types: PERMIT2_PERMIT_TYPE,
    primaryType: "PermitSingle",
    message: permit
  })

  return { permit, permitSignature }
}
