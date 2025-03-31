export type CreateRoomBody = {
    signature: string;
    roomName: string;
    roomPrompt: string;
    roomLevel: number;
}

export type Room = {
    id: string,
    prompt: string;
    balance: number;
}