/*
 * Network specific configuration for the client.
 * By default connect to the anvil test network.
 */

/*
 * By default the template just creates a temporary wallet
 * (called a burner wallet).
 */
// import { getBurnerPrivateKey } from "@latticexyz/common";

/*
 * Import the addresses of the World, possibly on multiple chains,
 * from packages/contracts/worlds.json. When the contracts package
 * deploys a new `World`, it updates this file.
 */
import worlds from "contracts/worlds.json";

/*
 * The supported chains.
 */

import { supportedChains } from "./supportedChains";

export async function getNetworkConfig(privateKey: string, chainId: number) {
  /*
   * Find the chain (unless it isn't in the list of supported chains).
   */
  const chainIndex = supportedChains.findIndex((c) => c.id === chainId);
  const chain = supportedChains[chainIndex];
  if (!chain) {
    throw new Error(`Chain ${chainId} not found`);
  }

  /*
   * Get the address of the World. If you want to use a
   * different address than the one in worlds.json,
   * provide it as worldAddress in the query string.
   */
  const world = worlds[chain.id.toString()];
  const worldAddress = world?.address;
  if (!worldAddress) {
    throw new Error(`No world address found for chain ${chainId}. Did you run \`mud deploy\`?`);
  }

  /*
   * MUD clients use events to synchronize the database, meaning
   * they need to look as far back as when the World was started.
   * The block number for the World start can be specified either
   * on the URL (as initialBlockNumber) or in the worlds.json
   * file. If neither has it, it starts at the first block, zero.
   */
  const initialBlockNumber = world?.blockNumber ?? 0n;

  // Garnet: 0x6b3875c240bcde26fc32b1d23d746a42901956a2ddf11da050593ad6725b18ec
  return {
    privateKey,
    chainId,
    chain,
    worldAddress,
    initialBlockNumber,
  };
}
