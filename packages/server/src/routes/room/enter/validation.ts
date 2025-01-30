import { Rat, Room } from "./types";

export function validateInputData(playerId: string, rat: Rat, room: Room) {
    // Check that sender owns the rat
    if (rat.owner !== playerId) {
        throw new Error('You are not the owner of the rat.');
    } 
    
    // Check that the rat is alive
    if (rat.dead) {
        throw new Error('The rat is dead.');
    }

    // Check that room balance is positive
    if (room.balance <= 0) {
        throw new Error('The room balance is not positive.');
    }
}