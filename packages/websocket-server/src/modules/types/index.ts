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
   * Note: Delegation is trusted without on-chain verification in this server.
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
  Querystring: {
    data: string
    info: string
    signature: string
  }
}

export type ClientsUpdateMessage = {
  id: string
  topic: "clients__update"
  message: string[]
  timestamp: number
}

export type ChatBroadcastMessage = {
  id: string
  topic: "chat__message"
  playerId: string
  playerName: string
  content: string
  timestamp: number
}

export type ChatHistoryMessage = {
  id: string
  topic: "chat__history"
  messages: Omit<ChatBroadcastMessage, "topic">[]
  timestamp: number
}

export type ErrorMessage = {
  topic: "error"
  code: string
  message: string
  timestamp: number
}

export type ServerMessage =
  | ClientsUpdateMessage
  | ChatBroadcastMessage
  | ChatHistoryMessage
  | ErrorMessage

export interface WebSocketInterface {
  send: (data: string) => void
}
