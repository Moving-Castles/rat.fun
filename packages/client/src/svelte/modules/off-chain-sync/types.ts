export type MessageContent = {
  topic: "test" | "clients__update" | "room__outcome" | "rat__death"
  message: string | string[]
}