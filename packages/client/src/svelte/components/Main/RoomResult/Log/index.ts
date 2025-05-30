import type { EnterRoomReturnValue } from "@server/modules/types"
import { MergedLogEntry } from "./types"

export function mergeLog(result: EnterRoomReturnValue): MergedLogEntry[] {

    // Deep clone the log
    const mergedLog: MergedLogEntry[] = JSON.parse(JSON.stringify(result.log))

    for(let i = 0; i < mergedLog.length; i++) {
        // Health change
        if(result.healthChange.logStep === i && result.healthChange.amount !== 0) {
            mergedLog[i].healthChange = result.healthChange
        }

        // Balance transfer
        if(result.balanceTransfer.logStep === i && result.balanceTransfer.amount !== 0) {
            mergedLog[i].balanceTransfer = result.balanceTransfer
        }

        // Trait changes
        const traitChanges = result.traitChanges.filter(tC => tC.logStep === i)
        if(traitChanges.length > 0) {
            mergedLog[i].traitChanges = traitChanges
        }

        // Item changes
        const itemChanges = result.itemChanges.filter(iC => iC.logStep === i)
        if(itemChanges.length > 0) {
            mergedLog[i].itemChanges = itemChanges
        }
    }

  return mergedLog
}