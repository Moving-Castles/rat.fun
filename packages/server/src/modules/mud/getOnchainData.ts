import { OnchainData, Trait, Item } from "@routes/room/enter/types";
import { getComponentValue, Entity } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkReturnType } from "./setupNetwork";

export function getOnchainData(network: SetupNetworkReturnType, components: ClientComponents, ratId: string, roomId: string | undefined = undefined): OnchainData {
    const roomEntity = network.world.registerEntity({ id: roomId });
    const ratEntity = network.world.registerEntity({ id: ratId });

    const { RoomPrompt, Dead, Traits, Owner, Health, Name, Balance, Inventory, Value } = components;

    // Rat
    const ratOwner = (getComponentValue(Owner, ratEntity)?.value ?? "") as string;
    const ratName = (getComponentValue(Name, ratEntity)?.value ?? "") as string;
    const ratDead = (getComponentValue(Dead, ratEntity)?.value ??  false) as boolean;
    const ratHealth = (getComponentValue(Health, ratEntity)?.value ?? 0) as number;
    const ratBalance = (getComponentValue(Balance, ratEntity)?.value ?? 0) as number;
    const ratInventory = (getComponentValue(Inventory, ratEntity)?.value ?? [""]) as string[];
    const ratTraits = (getComponentValue(Traits, ratEntity)?.value ?? [""]) as string[];

    const traitsObjects = constructTraitsObject(ratTraits, Name, Value)
    const inventoryObjects = constructInventoryObject(ratInventory, Name, Value)

    const ratStats = {
        health: Number(ratHealth)
    };

    const rat = {
        id: ratId,
        name: ratName,
        traits: traitsObjects,
        balance: Number(ratBalance),
        inventory: inventoryObjects,
        dead: ratDead,
        owner: ratOwner,
        stats: ratStats,
    }

    if(!roomId) {
        return { rat }
    }

    // Room
    const roomPrompt = (getComponentValue(RoomPrompt, roomEntity)?.value  ?? "") as string;
    const roomBalance = (getComponentValue(Balance, roomEntity)?.value ?? 0) as number;

    const room = {
        id: roomId,
        prompt: roomPrompt,
        balance: Number(roomBalance)
    }

    return { rat, room};
}

function constructTraitsObject(ratTraits: string[], Name: ClientComponents['Name'], Value: ClientComponents['Value']) {
    const traitsObject: Trait[] = []
    for(let i = 0; i < ratTraits.length; i++) {
        if(!ratTraits[i]) continue
        traitsObject.push(
            {
                id: ratTraits[i],
                name: (getComponentValue(Name, ratTraits[i] as Entity)?.value ?? "") as string,
                value: Number(getComponentValue(Value, ratTraits[i] as Entity)?.value ?? 0) as number
            }
        )
    }
    return traitsObject
}

function constructInventoryObject(ratInventory: string[], Name: ClientComponents['Name'], Value: ClientComponents['Value']) {
    const inventoryObject: Item[] = []
    for(let i = 0; i < ratInventory.length; i++) {
        if(!ratInventory[i]) continue
        inventoryObject.push(
            {
                id: ratInventory[i],
                name: (getComponentValue(Name, ratInventory[i] as Entity)?.value ?? "") as string,
                value: Number(getComponentValue(Value, ratInventory[i] as Entity)?.value ?? 0) as number
            }
        )
    }
    return inventoryObject
}

export function getRatName(ratId: string, Name: ClientComponents['Name']) {
    return (getComponentValue(Name, ratId as Entity)?.value ?? "unknown rat") as string;
}