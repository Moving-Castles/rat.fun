import { OnchainData, Trait, Item } from "@routes/room/enter/types";
import { getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkReturnType } from "./setupNetwork";
import { Entity } from "@latticexyz/recs";

export function getOnchainData(network: SetupNetworkReturnType, components: ClientComponents, roomId: string, ratId: string): OnchainData {
    const roomEntity = network.world.registerEntity({ id: roomId });
    const ratEntity = network.world.registerEntity({ id: ratId });

    const { RoomPrompt, Dead, Traits, Owner, Health, Name, Balance, LoadOut } = components;

    // Room
    const roomPrompt = (getComponentValue(RoomPrompt, roomEntity)?.value  ?? "") as string;
    const roomBalance = (getComponentValue(Balance, roomEntity)?.value ?? 0) as number;

    // Rat
    const ratOwner = (getComponentValue(Owner, ratEntity)?.value ?? "") as string;
    const ratDead = (getComponentValue(Dead, ratEntity)?.value) as boolean;
    const ratHealth = getComponentValue(Health, ratEntity)?.value as number;
    const ratLoadOut = (getComponentValue(LoadOut, ratEntity)?.value ?? [""]) as string[];
    const ratTraits = (getComponentValue(Traits, ratEntity)?.value ?? [""]) as string[];

    const traitsObjects = constructTraitsObject(ratTraits, Name)
    const loadOutObjects = constructLoadOutObject(ratLoadOut, Name)

    const ratStats = {
        health: Number(ratHealth)
    };

    return {
        room: {
            prompt: roomPrompt,
            balance: Number(roomBalance),
        },
        rat: {
            traits: traitsObjects,
            loadOut: loadOutObjects,
            prompt: `Traits: ${toString(traitsObjects)}. Items: ${toString(loadOutObjects)}`,
            dead: ratDead,
            owner: ratOwner,
            stats: ratStats,
        }
    };
}

function constructTraitsObject(ratTraits: string[], Name: ClientComponents['Name']) {
    const traitsObject: Trait[] = []
    for(let i = 0; i < ratTraits.length; i++) {
        traitsObject.push(
            {
                id: ratTraits[i],
                name: (getComponentValue(Name, ratTraits[i] as Entity)?.value ?? "") as string
            }
        )
    }
    return traitsObject
}

function constructLoadOutObject(ratLoadOut: string[], Name: ClientComponents['Name']) {
    const loadOutObject: Item[] = []
    for(let i = 0; i < ratLoadOut.length; i++) {
        loadOutObject.push(
            {
                id: ratLoadOut[i],
                name: (getComponentValue(Name, ratLoadOut[i] as Entity)?.value ?? "") as string
            }
        )
    }
    return loadOutObject
}

function toString(obj: Trait[]) {
    return obj.map(o => o.name).join(', ')
}