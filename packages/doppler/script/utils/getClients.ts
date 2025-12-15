import {
  Account,
  Chain,
  createPublicClient,
  createWalletClient,
  http,
  PublicClient,
  Transport,
  WalletClient
} from "viem"
import { DopplerSDK } from "@whetstone-research/doppler-sdk"
import { setupPublicBasicNetwork } from "@ratfun/common/basic-network"

export function getClients(
  account: Account,
  chain: Chain
): {
  publicClient: PublicClient<Transport, Chain>
  walletClient: WalletClient<Transport, Chain, Account>
  sdk: DopplerSDK
} {
  // Set up viem clients
  const { publicClient, transport } = setupPublicBasicNetwork({ chainId: chain.id, chain }, true)
  const walletClient = createWalletClient({
    chain,
    transport,
    account
  })

  // Initialize the SDK
  const sdk = new DopplerSDK({
    publicClient,
    walletClient,
    chainId: chain.id
  })

  return {
    publicClient,
    walletClient,
    sdk
  }
}
