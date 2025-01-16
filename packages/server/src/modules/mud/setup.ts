/*
 * This file sets up all the definitions required for a MUD client.
 */

import { createClientComponents } from "./createClientComponents";
import { createSystemCalls } from "./createSystemCalls";
import { setupNetwork } from "./setupNetwork";

export type SetupResult = Awaited<ReturnType<typeof setup>>;

export async function setup(privateKey: string, chainId: number): Promise<{
  network: ReturnType<typeof setupNetwork>;
  components: ReturnType<typeof createClientComponents>;
  systemCalls: ReturnType<typeof createSystemCalls>;
}> {
  const network = await setupNetwork(privateKey, chainId);
  const components = createClientComponents(network);
  const systemCalls = createSystemCalls(network);

  return {
    network,
    components,
    systemCalls,
  };
}
