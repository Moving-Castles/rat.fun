import type { Player } from "tone"

export type Sound = {
  src: string
  volume: number
  sound?: Player
  author?: string
}

export type SoundAssets = {
  [index: string]: Sound
}

export type SoundLibrary = {
  [index: string]: SoundAssets
}

export type TimingOptions = {
  when?: number | string
  duration?: number | string
  fadeTime?: number
}
