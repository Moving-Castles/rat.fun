import { WalletClient, Chain, Account, Transport, Client, WalletActions } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { encodeEntity } from "@latticexyz/store-sync/recs"
import { transactionQueue } from "@latticexyz/common/actions"

type WalletClientInput =
  | WalletClient<Transport, Chain, Account>
  | Client<Transport, Chain, Account>
  | Client<Transport, Chain, SmartAccount>
  // Drawbridge ConnectorClient - extends with writeContract/sendTransaction
  | (Client<Transport, Chain, Account> & {
      writeContract: WalletActions<Chain, Account>["writeContract"]
      sendTransaction: WalletActions<Chain, Account>["sendTransaction"]
    })

export type WalletTransactionClient = Client<
  Transport,
  Chain,
  Account | SmartAccount,
  undefined,
  Pick<WalletActions<Chain, Account>, "writeContract">
>

/**
 * Ensure the provided viem client exposes a `writeContract` helper.
 *
 * - Drawbridge session clients already ship with the method, so we return them verbatim.
 * - Burner / wagmi-derived clients need the MUD `transactionQueue` extension to gain it.
 * - As a final fallback we cast, since some typed clients expose the method but miss the narrows.
 */
export function ensureWriteContract(client: WalletClientInput): WalletTransactionClient {
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

export type SetupWalletBasicNetworkResult = Awaited<ReturnType<typeof setupWalletBasicNetwork>>

export function setupWalletBasicNetwork(walletClient: WalletClientInput) {
  const enhancedWalletClient = ensureWriteContract(walletClient)

  return {
    playerEntity: encodeEntity(
      { address: "address" },
      { address: enhancedWalletClient.account.address }
    ),
    walletClient: enhancedWalletClient
  }
}
