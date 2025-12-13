export enum FEED_MESSAGE_TYPE {
  CHAT = "chat",
  NEW_TRIP = "new_trip",
  NEW_OUTCOME = "new_outcome",
  PLAYER_JOINED = "player_joined"
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
}

export type NewOutcomeMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.NEW_OUTCOME
  tripId: string
  tripIndex: number
  ratName: string
  result: "survived" | "died"
  ratOwnerName: string
  ratOwnerValueChange: number
  tripCreatorName: string
  tripCreatorValueChange: number
}

export type PlayerJoinedMessage = BaseFeedMessage & {
  type: FEED_MESSAGE_TYPE.PLAYER_JOINED
  playerId: string
  playerName: string
}

export type FeedMessage = ChatMessage | NewTripMessage | NewOutcomeMessage | PlayerJoinedMessage
