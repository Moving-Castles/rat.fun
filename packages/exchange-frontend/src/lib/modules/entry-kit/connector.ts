import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import { addChain, switchChain } from "viem/actions"
import { disconnect, getAccount, getChainId, getConnectorClient } from "@wagmi/core"
import { getChain } from "$lib/mud/utils"
import { wagmiConfigStateful } from "$lib/modules/entry-kit/stores"
import { WagmiConfigUnavailableError } from "../error-handling/errors"
import { ensureWriteContract, type WalletTransactionClient } from "$lib/mud/setupWalletNetwork"

/**
 * Returns the wallet connector client from wagmi provider, which is synced with a stateful svelte config.
 * React-svelte sync doesn't react to changes quickly, use wagmi getters for the most current data.
 * (e.g. after a chain switch the stateful config won't update immediately, you can use getChainId though)
 * Expects the wallet connection to be established, throws an error otherwise.
 */
export async function getEstablishedConnectorClient() {
  const wagmiConfig = get(wagmiConfigStateful)
  if (!wagmiConfig) {
    throw new WagmiConfigUnavailableError()
  }
  return await getConnectorClient(wagmiConfig)
}

export async function disconnectWallet() {
  const wagmiConfig = get(wagmiConfigStateful)
  if (!wagmiConfig) {
    // Not connected, nothing to do
    return
  }
  await disconnect(wagmiConfig)
}

/**
 * Prepares the wallet client obtained from wagmi for sending onchain transactions.
 * - Expects wagmi provider to already have a wallet connected to it by entrykit.
 * - Wallet may switch between different chains, ensure the current chain is correct.
 * - Extend the client with MUD's transactionQueue, since it comes directly from wagmi, not entrykit's hooks.
 */
export async function prepareConnectorClientForTransaction(): Promise<WalletTransactionClient> {
  const wagmiConfig = get(wagmiConfigStateful)
  if (!wagmiConfig) {
    throw new WagmiConfigUnavailableError()
  }
  let connectorClient = await getConnectorClient(wagmiConfig)

  // User's wallet may switch between different chains, ensure the current chain is correct
  const expectedChainId = get(publicNetwork).config.chain.id
  if (getChainId(wagmiConfig) !== expectedChainId) {
    try {
      await switchChain(connectorClient, { id: expectedChainId })
    } catch {
      await addChain(connectorClient, { chain: getChain(expectedChainId) })
      await switchChain(connectorClient, { id: expectedChainId })
    }

    // manually update the connector and its chain id
    // (syncing wagmi state update from react to svelte can take a while and the config state is likely stale)
    connectorClient = await getConnectorClient(wagmiConfig, {
      connector: getAccount(wagmiConfig).connector
    })
  }
  // MUD's `transactionQueue` extends the client with `writeContract` method
  return ensureWriteContract(connectorClient)
}
