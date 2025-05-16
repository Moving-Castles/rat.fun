import { getComponentValue, Entity } from "@latticexyz/recs";
import { components } from "@modules/mud/initMud";

export function getRatId(playerId: string) {
    const { OwnedRat } = components;
    return (getComponentValue(OwnedRat, playerId as Entity)?.value ?? "unknown rat") as string;
}

export function getEntityIndex(id: string) {
    const { Index } = components;
    return (getComponentValue(Index, id as Entity)?.value ?? 0) as number;
}

export function getEntityLevel(id: string) {
    const { Level } = components;
    return (getComponentValue(Level, id as Entity)?.value ?? "unknown level") as string;
}

export function getEntityName(id: string) {
    const { Name } = components;
    return (getComponentValue(Name, id as Entity)?.value ?? "unknown entity") as string;
}