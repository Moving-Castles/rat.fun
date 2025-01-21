import { OutcomeReturnValue } from "@modules/llm/types";
import type { SystemCalls } from "@modules/mud/createSystemCalls";

export async function changeTraits(systemCalls: SystemCalls, outcome: OutcomeReturnValue, ratId: string, roomId: string) {
    for( let i = 0; i < outcome.traitChanges.length; i++) {
        const traitChange = outcome.traitChanges[i];
        if(traitChange.type === "add") {
            // Add the trait to the rat
            systemCalls.addTrait(ratId, traitChange.name ?? "", traitChange.value);
            // Change room balance
            if(traitChange.value > 0) {
                // If the trait has a positive value, decrease the room balance
                systemCalls.decreaseRoomBalance(roomId, Math.abs(traitChange.value));
            } else {
                // If the trait has a negative value, increase the room balance
                systemCalls.increaseRoomBalance(roomId, Math.abs(traitChange.value));
            }
        } else if(traitChange.type === "remove") {
            // TODO: deal with costs of removal / update of traits
            systemCalls.removeTrait(ratId, traitChange.id ?? "");
            if(traitChange.value > 0) {
                // If the trait has a positive value, increase the room balance
                systemCalls.increaseRoomBalance(roomId, Math.abs(traitChange.value));
            } else {
                // If the trait has a negative value, decrease the room balance
                systemCalls.decreaseRoomBalance(roomId, Math.abs(traitChange.value));
            }
        }
    }
}

export async function addItems(systemCalls: SystemCalls, outcome: OutcomeReturnValue, playerId: string, roomId: string) {
    for( let i = 0; i < outcome.newItems.length; i++) {
        const newItem = outcome.newItems[i]; 
        // Give item to player
        systemCalls.addItemToInventory(playerId, newItem.name, Math.abs(newItem.value));
        // Value of an item is always positive so we decrease room balance
        systemCalls.decreaseRoomBalance(roomId, Math.abs(newItem.value));
    }
}

export async function changeStats(systemCalls: SystemCalls, outcome: OutcomeReturnValue, ratId: string, roomId: string) {
    Object.entries(outcome.statChanges).forEach(async ([statName, change]) => {
        if (change === 0) return;
        if(statName === "health") {
            if(change > 0) {
                systemCalls.increaseHealth(ratId, change);
                // For each point of health added to rat, reduce room blance by two credits
                systemCalls.decreaseRoomBalance(roomId, change * 2);
            } else {
                systemCalls.decreaseHealth(ratId, Math.abs(change));
                // For each point of health removed from rat, increase room balance by two credits
                systemCalls.increaseRoomBalance(roomId, Math.abs(change) * 2);
            }
        }
    });
}

export async function transferBalance(systemCalls: SystemCalls, outcome: OutcomeReturnValue, playerId: string, roomId: string) {
    console.log('outcome.balanceTransfer:', outcome.balanceTransfer)
    if(!outcome.balanceTransfer) return;
    systemCalls.transferBalanceToPlayer(roomId, playerId, outcome.balanceTransfer);
}