import { get } from "svelte/store"
import { addChain, switchChain } from "viem/actions"
import { getAccount, getChainId, getConnectorClient } from "@wagmi/core"
import { WagmiConfigUnavailableError, NetworkNotInitializedError } from "@ratfun/common/error-handling"
import { ensureWriteContract, WalletTransactionClient } from "@ratfun/common/basic-network"

import { networkConfig } from "$lib/network"
import { getDrawbridge } from "$lib/modules/drawbridge"

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

  let connectorClient = await getConnectorClient(wagmiConfig)

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

  return ensureWriteContract(connectorClient)
}
