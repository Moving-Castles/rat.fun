export type EnterRoomBody = {
    signature: string;
    roomId: string;
    ratId: string;
}

export type Room = {
    prompt: string;
    balance: number;
}

export type Trait = {
    id: string,
    name: string
}

export type Rat = {
    prompt: string;
    traits: Trait[];
    dead: boolean;
    owner: string;
    stats: {
        health: number;
        level: number;
    }
}
export type OnchainData = {
    room: Room;
    rat: Rat;
}