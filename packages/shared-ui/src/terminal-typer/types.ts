export type PlaySoundFn = (config: { category: string; id: string }) => void

export type TerminalOutputUnit = {
  type: "text" | "loader"
  content: string
  loaderCharacters?: string
  duration?: number
  typeSpeed?: number
  delayAfter?: number
  color: string
  backgroundColor: string
  sound?: { category: string; id: string }
  typeMode?: "char" | "word"
  onType?: (text: string, index: number) => void
}
