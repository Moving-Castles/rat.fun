import { OutcomeReturnValue } from "@modules/llm/types";
import type { SystemCalls } from "@modules/mud/createSystemCalls";

export async function changeTraits(systemCalls: SystemCalls, outcome: OutcomeReturnValue, ratId: string, roomId: string) {
    for( let i = 0; i < outcome.traitChanges.length; i++) {
        const traitChange = outcome.traitChanges[i];
        if(traitChange.type === "add") {
            if(traitChange.name) {
                await systemCalls.addTrait(ratId, traitChange.name, traitChange.value);
                await systemCalls.changeRoomBalance(roomId, traitChange.value, true);
            }
        } else if(traitChange.type === "remove") {
            if(traitChange.id) {
                await systemCalls.removeTrait(ratId, traitChange.id);
            }
        }
    }
}

export async function addItems(systemCalls: SystemCalls, outcome: OutcomeReturnValue, playerId: string, roomId: string) {
    for( let i = 0; i < outcome.newItems.length; i++) {
        const newItem = outcome.newItems[i]; 
        await systemCalls.addItemToInventory(playerId, newItem.name, newItem.value);
        await systemCalls.changeRoomBalance(roomId, newItem.value, true);
    }
}

export async function changeStats(systemCalls: SystemCalls, outcome: OutcomeReturnValue, ratId: string, roomId: string) {
    Object.entries(outcome.statChanges).forEach(async ([statName, change]) => {
        if (change === 0) return;
        const changeIsNegative = change < 0;
        await systemCalls.changeStat(ratId, statName, Math.abs(change), changeIsNegative);
        if(statName === "health") {
            await systemCalls.changeRoomBalance(roomId, Math.abs(change), !changeIsNegative);
        }
    });
}

export async function transferBalance(systemCalls: SystemCalls, outcome: OutcomeReturnValue, playerId: string, roomId: string) {
    console.log('outcome.balanceTransfer:', outcome.balanceTransfer)
    if(!outcome.balanceTransfer) return;
    await systemCalls.transferBalanceToPlayer(roomId, playerId, outcome.balanceTransfer);
}