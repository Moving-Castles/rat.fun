import { Account, Hex } from "viem"
import { getComponentValue, getComponentValueStrict } from "@latticexyz/recs"
import { encodeEntity } from "@latticexyz/store-sync/recs"
import { SetupNetworkReturnType } from "server/internal"

export async function spawnOrGetRat(network: SetupNetworkReturnType, account: Account) {
  const accountEntity = encodeEntity({ id: "address" }, { id: account.address })
  let ratId = getComponentValue(network.components.CurrentRat, accountEntity)?.value

  if (!ratId) {
    const ratName = "rat"

    await network.waitForTransaction(
      await network.worldContract.write.ratfun__createRat([ratName], { account })
    )
    ratId = getComponentValueStrict(network.components.CurrentRat, accountEntity).value
  }

  return ratId as Hex
}
