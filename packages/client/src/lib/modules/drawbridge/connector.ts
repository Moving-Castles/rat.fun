import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import { addChain, switchChain } from "viem/actions"
import { getAccount, getChainId, getConnectorClient } from "@wagmi/core"
import { getChain } from "$lib/mud/utils"
import { getDrawbridge } from "$lib/modules/drawbridge"
import { ensureWriteContract, type WalletTransactionClient } from "$lib/mud/setupWalletNetwork"

/**
 * Returns the wallet connector client from wagmi
 * Expects the wallet connection to be established, throws an error otherwise.
 */
export async function getEstablishedConnectorClient() {
  const drawbridge = getDrawbridge()
  const wagmiConfig = drawbridge.getWagmiConfig()
  return await getConnectorClient(wagmiConfig)
}

/**
 * Disconnect wallet
 * Uses drawbridge's disconnect method which handles both wagmi and session cleanup
 */
export async function disconnectWallet() {
  const drawbridge = getDrawbridge()
  await drawbridge.disconnectWallet()
}

/**
 * Prepares the wallet client obtained from wagmi for sending onchain transactions.
 * - Expects wagmi provider to already have a wallet connected to it by drawbridge.
 * - Wallet may switch between different chains, ensure the current chain is correct.
 * - Extend the client with MUD's transactionQueue, since it comes directly from wagmi, not drawbridge's hooks.
 */
export async function prepareConnectorClientForTransaction(): Promise<WalletTransactionClient> {
  const drawbridge = getDrawbridge()
  const wagmiConfig = drawbridge.getWagmiConfig()

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
    connectorClient = await getConnectorClient(wagmiConfig, {
      connector: getAccount(wagmiConfig).connector
    })
  }
  // MUD's `transactionQueue` extends the client with `writeContract` method
  return ensureWriteContract(connectorClient)
}
