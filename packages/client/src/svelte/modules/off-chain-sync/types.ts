import { ServerReturnValue } from "@components/Nest/types"

export type MessageContent = {
  topic: "test" | "clients__update" | "room__creatorfee"
  message: ServerReturnValue | string | string[]
}
