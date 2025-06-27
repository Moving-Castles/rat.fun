/*
 *  The action sequencer is responsible for sending transactions
 *  to the blockchain, one at a time.
 *
 */

import type { Writable } from "svelte/store"
import { writable, get } from "svelte/store"
import { transactionQueue } from "@latticexyz/common/actions"
import { store as accountKitStore } from "@latticexyz/account-kit/bundle"
import { publicNetwork, walletNetwork, blockNumber } from "$lib/modules/network"
import { v4 as uuid } from "uuid"
import { erc20Abi } from "viem"
import { addChain, switchChain } from "viem/actions"
import {
  clearActionTimer,
  startActionTimer
} from "$lib/modules/action/actionSequencer/timeoutHandler"
import { gameConfig } from "$lib/modules/state/base/stores"
import { WorldFunctions } from ".."
import { getChain } from "$lib/mud/utils"

// --- TYPES -----------------------------------------------------------------

export enum SequencerState {
  Running,
  Paused
}

export type Action = {
  actionId: string
  systemId: string
  params: string[]
  useUserAccount: boolean
  tx?: string
  timestamp?: number
  completed: boolean
  error: any
}

// --- STORES -----------------------------------------------------------------

export const sequencerState = writable(SequencerState.Running)
export const queuedActions = writable([] as Action[])
export const activeActions = writable([] as Action[])
export const completedActions = writable([] as Action[])
export const failedActions = writable([] as Action[])

// --- API -----------------------------------------------------------------

/**
 *
 * @param systemId
 * @param params
 * @returns action
 */
export function addToSequencer(
  systemId: string,
  params: any[] = [],
  useUserAccount: boolean = false
) {
  const newAction: Action = {
    actionId: uuid(),
    systemId: systemId,
    params: params || [],
    useUserAccount,
    completed: false,
    error: undefined
  }

  queuedActions.update(queuedActions => {
    return [...queuedActions, newAction]
  })

  // Display error message if action does not complete in 15 seconds
  // Unless it must be signed via the user's wallet, which has its own UI and can take arbitrarily long
  if (!useUserAccount) {
    startActionTimer()
  }

  return newAction
}

export function removeFromSequencer(id: string) {
  queuedActions.update(queuedActions => queuedActions.filter(a => a.actionId !== id))
}

export function clearSequencer() {
  queuedActions.update(() => [])
}

// --- SEQUENCER -----------------------------------------------------------------

export function initActionSequencer() {
  /*
   *   The sequencer triggers on each block
   *   If the conditions are met it executes the next action
   *   To be notified of the action being executed we listen to calls to all systems
   *
   */

  blockNumber.subscribe(async () => {
    /*
     * Execute next if:
     * - sequencer is running
     * - there are no active action
     * - queue is not empty
     */
    if (
      get(sequencerState) === SequencerState.Running &&
      get(activeActions).length === 0 &&
      get(queuedActions).length > 0
    ) {
      execute()
    }
  })
}

async function prepareUserAccountClient() {
  const userAccountClient = accountKitStore.getState().userAccountClient
  if (!userAccountClient) {
    throw new Error("User account client is not available")
  }
  // User's wallet may switch between different chains, ensure the current chain is correct
  const expectedChainId = get(publicNetwork).config.chain.id
  if (userAccountClient.chain.id !== expectedChainId) {
    try {
      await switchChain(userAccountClient, { id: expectedChainId })
    } catch (e) {
      await addChain(userAccountClient, { chain: getChain(expectedChainId) })
      await switchChain(userAccountClient, { id: expectedChainId })
    }
  }
  // MUD's `transactionQueue` extends the client with `writeContract` method
  return userAccountClient.extend(transactionQueue({}))
}

async function execute() {
  const action = get(queuedActions)[0]

  // console.log('executing', action)

  try {
    // Remove action from queue list
    queuedActions.update(queuedActions => queuedActions.slice(1))
    // Add action to active list
    activeActions.update(activeActions => [action, ...activeActions])
    // Prepare the action's client
    const client = action.useUserAccount
      ? await prepareUserAccountClient()
      : get(walletNetwork).walletClient
    // Make the call
    let tx
    if (action.systemId === WorldFunctions.Approve) {
      tx = await client.writeContract({
        address: get(gameConfig).externalAddressesConfig.erc20Address,
        abi: erc20Abi,
        functionName: "approve",
        args: action.params,
        gas: 5000000n // TODO: Added to fix gas estimation. Change this.
      })
    } else {
      tx = await client.writeContract({
        address: get(walletNetwork).worldContract.address,
        abi: get(walletNetwork).worldContract.abi,
        functionName: action.systemId,
        args: action.params,
        gas: 5000000n // TODO: Added to fix gas estimation. Change this.
      })
    }

    console.log("tx", tx)

    // const tx = await get(walletNetwork).worldContract.write[action.systemId]([
    //   ...action.params
    // ])
    // Transaction sent. Add tx hash and timestamp to action.
    activeActions.update(activeActions => {
      activeActions[0].tx = tx
      activeActions[0].timestamp = Date.now()
      return activeActions
    })

    // Wait for transaction to be executed
    const receipt = await get(publicNetwork).publicClient.waitForTransactionReceipt({
      hash: tx
    })

    console.log("receipt", receipt)

    if (receipt) {
      if (receipt.status == "success") {
        // Set to completed
        action.completed = true

        // Add action to completed list
        completedActions.update(completedActions => [action, ...completedActions])
        // Clear active list
        activeActions.update(() => [])
        // Clear action timeout
        clearActionTimer()
      } else {
        handleError(receipt, action)
      }
    } else {
      clearActionTimer()
    }
  } catch (e) {
    handleError(e, action)
  }
}

function handleError(error: any, action: Action) {
  console.log("error", error, action)

  // Update action status
  action.error = error
  // Trigger toast
  // toastMessage(parseError(error), { type: "error", disappear: true })
  // Add action to failed list
  failedActions.update(failedActions => [action, ...failedActions])
  // Clear active list
  activeActions.update(() => [])
  // Clear action timeout
  clearActionTimer()
}

export const waitingTransaction: Writable<Action | null> = writable(null)
