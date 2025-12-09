import { get } from "svelte/store"
import type { Hex, WalletClient, Chain, Account, Transport, Client } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { addChain, switchChain, writeContract, watchAsset } from "viem/actions"
import { getAccount, getChainId, getConnectorClient } from "@wagmi/core"

import { networkConfig } from "$lib/network"
import { getDrawbridge } from "$lib/modules/drawbridge"
import {
  WagmiConfigUnavailableError,
  NetworkNotInitializedError
} from "$lib/modules/error-handling"

// Types for wallet clients
type WalletClientInput =
  | WalletClient<Transport, Chain, Account>
  | Client<Transport, Chain, Account>
  | Client<Transport, Chain, SmartAccount>

type WriteContractArgs = {
  address: Hex
  abi: unknown
  functionName: string
  args?: readonly unknown[] | unknown[]
  gas?: bigint
  value?: bigint
}

export type WalletTransactionClient = {
  writeContract: (args: WriteContractArgs) => Promise<Hex>
}

/**
 * Returns the wallet connector client from wagmi.
 * Expects the wallet connection to be established, throws an error otherwise.
 */
export async function getEstablishedConnectorClient() {
  const wagmiConfig = getDrawbridge().getWagmiConfig()
  if (!wagmiConfig) {
    throw new WagmiConfigUnavailableError()
  }
  return await getConnectorClient(wagmiConfig)
}

export async function disconnectWallet() {
  try {
    const drawbridge = getDrawbridge()
    await drawbridge.disconnectWallet()
  } catch {
    // Not connected, nothing to do
  }
}

/**
 * Prepares the wallet client obtained from wagmi for sending onchain transactions.
 * - Expects wagmi provider to already have a wallet connected to it by drawbridge.
 * - Wallet may switch between different chains, ensure the current chain is correct.
 */
export async function prepareConnectorClientForTransaction(): Promise<WalletTransactionClient> {
  const wagmiConfig = getDrawbridge().getWagmiConfig()
  if (!wagmiConfig) {
    throw new WagmiConfigUnavailableError()
  }

  const config = get(networkConfig)
  if (!config) {
    throw new NetworkNotInitializedError()
  }

  let connectorClient: WalletClientInput = await getConnectorClient(wagmiConfig)

  // User's wallet may switch between different chains, ensure the current chain is correct
  const expectedChainId = config.chainId
  if (getChainId(wagmiConfig) !== expectedChainId) {
    try {
      await switchChain(connectorClient, { id: expectedChainId })
    } catch {
      await addChain(connectorClient, { chain: config.chain })
      await switchChain(connectorClient, { id: expectedChainId })
    }

    // manually update the connector and its chain id
    connectorClient = await getConnectorClient(wagmiConfig, {
      connector: getAccount(wagmiConfig).connector
    })
  }

  // Wrap the connector client with writeContract using viem's native action
  return {
    async writeContract(args: WriteContractArgs): Promise<Hex> {
      return writeContract(connectorClient, args as Parameters<typeof writeContract>[1])
    }
  }
}

/**
 * Prompts the user's wallet to add the RAT token to their token list (EIP-747)
 */
export async function addRatTokenToWallet(): Promise<boolean> {
  const config = get(networkConfig)
  if (!config) {
    throw new NetworkNotInitializedError()
  }

  const connectorClient = await getEstablishedConnectorClient()

  return watchAsset(connectorClient, {
    type: "ERC20",
    options: {
      address: config.ratTokenAddress,
      symbol: "RAT",
      decimals: 18
    }
  })
}
