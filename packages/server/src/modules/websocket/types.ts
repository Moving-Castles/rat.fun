export interface WebSocketParams {
    Params: {
      playerId: string;
    };
  }
  
  export type OffChainMessage = {
    topic: "test" | "clients__update" | "room__creation" | "room__outcome" | "rat__death" | "chat__message";
    playerName?: string;
    message: string | string[];
    timestamp?: number;
    signature?: string;
  }

export class WebSocketError extends Error {
  constructor(
    message: string,
    public code: string
  ) {
    super(message);
    this.name = 'WebSocketError';
  }
}