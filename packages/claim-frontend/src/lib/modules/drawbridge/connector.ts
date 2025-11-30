import { get } from "svelte/store"
import type { Hex } from "viem"
import { addChain, switchChain, writeContract } from "viem/actions"
import { getAccount, getChainId, getConnectorClient } from "@wagmi/core"
import type { Config } from "@wagmi/core"

import { networkConfig } from "$lib/network"
import { getDrawbridge } from "$lib/modules/drawbridge"
import { WagmiConfigUnavailableError, NetworkNotInitializedError } from "../error-handling/errors"

type WriteContractArgs = {
  address: Hex
  abi: readonly unknown[]
  functionName: string
  args?: readonly unknown[]
  gas?: bigint
  value?: bigint
}

export type WalletTransactionClient = {
  writeContract: (args: WriteContractArgs) => Promise<Hex>
}

/**
 * Get the connector client from wagmi, ensuring we're on the correct chain.
 * Returns a client that can be used with viem's writeContract action.
 */
export async function prepareConnectorClientForTransaction(): Promise<WalletTransactionClient> {
  const wagmiConfig = getDrawbridge().getWagmiConfig() as Config
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

  // Return a simple wrapper with writeContract using viem's tree-shakable action
  return {
    async writeContract(args: WriteContractArgs): Promise<Hex> {
      return writeContract(connectorClient, args as Parameters<typeof writeContract>[1])
    }
  }
}

export async function disconnectWallet() {
  try {
    const drawbridge = getDrawbridge()
    await drawbridge.disconnectWallet()
  } catch {
    // Not connected, nothing to do
  }
}
