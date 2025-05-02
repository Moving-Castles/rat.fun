import type { OnchainData, Trait, Item } from "@routes/room/enter/types";
import type { ClientComponents } from "./createClientComponents";
import type { SetupNetworkReturnType } from "./setupNetwork";
import { getComponentValue, Entity } from "@latticexyz/recs";

// Custom error classes for better error handling
export class OnchainDataError extends Error {
  constructor(message: string, public code: string = 'ONCHAIN_DATA_ERROR') {
    super(message);
    this.name = 'OnchainDataError';
  }
}

export class RatNotFoundError extends OnchainDataError {
  constructor(ratId: string) {
    super(`Rat with ID ${ratId} not found`, 'RAT_NOT_FOUND');
    this.name = 'RatNotFoundError';
  }
}

export class RoomNotFoundError extends OnchainDataError {
  constructor(roomId: string) {
    super(`Room with ID ${roomId} not found`, 'ROOM_NOT_FOUND');
    this.name = 'RoomNotFoundError';
  }
}

export function getOnchainData(network: SetupNetworkReturnType, components: ClientComponents, ratId: string, roomId: string | undefined = undefined): OnchainData {
    try {
        if (!ratId) {
            throw new OnchainDataError('Rat ID is required');
        }

        const ratEntity = network.world.registerEntity({ id: ratId });
        
        // Check if rat exists
        const { Owner, Name } = components;
        const ratOwner = getComponentValue(Owner, ratEntity)?.value;
        const ratName = getComponentValue(Name, ratEntity)?.value;
        
        if (!ratOwner && !ratName) {
            throw new RatNotFoundError(ratId);
        }

        const { RoomPrompt, Dead, Traits, Health, Balance, Inventory, Value, Index } = components;

        // Rat
        const ratOwnerValue = (ratOwner ?? "") as string;
        const ratNameValue = (ratName ?? "") as string;
        const ratDead = (getComponentValue(Dead, ratEntity)?.value ?? false) as boolean;
        const ratHealth = (getComponentValue(Health, ratEntity)?.value ?? 0) as number;
        const ratBalance = (getComponentValue(Balance, ratEntity)?.value ?? 0) as number;
        const ratInventory = (getComponentValue(Inventory, ratEntity)?.value ?? [""]) as string[];
        const ratTraits = (getComponentValue(Traits, ratEntity)?.value ?? [""]) as string[];

        const traitsObjects = constructTraitsObject(ratTraits, Name, Value);
        const inventoryObjects = constructInventoryObject(ratInventory, Name, Value);

        const ratStats = {
            health: Number(ratHealth)
        };

        const rat = {
            id: ratId,
            name: ratNameValue,
            traits: traitsObjects,
            balance: Number(ratBalance),
            inventory: inventoryObjects,
            dead: ratDead,
            owner: ratOwnerValue,
            stats: ratStats,
        };

        if (!roomId) {
            return { rat };
        }

        // Room
        const roomEntity = network.world.registerEntity({ id: roomId });
        
        // Check if room exists
        const roomName = getComponentValue(Name, roomEntity)?.value;
        const roomPrompt = getComponentValue(RoomPrompt, roomEntity)?.value;
        const roomIndex = (getComponentValue(Index, roomEntity)?.value ?? 0) as number;
        
        if (!roomName && !roomPrompt) {
            throw new RoomNotFoundError(roomId);
        }
        
        const roomNameValue = (roomName ?? "") as string;
        const roomPromptValue = (roomPrompt ?? "") as string;
        const roomBalance = (getComponentValue(Balance, roomEntity)?.value ?? 0) as number;

        const room = {
            id: roomId,
            name: roomNameValue,
            prompt: roomPromptValue,
            balance: Number(roomBalance),
            index: roomIndex
        };

        return { rat, room };
    } catch (error) {
        // If it's already one of our custom errors, rethrow it
        if (error instanceof OnchainDataError) {
            throw error;
        }
        
        // Otherwise, wrap it in our custom error
        throw new OnchainDataError(`Error fetching onchain data: ${error instanceof Error ? error.message : String(error)}`);
    }
}

function constructTraitsObject(ratTraits: string[], Name: ClientComponents['Name'], Value: ClientComponents['Value']) {
    const traitsObject: Trait[] = [];
    for (let i = 0; i < ratTraits.length; i++) {
        if (!ratTraits[i]) continue;
        traitsObject.push(
            {
                id: ratTraits[i],
                name: (getComponentValue(Name, ratTraits[i] as Entity)?.value ?? "") as string,
                value: Number(getComponentValue(Value, ratTraits[i] as Entity)?.value ?? 0) as number
            }
        );
    }
    return traitsObject;
}

function constructInventoryObject(ratInventory: string[], Name: ClientComponents['Name'], Value: ClientComponents['Value']) {
    const inventoryObject: Item[] = [];
    for (let i = 0; i < ratInventory.length; i++) {
        if (!ratInventory[i]) continue;
        inventoryObject.push(
            {
                id: ratInventory[i],
                name: (getComponentValue(Name, ratInventory[i] as Entity)?.value ?? "") as string,
                value: Number(getComponentValue(Value, ratInventory[i] as Entity)?.value ?? 0) as number
            }
        );
    }
    return inventoryObject;
}

export function getPlayerName(playerId: string, Name: ClientComponents['Name']) {
    return (getComponentValue(Name, playerId as Entity)?.value ?? "unknown player") as string;
}

export function getRatId(playerId: string, OwnedRat: ClientComponents['OwnedRat']) {
    return (getComponentValue(OwnedRat, playerId as Entity)?.value ?? "unknown rat") as string;
}

export function getRatName(ratId: string, Name: ClientComponents['Name']) {
    return (getComponentValue(Name, ratId as Entity)?.value ?? "unknown rat") as string;
}