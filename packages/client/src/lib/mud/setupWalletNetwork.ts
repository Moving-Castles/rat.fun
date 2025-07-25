/*
 * The MUD client code is built on top of viem
 * (https://viem.sh/docs/getting-started.html).
 * This line imports the functions we need from it.
 */
import { Hex, getContract, Client, Transport, Chain, Account } from "viem"
import { encodeEntity } from "@latticexyz/store-sync/recs"

import IWorldAbi from "contracts/out/IWorld.sol/IWorld.abi.json" with { type: "json" }

import { SetupPublicNetworkResult } from "./setupPublicNetwork"

export type SetupWalletNetworkResult = Awaited<ReturnType<typeof setupWalletNetwork>>

export function setupWalletNetwork(
  publicNetwork: SetupPublicNetworkResult,
  walletClient: Client<Transport, Chain, Account>
) {
  const networkConfig = publicNetwork.config

  /*
   * Create an object for communicating with the deployed World.
   */
  const worldContract = getContract({
    address: networkConfig.worldAddress as Hex,
    abi: IWorldAbi,
    client: { public: publicNetwork.publicClient, wallet: walletClient }
  })

  return {
    playerEntity: encodeEntity({ address: "address" }, { address: walletClient.account.address }),
    walletClient,
    worldContract
  }
}
