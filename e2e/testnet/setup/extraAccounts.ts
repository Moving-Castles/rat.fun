import fs from "node:fs/promises"
import { Account, etherUnits, Hex, nonceManager } from "viem"
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts"
import { setupSimpleNetwork, SetupSimpleNetworkReturnType } from "./setupSimpleNetwork"
import { extraAccountsFilePath, extraAccountsNumber } from "./constants"
import { approveMax } from "../utils/approveMax"

export async function initExtraAccount(network: SetupSimpleNetworkReturnType, playerName: string) {
  const privateKey = generatePrivateKey()
  const account = privateKeyToAccount(privateKey, { nonceManager })

  let tx: Hex
  // Fund account
  const sendEth = 0.001
  tx = await network.walletClient.sendTransaction({
    to: account.address,
    value: BigInt(sendEth * 10 ** etherUnits.wei)
  })
  await network.publicClient.waitForTransactionReceipt({ hash: tx, confirmations: 2 })

  const txPromises = Promise.all([
    // Give tokens
    network.worldContract.write.ratfun__giveCallerTokens([], { account }),
    // Approve max erc20
    approveMax(network, account),
    // Spawn player
    network.worldContract.write.ratfun__spawn([playerName], { account })
  ])

  return { privateKey, account, txPromises }
}

export async function setupExtraAccounts() {
  const network = setupSimpleNetwork()

  const extraAccounts: { privateKey: Hex; address: Hex }[] = []
  const promises: Promise<Hex[]>[] = []
  try {
    for (let i = 0; i < extraAccountsNumber; i++) {
      const { privateKey, account, txPromises } = await initExtraAccount(
        network,
        `extraAccount_${i}`
      )
      extraAccounts.push({
        privateKey,
        address: account.address
      })
      promises.push(txPromises)
    }
    // Wait for all transaction receipts
    const txs = (await Promise.all(promises)).flat()
    await Promise.all(txs.map(tx => network.publicClient.waitForTransactionReceipt({ hash: tx })))
  } finally {
    if (extraAccounts.length > 0) {
      await fs.writeFile(extraAccountsFilePath, JSON.stringify(extraAccounts))
    }
  }

  return extraAccounts
}

async function readExtraAccountsFile() {
  try {
    return await fs.readFile(extraAccountsFilePath, "utf-8")
  } catch (e: any) {
    if (e?.code === "ENOENT") {
      throw new Error(
        `File ${extraAccountsFilePath} not found, run 'pnpm run setup:extra-accounts'`
      )
    } else {
      throw e
    }
  }
}

export async function getExtraAccounts() {
  const result = JSON.parse(await readExtraAccountsFile()) as {
    privateKey: Hex
    account: Account
  }[]
  if (!result || result.length === 0) {
    throw new Error(
      `No extra accounts found in ${extraAccountsFilePath}, run 'pnpm run setup:extra-accounts'`
    )
  }
  return result.map(({ privateKey }) => privateKeyToAccount(privateKey, { nonceManager }))
}
