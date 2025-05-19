/*
 *  The action sequencer is responsible for sending transactions
 *  to the blockchain, one at a time.
 *
 */

import type { Writable } from "svelte/store"
import { writable, get } from "svelte/store"
import { publicNetwork, walletNetwork, blockNumber } from "@modules/network"
// import { toastMessage } from "../../ui/toast"
// import { parseError } from "@components/Main/Terminal/functions/errors"
import { v4 as uuid } from "uuid"
import { clearActionTimer, startActionTimer } from "@modules/action/actionSequencer/timeoutHandler"

// --- TYPES -----------------------------------------------------------------

export enum SequencerState {
  Running,
  Paused,
}

export type Action = {
  actionId: string
  systemId: string
  params: string[]
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
export function addToSequencer(systemId: string, params: any[] = []) {
  const newAction: Action = {
    actionId: uuid(),
    systemId: systemId,
    params: params || [],
    completed: false,
    error: undefined,
  }

  queuedActions.update(queuedActions => {
    return [...queuedActions, newAction]
  })

  // Display error message if action does not complete in 15 seconds
  startActionTimer()

  return newAction
}

export function removeFromSequencer(id: string) {
  queuedActions.update(queuedActions =>
    queuedActions.filter(a => a.actionId !== id)
  )
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

async function execute() {
  const action = get(queuedActions)[0]

  // console.log('executing', action)

  try {
    // Remove action from queue list
    queuedActions.update(queuedActions => queuedActions.slice(1))
    // Add action to active list
    activeActions.update(activeActions => [action, ...activeActions])
    // Make the call
    const tx = await get(walletNetwork).walletClient.writeContract({
      address: get(walletNetwork).worldContract.address,
      abi: get(walletNetwork).worldContract.abi,
      functionName: action.systemId,
      args: action.params,
      gas: 5000000n, // TODO: Added to fix gas estimation. Change this.
    })

    console.log('tx', tx)
    
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
      hash: tx,
    })

    console.log('receipt', receipt)

    if (receipt) {
      if (receipt.status == "success") {
        // Set to completed
        action.completed = true

        // Add action to completed list
        completedActions.update(completedActions => [
          action,
          ...completedActions,
        ])
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

  console.log('error', error, action)

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
