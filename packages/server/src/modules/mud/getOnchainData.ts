import { OnchainData } from "@routes/room/enter/types";
import { getComponentValue } from "@latticexyz/recs";
import { ClientComponents } from "./createClientComponents";
import { SetupNetworkReturnType } from "./setupNetwork";

export function getOnchainData(network: SetupNetworkReturnType, components: ClientComponents, roomId: string, ratId: string): OnchainData {
    const roomEntity = network.world.registerEntity({ id: roomId });
    const ratEntity = network.world.registerEntity({ id: ratId });

    const { RoomPrompt, Dead, Trait, Owner, Health, Level } = components;

    const roomPrompt = (getComponentValue(RoomPrompt, roomEntity)?.value  ?? "") as string;
    const ratPrompt= (getComponentValue(Trait, ratEntity)?.value ?? "") as string;

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
            prompt: ratPrompt,
            dead: ratDead,
            owner: ratOwner,
            stats: ratStats,
        }
    };
}