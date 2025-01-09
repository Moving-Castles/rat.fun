import type { Euler } from "three"

export type Client = {
  id: string
  address: string
}

export type ChatMessage = {
  id: string
  topic: string
  world: string
  timestamp: number
  address: string
  message: string
}

export type MessageObject = {
  topic: "broadcast" | "chat" | "verifiedClients"
  data: ChatMessage
  verifiedClients: Client[]
}

export type Object3DTransform = {
  position: [number, number, number]
  rotation: Euler
  scale: number | [number, number, number]
}

export type FalseOrTransform = false | Object3DTransform
