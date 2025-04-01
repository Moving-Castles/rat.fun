import { ServerReturnValue } from "@components/Main/RoomResult/types"

export type MessageContent = {
  topic: "test" | "clients__update" | "room__creatorfee"
  message: ServerReturnValue | string | string[]
}