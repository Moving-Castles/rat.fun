import type { PlaySoundConfig } from "$lib/modules/sound"

export type TerminalOutputUnit = {
  type: "text" | "loader"
  content: string
  loaderCharacters?: string
  duration?: number
  typeSpeed?: number
  delayAfter?: number
  color: string
  backgroundColor: string
  sound?: PlaySoundConfig
  onChar?: (char: string, index: number) => void
}
