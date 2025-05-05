export interface WebSocketParams {
    Params: {
      playerId: string;
    };
  }
  
  export type OffChainMessage = {
    id: string;
    topic: "test" 
    | "clients__update" 
    | "chat__message"
    | "room__creation" 
    | "room__outcome" 
    | "room__liquidation"
    | "rat__deploy"
    | "rat__death" 
    | "rat__liquidate"
    playerName?: string;
    ratName?: string;
    roomIndex?: number;
    roomId?: string;
    message?: string | string[];
    timestamp: number;
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