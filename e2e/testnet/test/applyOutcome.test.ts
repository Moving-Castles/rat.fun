import { Hex, PrivateKeyAccount } from "viem"
import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { Entity, getComponentValue } from "@latticexyz/recs"
import { SetupNetworkReturnType } from "server/internal"
import { getExtraAccounts } from "../setup/extraAccounts"
import { initMud } from "../setup/initMud"
import { spawnOrGetRoom } from "../utils/spawnOrGetRoom"
import { spawnOrGetRat } from "../utils/spawnOrGetRat"

async function applyOutcome(
  network: SetupNetworkReturnType,
  roomId: Hex,
  ratId: Hex,
  balanceTransfer: bigint
) {
  const tx = await network.worldContract.write.ratfun__applyOutcome([
    ratId,
    roomId,
    balanceTransfer,
    [],
    []
  ])
  return {
    ratId,
    receipt: await network.waitForTransaction(tx)
  }
}

function getBalance(network: SetupNetworkReturnType, entity: Entity) {
  return getComponentValue(network.components.Balance, entity)?.value ?? 0n
}

function getVisitCount(network: SetupNetworkReturnType, roomId: Hex) {
  return getComponentValue(network.components.VisitCount, roomId)?.value ?? 0n
}

describe("testnet network", () => {
  let network: SetupNetworkReturnType
  let extraAccounts: PrivateKeyAccount[]

  let roomId: Hex
  let rats: Hex[]

  beforeAll(async () => {
    network = await initMud()
    extraAccounts = await getExtraAccounts()

    roomId = await spawnOrGetRoom(network)
    rats = await Promise.all(
      extraAccounts.map(extraAccount => spawnOrGetRat(network, extraAccount))
    )
  })

  afterAll(async () => {
    network.world.dispose()
  })

  it("world address is correct", async () => {
    const worldAddress = network.worldContract.address
    const bytecode = await network.publicClient.getCode({
      address: worldAddress
    })
    expect(bytecode?.length).toBeGreaterThan(0)
  })

  it("handles multiple outcomes asynchronously", async () => {
    const admin = network.walletClient.account
    if (!admin) {
      throw new Error("Admin account not found")
    }

    const ratBalancesStart = rats.map(ratId => getBalance(network, ratId))
    const visitCountStart = getVisitCount(network, roomId)

    let results = await Promise.all(rats.map(ratId => applyOutcome(network, roomId, ratId, 1n)))
    for (const result of results) {
      if (result.receipt.status === "reverted") {
        console.log("caught revert", 1, result.ratId)
        await applyOutcome(network, roomId, result.ratId, 1n)
      }
    }

    const ratBalancesIncreased = rats.map(ratId => getBalance(network, ratId))
    expect(getVisitCount(network, roomId)).toEqual(visitCountStart + BigInt(extraAccounts.length))
    expect(ratBalancesIncreased).toEqual(ratBalancesStart.map(b => b + 1n))

    results = await Promise.all(rats.map(ratId => applyOutcome(network, roomId, ratId, -1n)))
    for (const result of results) {
      if (result.receipt.status === "reverted") {
        console.log("caught revert", -1, result.ratId)
        await applyOutcome(network, roomId, result.ratId, -1n)
      }
    }

    const ratBalancesEnd = rats.map(ratId => getBalance(network, ratId))
    expect(getVisitCount(network, roomId)).toEqual(
      visitCountStart + 2n * BigInt(extraAccounts.length)
    )
    expect(ratBalancesEnd).toEqual(ratBalancesStart)
  })
})
