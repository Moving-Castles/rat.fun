import { get } from "svelte/store"
import { publicNetwork } from "$lib/modules/network"
import { addChain, switchChain } from "viem/actions"
import { getAccount, getChainId, getConnectorClient, type Config } from "@wagmi/core"
import {
  ensureWriteContract,
  getChain,
  WalletTransactionClient
} from "@ratfun/common/basic-network"
import { getDrawbridge } from "$lib/modules/drawbridge"

/**
 * Returns the wagmi config from drawbridge
 */
export function getWagmiConfig(): Config {
  const drawbridge = getDrawbridge()
  return drawbridge.getWagmiConfig()
}

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
  const currentChainId = getChainId(wagmiConfig)

  if (currentChainId !== expectedChainId) {
    console.log(
      `[connector] Chain mismatch: current=${currentChainId}, expected=${expectedChainId}, attempting switch`
    )
    try {
      await switchChain(connectorClient, { id: expectedChainId })
    } catch (switchError) {
      // Some wallets (e.g. Farcaster MiniApp) don't support wallet_switchEthereumChain
      // or wallet_addEthereumChain. Log and continue - the transaction may still work
      // if the wallet is already on the correct chain internally.
      console.warn(
        "[connector] Chain switch failed (wallet may not support this method):",
        switchError
      )

      // Only try addChain if it's not an UnsupportedProviderMethodError
      const isUnsupportedMethod =
        switchError instanceof Error &&
        (switchError.name === "UnsupportedProviderMethodError" ||
          switchError.message?.includes("does not support"))

      if (!isUnsupportedMethod) {
        try {
          await addChain(connectorClient, { chain: getChain(expectedChainId) })
          await switchChain(connectorClient, { id: expectedChainId })
        } catch (addChainError) {
          console.warn("[connector] Add chain also failed:", addChainError)
        }
      }
    }

    // manually update the connector and its chain id
    connectorClient = await getConnectorClient(wagmiConfig, {
      connector: getAccount(wagmiConfig).connector
    })
  }
  // MUD's `transactionQueue` extends the client with `writeContract` method
  return ensureWriteContract(connectorClient)
}
