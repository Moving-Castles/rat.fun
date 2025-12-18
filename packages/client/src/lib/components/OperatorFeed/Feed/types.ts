export enum FEED_MESSAGE_TYPE {
  CHAT = "chat",
  NEW_TRIP = "new_trip",
  NEW_OUTCOME = "new_outcome"
}

export type BaseFeedMessage = {
  id: string
  timestamp: number
  type: FEED_MESSAGE_TYPE
}

export type ChatMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.CHAT
  playerId: string
  playerName: string
  content: string
}

export type NewTripMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.NEW_TRIP
  tripId: string
  tripIndex: number
  tripPrompt: string
  creatorName: string
  tripCreationCost: number
}

// Item info for outcome messages
export type FeedItem = {
  id: string
  name: string
  value: number
}

export type NewOutcomeMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.NEW_OUTCOME
  tripId: string
  tripIndex: number
  tripPrompt: string
  ratName: string
  result: "survived" | "died"
  ratOwnerName: string
  ratValueChange: number
  // Balance (health) change: newRatBalance - oldRatBalance
  ratBalanceChange: number
  // Items the rat brought into the trip
  itemsOnEntrance: FeedItem[]
  // Items gained during the trip
  itemsGained: FeedItem[]
  // Items lost during the trip (not including death losses)
  itemsLost: FeedItem[]
  // Items lost on death (only if rat died)
  itemsLostOnDeath: FeedItem[]
}

export type FeedMessage = ChatMessage | NewTripMessage | NewOutcomeMessage
