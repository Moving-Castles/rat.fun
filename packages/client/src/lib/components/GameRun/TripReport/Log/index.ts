import type { EnterTripReturnValue } from "@server/modules/types"
import type { MergedLogEntry } from "$lib/components/GameRun/types"

/***
 * Merges log text and outcomes into a single array
 */
export function mergeLog(result: EnterTripReturnValue): MergedLogEntry[] {
  // Deep clone the log
  const mergedLog: MergedLogEntry[] = JSON.parse(JSON.stringify(result.log))

  for (let i = 0; i < mergedLog.length; i++) {
    // Balance transfers
    const balanceTransfersOnLogStep = result.balanceTransfers.filter(
      bT => bT.logStep === i && bT.amount !== 0
    )

    if (balanceTransfersOnLogStep.length > 0) {
      // Convert array to single object with summed amount
      const totalAmount = balanceTransfersOnLogStep.reduce(
        (sum, transfer) => sum + transfer.amount,
        0
      )
      mergedLog[i].balanceTransfer = {
        logStep: i,
        amount: totalAmount
      }
    }

    // Item changes
    const itemChanges = (result?.itemChanges || []).filter(iC => iC.logStep === i)
    if (itemChanges.length > 0) {
      mergedLog[i].itemChanges = itemChanges
    }
  }

  return mergedLog
}
