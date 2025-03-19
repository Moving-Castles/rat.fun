export type EnterRoomBody = {
    signature: string;
    roomId: string;
    ratId: string;
}

export type Room = {
    id: string,
    prompt: string;
    balance: number;
}

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

export type Rat = {
    id: string,
    name: string,
    balance: number;
    traits: Trait[];
    inventory: Item[];
    dead: boolean;
    owner: string;
    stats: {
        health: number;
    }
}

export type OnchainData = {
    rat: Rat;
    room?: Room;
}