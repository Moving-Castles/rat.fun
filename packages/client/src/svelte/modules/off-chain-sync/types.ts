import { ServerReturnValuePvP } from "@components/Nest/types"

export type MessageContent = {
  topic: "test" | "clients__update" | "pvp__outcome" | "pvp__update" | "room__creatorfee"
  message: ServerReturnValuePvP | string | string[]
}
