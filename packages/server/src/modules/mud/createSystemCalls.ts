/*
 * Create the system calls that the client can use to ask
 * for changes in the World state (using the System contracts).
 */

import { OutcomeReturnValue } from "@modules/llm/types";
import { SetupNetworkResult } from "./setupNetwork";
import { Rat, Room } from "@routes/room/enter/types";
import { getOnchainData } from "./getOnchainData";

export type SystemCalls = ReturnType<typeof createSystemCalls>;

export function createSystemCalls(network: SetupNetworkResult) {

  const applyOutcome = async (rat: Rat, room: Room, outcome: OutcomeReturnValue) => {

    const tx = await network.worldContract.write.ratroom__applyOutcome([
      rat.id, // _ratId
      room.id, // _roomId
      outcome?.statChanges?.health ?? 0, // _healthChange
      outcome?.balanceTransfer ?? 0, // _balanceTransfer
      outcome?.traitChanges.filter(c => c.type === "remove").map(c => c.id) ?? [], // _traitsToRemoveFromRat
      outcome?.traitChanges.filter(c => c.type === "add").map(c => { return {name: c.name, value: c.value} }) ?? [], // _traitsToAddToRat
      outcome?.itemChanges.filter(c => c.type === "remove").map( c => c.id) ?? [], // _itemsToRemoveFromRat
      outcome?.itemChanges.filter(c => c.type === "add").map(c => { return {name: c.name, value: c.value} }) ?? [] // _traitsToAddToRat
    ]);
    
    await network.waitForTransaction(tx);

    const newOnChainData = getOnchainData(network, network.components, rat.id, room.id);

    return updateOutcome(outcome, rat, newOnChainData.rat);
  }

  return {
    applyOutcome
  };
}

function updateOutcome(oldOutcome: OutcomeReturnValue, oldRat: Rat, newRat: Rat): OutcomeReturnValue {
  const newOutcome = oldOutcome;

  // console.log('old outcome:', oldOutcome);
  // console.log('old rat:', oldRat);
  // console.log('new rat:', newRat);

  // - - - - - - - - -
  // ID
  // - - - - - - - - -

  newOutcome.id = newRat.id;

  // - - - - - - - - -
  // HEALTH
  // - - - - - - - - -

  newOutcome.statChanges.health = newRat.stats.health - oldRat.stats.health;

  // - - - - - - - - -
  // TRAITS
  // - - - - - - - - -
  
  newOutcome.traitChanges = [];

  // Iterate over traits in new rat and compare with old rat
  for(let i = 0; i < newRat.traits.length; i++) {
    // If trait is not in old rat, it was added
    if(!oldRat.traits.find(trait => trait.id === newRat.traits[i].id)) {
      newOutcome.traitChanges.push({ 
        type: "add", 
        name: newRat.traits[i].name,
        value: newRat.traits[i].value });
    }
  }

  // Iterate over traits in old rat and compare with new rat
  for(let i = 0; i < oldRat.traits.length; i++) {
    // If trait is not in new rat, it was removed
    if(!newRat.traits.find(trait => trait.id === oldRat.traits[i].id)) {
      newOutcome.traitChanges.push({ 
        type: "remove", 
        name: oldRat.traits[i].name,
        value: oldRat.traits[i].value });
    }
  }

  // - - - - - - - - -
  // ITEMS
  // - - - - - - - - -

  newOutcome.itemChanges = [];

  // Iterate over items in new rat and compare with old rat
  for(let i = 0; i < newRat.inventory.length; i++) {
    // If item is not in old rat, it was added
    if(!oldRat.inventory.find(item => item.id === newRat.inventory[i].id)) {
      newOutcome.itemChanges.push({ 
        type: "add", 
        name: newRat.inventory[i].name,
        value: newRat.inventory[i].value });
    }
  }

  // Iterate over items in old rat and compare with new rat
  for(let i = 0; i < oldRat.inventory.length; i++) {
    // If item is not in new rat, it was removed
    if(!newRat.inventory.find(item => item.id === oldRat.inventory[i].id)) {
      newOutcome.itemChanges.push({ 
        type: "remove", 
        name: oldRat.inventory[i].name,
        value: oldRat.inventory[i].value });
    }
  }

  // - - - - - - - - -
  // BALANCE
  // - - - - - - - - -

  newOutcome.balanceTransfer = newRat.balance - oldRat.balance;

  return newOutcome;
}
