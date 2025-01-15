export type Message = {
    role: 'system' | 'user' | 'function';
    content: string;
    name?: string; // Optional name property
}

export type Outcome = {
    eventLog: string[],
    change: string,
    success: boolean
};

export type Changes = Record<string, number>;

export type EnterRoomBody = {
    signature: string;
    roomId: string;
    ratId: string;
}