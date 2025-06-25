export type SlideType = "text" | "image" | "video"

export type Slide = {
  type: SlideType
  text?: string
  content?: {
    source: string
  }
}
