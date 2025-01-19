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

export type Item = {
    id: string,
    name: string
}

export type Rat = {
    prompt: string;
    traits: Trait[];
    loadOut: Item[];
    dead: boolean;
    owner: string;
    stats: {
        health: number;
    }
}

export type OnchainData = {
    room: Room;
    rat: Rat;
}