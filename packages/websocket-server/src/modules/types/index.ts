import type { Hex } from "viem"

/*
 * ─────────────────────────────────────────────
 * API Types
 * ─────────────────────────────────────────────
 */

export type SignedRequestInfo = {
  /**
   * Helps prevent replay attacks using a stale signature.
   * Also allows the server to not store old nonces permanently.
   */
  timestamp: number
  /**
   * Prevents short-term replay attacks within the timestamp window.
   */
  nonce: number
  /**
   * Delegator address, if signing was delegated to a session wallet.
   * Reuses MUD's delegation and `callFrom` logic.
   */
  calledFrom: Hex | null
}

export type SignedRequest<T> = {
  data: T
  info: SignedRequestInfo
  signature: Hex
}

/*
 * ─────────────────────────────────────────────
 * WebSocket Types
 * ─────────────────────────────────────────────
 */

export interface WebSocketParams {
  Params: {
    playerId: string
  }
}

export type OffChainMessage = {
  id: string
  topic:
    | "test"
    | "clients__update"
    | "chat__message"
    | "rat__deploy"
    | "rat__liquidate"
    | "rat__death"
    | "trip__creation"
    | "trip__liquidation"
    | "trip__outcome"
    | "key__activation"
  playerName?: string
  ratName?: string
  ratId?: string
  tripIndex?: number
  tripId?: string
  message?: string | string[]
  timestamp: number
  signature?: string
}

// For the message store
export type MessageDatabaseSchema = {
  messages: OffChainMessage[]
}

export type NonceDatabaseSchema = {
  nonces: Record<number, boolean>
}

export interface WebSocketInterface {
  send: (data: string) => void
}
