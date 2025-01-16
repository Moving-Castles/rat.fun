export type EnterRoomBody = {
    signature: string;
    roomId: string;
    ratId: string;
}

export type Room = {
    prompt: string;
}

export type Rat = {
    prompt: string;
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