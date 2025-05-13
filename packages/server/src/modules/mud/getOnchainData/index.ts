import { getComponentValue, Entity } from "@latticexyz/recs";
import { components } from "@modules/mud/initMud";

export function getRoomIndex(roomId: string) {
    const { Index } = components;
    return (getComponentValue(Index, roomId as Entity)?.value ?? 0) as number;
}

export function getPlayerName(playerId: string) {
    const { Name } = components;
    return (getComponentValue(Name, playerId as Entity)?.value ?? "unknown player") as string;
}

export function getRatId(playerId: string) {
    const { OwnedRat } = components;
    return (getComponentValue(OwnedRat, playerId as Entity)?.value ?? "unknown rat") as string;
}

export function getRatName(ratId: string) {
    const { Name } = components;
    return (getComponentValue(Name, ratId as Entity)?.value ?? "unknown rat") as string;
}