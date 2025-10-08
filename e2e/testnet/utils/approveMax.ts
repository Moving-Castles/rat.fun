import { Account, erc20Abi, Hex, maxUint256 } from "viem"
import { SetupSimpleNetworkReturnType } from "../setup/setupSimpleNetwork"
import { getTableValue } from "./getTableValue"
import mudConfig from "contracts/mud.config"

export async function approveMax(network: SetupSimpleNetworkReturnType, account: Account) {
  const config = await getTableValue({
    client: network.publicClient,
    worldAddress: network.worldContract.address,
    table: mudConfig.tables.ratfun__ExternalAddressesConfig,
    key: []
  })

  return await network.walletClient.writeContract({
    account,
    address: config.erc20Address as Hex,
    abi: erc20Abi,
    functionName: "approve",
    args: [config.gamePoolAddress as Hex, maxUint256]
  })
}
