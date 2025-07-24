export interface WorldEvent {
  index: number
  id: string
  workingTitle: string
  worldAddress: string
  state: "draft" | "initialised" | "announced" | "activated"
  announcement: {
    announcementTitle: string
    activationDateTime: string
    announcementText?: string
  }
  activation: {
    publicTitle: string
    prompt: string
    activationDateTime: string
    activationText: string
    duration: number
    image?: string
  }
}

export interface SanityConfig {
  projectId: string
  dataset: string
  token: string
  apiVersion: string
}
