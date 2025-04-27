import { ServerReturnValue } from "@components/Main/RoomResult/types"

export type MessageContent = {
  topic: "test" | "clients__update" | "room__outcome" | "rat__death"
  message: ServerReturnValue | string | string[]
}