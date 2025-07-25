export type WorldEvent = {
  index: number
  id: string
  workingTitle: string
  worldAddress: string
  state: "draft" | "initialised" | "published" | "activated"
  publication: {
    publicationTitle: string
    activationDateTime: string
    publicationText?: string
  }
  activation: {
    activationTitle: string
    prompt: string
    activationText: string
    duration: number
    image?: string
  }
}

export type SanityConfig = {
  projectId: string
  dataset: string
  token: string
  apiVersion: string
}
