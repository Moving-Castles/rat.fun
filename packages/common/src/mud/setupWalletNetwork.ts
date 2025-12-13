/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import {
  Hex,
  getContract,
  WalletClient,
  Chain,
  Account,
  Transport,
  GetContractReturnType,
  Address,
  PublicClient,
  Client
} from "viem"
import type { SmartAccount } from "viem/account-abstraction"
import { encodeEntity } from "@latticexyz/store-sync/recs"

import { IWorldAbi } from "contracts/worldAbi"

import { ensureWriteContract, WalletTransactionClient } from "../basic-network"
import { SetupPublicNetworkResult } from "./setupPublicNetwork"

type WalletClientInput =
  | WalletClient<Transport, Chain, Account>
  | Client<Transport, Chain, Account>
  | Client<Transport, Chain, SmartAccount>

export type SetupWalletNetworkResult = {
  playerEntity: ReturnType<typeof encodeEntity>
  walletClient: WalletTransactionClient
  worldContract: GetContractReturnType<
    typeof IWorldAbi,
    { public: PublicClient<Transport, Chain>; wallet: WalletClient<Transport, Chain, Account> },
    Address
  >
}

export function setupWalletNetwork(
  publicNetwork: SetupPublicNetworkResult,
  walletClient: WalletClientInput
): SetupWalletNetworkResult {
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
