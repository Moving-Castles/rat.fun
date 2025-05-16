import { Rat, Room, Player } from "@modules/types";

export function validateInputData(player: Player, rat: Rat, room: Room) {
    // Check that sender owns the rat
    if (rat.owner !== player.id) {
        throw new Error('You are not the owner of the rat.');
    } 
    
    // Check that the rat is alive
    if (rat.dead) {
        throw new Error('The rat is dead.');
    }

    // Check that rat and room level are the same
    if (rat.level !== room.level) {
        throw new Error('The rat and room level are different.');
    }

    // Check that room balance is positive
    if (room.balance == 0) {
        throw new Error('The room balance is negative.');
    }
}