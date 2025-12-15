import { Command } from "commander"
import { getChain } from "@ratfun/common/basic-network"
import { SupportedChain } from "@whetstone-research/doppler-sdk"

// Set up command line options for chain-id only
export function promptChain() {
  const program = new Command()
  program
    .requiredOption("-c, --chain-id <CHAINID>", "Chain id", (val: string) => parseInt(val), 84532)
    .parse(process.argv)

  const options = program.opts()

  const chainId: number = options.chainId
  const chain = getChain(chainId)
  return chain as SupportedChain
}
