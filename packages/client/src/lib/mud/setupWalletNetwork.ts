/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import { Hex, getContract, WalletClient, Chain, Account, Transport, Client } from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { encodeEntity } from "@latticexyz/store-sync/recs"
import { transactionQueue } from "@latticexyz/common/actions"

import { IWorldAbi } from "contracts/worldAbi"

import { SetupPublicNetworkResult } from "./setupPublicNetwork"

type WalletClientInput =
  | WalletClient<Transport, Chain, Account>
  | Client<Transport, Chain, Account>
  | Client<Transport, Chain, SmartAccount>

type WriteContractArgs = {
  address: Hex
  abi: unknown
  functionName: string
  args?: unknown[]
  value?: bigint
}

export type WalletTransactionClient = WalletClientInput & {
  writeContract: (args: WriteContractArgs) => Promise<Hex>
}

/**
 * Ensure the provided viem client exposes a `writeContract` helper.
 *
 * - Drawbridge session clients already ship with the method, so we return them verbatim.
 * - Other clients may need the MUD `transactionQueue` extension to gain it.
 * - As a final fallback we cast, since some typed clients expose the method but miss the narrows.
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

export type SetupWalletNetworkResult = Awaited<ReturnType<typeof setupWalletNetwork>>

export function setupWalletNetwork(
  publicNetwork: SetupPublicNetworkResult,
  walletClient: WalletClientInput
) {
  const networkConfig = publicNetwork.config

  const enhancedWalletClient = ensureWriteContract(walletClient)

  /*
   * Create an object for communicating with the deployed World.
   */
  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    client: {
      public: publicNetwork.publicClient,
      wallet: enhancedWalletClient as WalletClient<Transport, Chain, Account>
    }
  })

  return {
    playerEntity: encodeEntity(
      { address: "address" },
      { address: enhancedWalletClient.account.address }
    ),
    walletClient: enhancedWalletClient,
    worldContract
  }
}

export { ensureWriteContract }
