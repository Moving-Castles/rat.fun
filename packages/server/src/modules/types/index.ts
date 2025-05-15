import { TableRecord } from "@latticexyz/store-sync";
import mudConfig from "contracts/mud.config";

export type Room = {
    id: string,
    level: string,
    prompt: string;
    balance: number;
    index: number;
}

export type Rat = {
    id: string,
    name: string,
    level: string,
    balance: number;
    traits: Trait[];
    inventory: Item[];
    dead: boolean;
    owner: string;
    stats: {
        health: number;
    }
}

export type Player = {
    id: string;
    name: string;
    balance: number;
    visitedLevels: string[];
}

export type Level = {
    id: string,
    name: string,
    prompt: string
    index: number,
    minBalance: number,
    maxBalance: number,
    roomCreationCost: number,
}

export type MinimalLevel = Pick<Level, 'id' | 'roomCreationCost'>

export type Trait = {
    id: string,
    name: string,
    value: number
}

export type Item = {
    id: string,
    name: string,
    value: number
}

export type GameConfig = TableRecord<typeof mudConfig.tables.ratroom__GameConfig>["fields"]

export type EnterRoomData = {
    gameConfig: GameConfig;
    rat: Rat;
    level: Level;
    player?: Player;
    room?: Room;
}

export type CreateRoomData = {
    gameConfig: GameConfig;
    level: MinimalLevel,
    player: Player;
}