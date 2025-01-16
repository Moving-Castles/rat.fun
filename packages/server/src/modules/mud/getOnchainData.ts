import { OnchainData, Trait } from "@routes/room/enter/types";
import { getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkReturnType } from "./setupNetwork";
import { Entity } from "@latticexyz/recs";

export function getOnchainData(network: SetupNetworkReturnType, components: ClientComponents, roomId: string, ratId: string): OnchainData {
    const roomEntity = network.world.registerEntity({ id: roomId });
    const ratEntity = network.world.registerEntity({ id: ratId });

    const { RoomPrompt, Dead, Traits, Owner, Health, Level, Name } = components;

    const roomPrompt = (getComponentValue(RoomPrompt, roomEntity)?.value  ?? "") as string;
    const ratTraits = (getComponentValue(Traits, ratEntity)?.value ?? "") as string[];

    const traitsObjects = constructTraitsObject(ratTraits, Name)

    const ratOwner = (getComponentValue(Owner, ratEntity)?.value ?? "") as string;
    const ratDead = (getComponentValue(Dead, ratEntity)?.value) as boolean;
    const ratHealth = getComponentValue(Health, ratEntity)?.value as number;
    const ratLevel = getComponentValue(Level, ratEntity)?.value as number;

    const ratStats = {
        health: Number(ratHealth),
        level: Number(ratLevel),
    };

    return {
        room: {
            prompt: roomPrompt,
        },
        rat: {
            prompt: traitsToString(traitsObjects),
            traits: traitsObjects,
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

function traitsToString(traitsObject: Trait[]) {
    return traitsObject.map(trait => trait.name).join(', ')
}