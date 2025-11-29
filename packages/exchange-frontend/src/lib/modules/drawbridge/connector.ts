import { get } from "svelte/store"
import type { Hex, WalletClient, Chain, Account, Transport, Client } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { addChain, switchChain } from "viem/actions"
import { getAccount, getChainId, getConnectorClient } from "@wagmi/core"
import { transactionQueue } from "@latticexyz/common/actions"

import { networkConfig } from "$lib/network"
import { getDrawbridge } from "$lib/modules/drawbridge"
import { WagmiConfigUnavailableError, NetworkNotInitializedError } from "../error-handling/errors"

// Types for wallet clients
type WalletClientInput =
  | WalletClient<Transport, Chain, Account>
  | Client<Transport, Chain, Account>
  | Client<Transport, Chain, SmartAccount>

type WriteContractArgs = {
  address: Hex
  abi: unknown
  functionName: string
  args?: unknown[]
  gas?: bigint
  value?: bigint
}

export type WalletTransactionClient = WalletClientInput & {
  writeContract: (args: WriteContractArgs) => Promise<Hex>
}

/**
 * Ensure the provided viem client exposes a `writeContract` helper.
 */
function ensureWriteContract(client: WalletClientInput): WalletTransactionClient {
  if ("writeContract" in client && typeof client.writeContract === "function") {
    return client as WalletTransactionClient
  }

  if ("extend" in client && typeof client.extend === "function") {
    const extended = (client as WalletClient<Transport, Chain, Account>).extend(transactionQueue())
    if ("writeContract" in extended && typeof extended.writeContract === "function") {
      return extended as WalletTransactionClient
    }
    return extended as WalletTransactionClient
  }

  return client as WalletTransactionClient
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
 * - Extend the client with MUD's transactionQueue, since it comes directly from wagmi.
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
  // MUD's `transactionQueue` extends the client with `writeContract` method
  return ensureWriteContract(connectorClient)
}
